//! Authentication middleware using Supabase Auth

use axum::{
    extract::{Request, State},
    http::{header, StatusCode},
    middleware::Next,
    response::Response,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use shared::ApiError;
use crate::state::AppState;

/// Authenticated user information extracted from JWT or API key
#[derive(Debug, Clone)]
pub struct AuthUser {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub auth_type: AuthType,
}

#[derive(Debug, Clone)]
pub enum AuthType {
    /// Supabase JWT token
    Jwt,
    /// API key for programmatic access
    ApiKey,
}

/// Claims from Supabase JWT token
#[derive(Debug, Deserialize)]
struct JwtClaims {
    sub: String,  // User ID
    email: Option<String>,
    exp: i64,
}

/// API key record from database
#[derive(Debug, Deserialize)]
pub struct ApiKeyRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub key_hash: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Authentication middleware
pub async fn auth_middleware(
    State(state): State<AppState>,
    mut request: Request,
    next: Next,
) -> Result<Response, (StatusCode, Json<ApiError>)> {
    let auth_header = request
        .headers()
        .get(header::AUTHORIZATION)
        .and_then(|h| h.to_str().ok());

    let auth_user = match auth_header {
        Some(header) if header.starts_with("Bearer ") => {
            let token = &header[7..];
            verify_jwt(&state, token).await?
        }
        Some(header) if header.starts_with("ApiKey ") => {
            let key = &header[7..];
            verify_api_key(&state, key).await?
        }
        _ => {
            return Err((
                StatusCode::UNAUTHORIZED,
                Json(ApiError::new(
                    "Missing or invalid Authorization header. Use 'Bearer <jwt>' or 'ApiKey <key>'",
                    "unauthorized",
                )),
            ));
        }
    };

    // Insert auth user into request extensions
    request.extensions_mut().insert(auth_user);
    
    Ok(next.run(request).await)
}

/// Verify Supabase JWT token
async fn verify_jwt(state: &AppState, token: &str) -> Result<AuthUser, (StatusCode, Json<ApiError>)> {
    // Supabase JWTs can be verified by calling the Supabase Auth API
    // or by verifying the signature locally with the JWT secret
    
    let response = state.client
        .get(format!("{}/auth/v1/user", state.config.supabase_url))
        .header("apikey", &state.config.supabase_key)
        .header("Authorization", format!("Bearer {}", token))
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to verify JWT: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new("Failed to verify token", "auth_error")),
            )
        })?;

    if !response.status().is_success() {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(ApiError::new("Invalid or expired token", "invalid_token")),
        ));
    }

    #[derive(Deserialize)]
    struct SupabaseUser {
        id: Uuid,
        email: Option<String>,
    }

    let user: SupabaseUser = response.json().await.map_err(|e| {
        tracing::error!("Failed to parse user response: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiError::new("Failed to parse auth response", "auth_error")),
        )
    })?;

    Ok(AuthUser {
        user_id: user.id,
        email: user.email,
        auth_type: AuthType::Jwt,
    })
}

/// Verify API key against database
async fn verify_api_key(state: &AppState, key: &str) -> Result<AuthUser, (StatusCode, Json<ApiError>)> {
    // API keys are stored as hashed values in the database
    // We hash the incoming key and compare
    let key_hash = hash_api_key(key);
    
    match state.supabase.verify_api_key(&key_hash).await {
        Ok(Some(record)) => {
            // Update last_used_at
            let _ = state.supabase.update_api_key_usage(record.id).await;
            
            Ok(AuthUser {
                user_id: record.user_id,
                email: None,
                auth_type: AuthType::ApiKey,
            })
        }
        Ok(None) => Err((
            StatusCode::UNAUTHORIZED,
            Json(ApiError::new("Invalid API key", "invalid_api_key")),
        )),
        Err(e) => {
            tracing::error!("Failed to verify API key: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new("Failed to verify API key", "auth_error")),
            ))
        }
    }
}

/// Hash an API key for storage/comparison
fn hash_api_key(key: &str) -> String {
    use std::collections::hash_map::DefaultHasher;
    use std::hash::{Hash, Hasher};
    
    // In production, use a proper cryptographic hash like SHA-256
    let mut hasher = DefaultHasher::new();
    key.hash(&mut hasher);
    format!("{:x}", hasher.finish())
}

/// Generate a new API key (returns the raw key - only shown once)
pub fn generate_api_key() -> (String, String) {
    let raw_key = format!("jmr_{}", Uuid::new_v4().to_string().replace("-", ""));
    let hash = hash_api_key(&raw_key);
    (raw_key, hash)
}

/// Request body for creating an API key
#[derive(Debug, Deserialize)]
pub struct CreateApiKeyRequest {
    pub name: String,
}

/// Response with the new API key
#[derive(Debug, Serialize)]
pub struct CreateApiKeyResponse {
    pub id: Uuid,
    pub name: String,
    /// The raw API key - only returned once!
    pub key: String,
}
