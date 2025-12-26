//! API key management routes

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::auth::{self, AuthUser, CreateApiKeyRequest, CreateApiKeyResponse};
use crate::services::supabase::ApiKeyInfo;
use crate::state::AppState;
use shared::ApiError;

/// POST /api/v1/auth/keys - Create a new API key
pub async fn create_api_key(
    State(state): State<AppState>,
    user: AuthUser,
    Json(request): Json<CreateApiKeyRequest>,
) -> Result<(StatusCode, Json<CreateApiKeyResponse>), (StatusCode, Json<ApiError>)> {
    // Generate new API key
    let (raw_key, key_hash) = auth::generate_api_key();

    // Store in database
    match state
        .supabase
        .create_api_key(user.user_id, &request.name, &key_hash)
        .await
    {
        Ok(key_id) => {
            tracing::info!(user_id = %user.user_id, key_id = %key_id, "Created new API key");

            Ok((
                StatusCode::CREATED,
                Json(CreateApiKeyResponse {
                    id: key_id,
                    name: request.name,
                    key: raw_key, // Only returned once!
                }),
            ))
        },
        Err(e) => {
            tracing::error!("Failed to create API key: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        },
    }
}

/// GET /api/v1/auth/keys - List user's API keys
pub async fn list_api_keys(
    State(state): State<AppState>,
    user: AuthUser,
) -> Result<Json<Vec<ApiKeyInfo>>, (StatusCode, Json<ApiError>)> {
    match state.supabase.list_api_keys(user.user_id).await {
        Ok(keys) => Ok(Json(keys)),
        Err(e) => {
            tracing::error!("Failed to list API keys: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        },
    }
}

/// DELETE /api/v1/auth/keys/:key_id - Delete an API key
pub async fn delete_api_key(
    State(state): State<AppState>,
    user: AuthUser,
    Path(key_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    match state.supabase.delete_api_key(user.user_id, key_id).await {
        Ok(true) => {
            tracing::info!(user_id = %user.user_id, key_id = %key_id, "Deleted API key");
            Ok(StatusCode::NO_CONTENT)
        },
        Ok(false) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new("API key not found", "not_found")),
        )),
        Err(e) => {
            tracing::error!("Failed to delete API key: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        },
    }
}

/// GET /api/v1/auth/me - Get current user info
#[derive(Serialize)]
pub struct CurrentUser {
    pub user_id: Uuid,
    pub email: Option<String>,
    pub auth_type: String,
}

pub async fn get_current_user(user: AuthUser) -> Json<CurrentUser> {
    Json(CurrentUser {
        user_id: user.user_id,
        email: user.email.clone(),
        auth_type: format!("{:?}", user.auth_type),
    })
}

// --- Simple email/password auth for local mode ---

#[derive(Debug, Deserialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct LoginResponse {
    pub token: String,
    pub user_id: Uuid,
}

/// POST /api/v1/auth/login - Login with email/password
pub async fn login(
    State(state): State<AppState>,
    Json(request): Json<LoginRequest>,
) -> Result<Json<LoginResponse>, (StatusCode, Json<ApiError>)> {
    match state
        .supabase
        .verify_user(&request.email, &request.password)
        .await
    {
        Ok(Some(user_id)) => {
            // Generate a simple token (API key format)
            let (token, _) = auth::generate_api_key();

            // Store as session (reuse API key table for simplicity)
            let _ = state
                .supabase
                .create_api_key(user_id, "session", &token)
                .await;

            Ok(Json(LoginResponse { token, user_id }))
        },
        Ok(None) => Err((
            StatusCode::UNAUTHORIZED,
            Json(ApiError::new(
                "Invalid email or password",
                "invalid_credentials",
            )),
        )),
        Err(e) => {
            tracing::error!("Login failed: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new("Login failed", "auth_error")),
            ))
        },
    }
}

#[derive(Debug, Deserialize)]
pub struct RegisterRequest {
    pub email: String,
    pub password: String,
}

/// POST /api/v1/auth/register - Register a new user
pub async fn register(
    State(state): State<AppState>,
    Json(request): Json<RegisterRequest>,
) -> Result<(StatusCode, Json<LoginResponse>), (StatusCode, Json<ApiError>)> {
    // Hash password with Argon2id (production-ready)
    let password_hash = crate::crypto::hash_password(&request.password).map_err(|e| {
        tracing::error!("Password hashing failed: {}", e);
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiError::new("Registration failed", "crypto_error")),
        )
    })?;

    match state
        .supabase
        .create_user(&request.email, &password_hash)
        .await
    {
        Ok(user_id) => {
            // Auto-login after registration
            let (token, _) = auth::generate_api_key();
            let _ = state
                .supabase
                .create_api_key(user_id, "session", &token)
                .await;

            tracing::info!(user_id = %user_id, email = %request.email, "User registered");

            Ok((StatusCode::CREATED, Json(LoginResponse { token, user_id })))
        },
        Err(e) => {
            tracing::error!("Registration failed: {}", e);
            if e.to_string().contains("UNIQUE") {
                return Err((
                    StatusCode::CONFLICT,
                    Json(ApiError::new("Email already registered", "email_exists")),
                ));
            }
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new("Registration failed", "auth_error")),
            ))
        },
    }
}
