//! API route definitions

mod auth_routes;
mod health;
mod jobs;
mod logs;
mod workers;

use crate::state::AppState;
use axum::{
    routing::{delete, get, post, put},
    Router,
};

/// Worker routes (middleware applied separately in main.rs)
pub fn worker_routes() -> Router<AppState> {
    Router::new()
        .route("/api/v1/workers/register", post(workers::register_worker))
        .route("/api/v1/workers/heartbeat", post(workers::heartbeat))
        .route("/api/v1/workers/claim", post(workers::claim_job))
        .route(
            "/api/v1/workers/:worker_id/complete",
            post(workers::complete_job),
        )
        .route(
            "/api/v1/workers/:worker_id/deregister",
            post(workers::deregister_worker),
        )
        .route("/api/v1/workers/:worker_id/log", post(logs::push_log))
        // Worker artifact upload
        .route(
            "/api/v1/jobs/:job_id/artifacts/:filename",
            post(jobs::upload_artifact),
        )
}

/// All API routes (except workers, which are merged separately with middleware)
/// Note: Auth middleware is applied at the handler level via extractors
/// rather than as a layer to allow mixing public/protected routes
pub fn api_routes() -> Router<AppState> {
    Router::new()
        // Health check (public)
        .route("/health", get(health::health_check))
        // Job management (requires auth - will be enforced by extractor)
        .route("/api/v1/jobs", get(jobs::list_jobs).post(jobs::create_job))
        .route("/api/v1/jobs/upload", post(jobs::request_upload))
        .route("/api/v1/jobs/:job_id", get(jobs::get_job))
        .route("/api/v1/jobs/:job_id/upload", put(jobs::upload_archive))
        .route("/api/v1/jobs/:job_id/start", post(jobs::start_job))
        .route("/api/v1/jobs/:job_id/cancel", post(jobs::cancel_job))
        .route("/api/v1/jobs/:job_id/retry", post(jobs::retry_job))
        .route("/api/v1/jobs/:job_id/logs", get(logs::stream_logs))
        .route(
            "/api/v1/jobs/:job_id/logs/stored",
            get(logs::get_stored_logs),
        )
        .route("/api/v1/jobs/:job_id/logs/upload", put(logs::upload_logs))
        .route("/api/v1/jobs/:job_id/artifacts", get(jobs::get_artifacts))
        // Auth/API key management (requires auth)
        .route("/api/v1/auth/me", get(auth_routes::get_current_user))
        .route("/api/v1/api-keys", post(auth_routes::create_api_key))
        .route("/api/v1/api-keys", get(auth_routes::list_api_keys))
        .route(
            "/api/v1/api-keys/:key_id",
            delete(auth_routes::delete_api_key),
        )
        // Public auth endpoints
        .route("/api/v1/auth/login", post(auth_routes::login))
        .route("/api/v1/auth/register", post(auth_routes::register))
}
