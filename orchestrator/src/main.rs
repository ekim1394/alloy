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
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::state::AppState;

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
    let state = AppState::new(config).await?;

    // Build router with increased body limit for large archive uploads (2GB)
    let app = Router::new()
        .merge(routes::api_routes())
        .layer(DefaultBodyLimit::max(2 * 1024 * 1024 * 1024)) // 2GB limit
        .layer(TraceLayer::new_for_http())
        .layer(CorsLayer::permissive())
        .with_state(state);

    // Start server
    let addr = SocketAddr::from(([0, 0, 0, 0], 3000));
    tracing::info!("Listening on {}", addr);
    
    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
