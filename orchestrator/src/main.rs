//! Jules Mac Runner Orchestrator
//! 
//! The main API server that handles job submissions, worker coordination,
//! and log streaming for the macOS CI/CD platform.

mod config;
mod routes;
mod services;
mod state;
mod auth;
pub mod db;

use std::net::SocketAddr;
use axum::Router;
use axum::extract::DefaultBodyLimit;
use axum::http::{HeaderValue, Method};
use tower_http::cors::{CorsLayer, Any};
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::state::AppState;

/// Build CORS layer based on environment
/// - If CORS_ORIGINS is set, allow only those origins
/// - Otherwise, use permissive mode (for local development)
fn build_cors_layer() -> CorsLayer {
    if let Ok(origins) = std::env::var("CORS_ORIGINS") {
        let allowed_origins: Vec<HeaderValue> = origins
            .split(',')
            .filter_map(|s| s.trim().parse().ok())
            .collect();
        
        if !allowed_origins.is_empty() {
            tracing::info!("CORS configured for: {}", origins);
            return CorsLayer::new()
                .allow_origin(allowed_origins)
                .allow_methods([Method::GET, Method::POST, Method::PUT, Method::DELETE, Method::OPTIONS])
                .allow_headers(Any)
                .allow_credentials(true);
        }
    }
    
    tracing::warn!("CORS: Permissive mode (set CORS_ORIGINS for production)");
    CorsLayer::permissive()
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(tracing_subscriber::EnvFilter::try_from_default_env()
            .unwrap_or_else(|_| "orchestrator=debug,tower_http=debug".into()))
        .with(tracing_subscriber::fmt::layer())
        .init();

    // Load configuration
    let config = Config::from_env()?;
    
    tracing::info!("Starting Alloy Orchestrator");
    tracing::info!("Supabase URL: {}", config.supabase_url);

    // Create application state
    let state = AppState::new(config.clone()).await?;
    
    // Log worker auth status
    if config.worker_secret_key.is_some() {
        tracing::info!("Worker authentication enabled (WORKER_SECRET_KEY is set)");
    } else {
        tracing::warn!("Worker authentication disabled (WORKER_SECRET_KEY not set)");
    }

    // Build worker routes with authentication middleware
    let worker_router = routes::worker_routes()
        .layer(axum::middleware::from_fn_with_state(
            state.clone(),
            auth::worker_auth_middleware,
        ));

    // Build router with increased body limit for large archive uploads (2GB)
    let app = Router::new()
        .merge(routes::api_routes())
        .merge(worker_router)
        .layer(DefaultBodyLimit::max(2 * 1024 * 1024 * 1024)) // 2GB limit
        .layer(TraceLayer::new_for_http())
        .layer(build_cors_layer())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
