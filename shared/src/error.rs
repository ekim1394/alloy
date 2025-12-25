//! Error types for Jules Mac Runner

use thiserror::Error;

/// Application-level errors
#[derive(Debug, Error)]
pub enum AppError {
    #[error("Job not found: {0}")]
    JobNotFound(uuid::Uuid),

    #[error("Worker not found: {0}")]
    WorkerNotFound(uuid::Uuid),

    #[error("No workers available")]
    NoWorkersAvailable,

    #[error("Authentication failed: {0}")]
    AuthenticationFailed(String),

    #[error("Invalid request: {0}")]
    InvalidRequest(String),

    #[error("Database error: {0}")]
    Database(String),

    #[error("VM error: {0}")]
    VmError(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

/// API error response format
#[derive(Debug, serde::Serialize)]
pub struct ApiError {
    pub error: String,
    pub code: String,
}

impl ApiError {
    pub fn new(error: impl Into<String>, code: impl Into<String>) -> Self {
        Self {
            error: error.into(),
            code: code.into(),
        }
    }
}

impl From<AppError> for ApiError {
    fn from(err: AppError) -> Self {
        let code = match &err {
            AppError::JobNotFound(_) => "job_not_found",
            AppError::WorkerNotFound(_) => "worker_not_found",
            AppError::NoWorkersAvailable => "no_workers",
            AppError::AuthenticationFailed(_) => "auth_failed",
            AppError::InvalidRequest(_) => "invalid_request",
            AppError::Database(_) => "database_error",
            AppError::VmError(_) => "vm_error",
            AppError::Internal(_) => "internal_error",
        };
        Self::new(err.to_string(), code)
    }
}
