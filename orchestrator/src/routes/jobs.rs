//! Job management endpoints

use axum::{
    extract::{Extension, Path, State},
    http::StatusCode,
    Json,
};
use serde::Deserialize;
use uuid::Uuid;

use shared::{ApiError, CreateJobRequest, CreateJobResponse, Job, JobStatus, SourceType, UploadUrlResponse};
use crate::auth::AuthUser;
use crate::state::AppState;

/// POST /api/v1/jobs - Create a new build job
pub async fn create_job(
    State(state): State<AppState>,
    Extension(user): Extension<AuthUser>,
    Json(request): Json<CreateJobRequest>,
) -> Result<(StatusCode, Json<CreateJobResponse>), (StatusCode, Json<ApiError>)> {
    // Validate request - need either command or script
    if request.command.is_none() && request.script.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiError::new("Either 'command' or 'script' is required", "validation_error")),
        ));
    }

    let customer_id = user.user_id;
    
    // Create the job based on command or script
    let job = if let Some(ref script) = request.script {
        Job::with_script(
            customer_id,
            script.clone(),
            request.source_type,
            request.source_url.clone(),
        )
    } else {
        Job::with_command(
            customer_id,
            request.command.clone().unwrap(),
            request.source_type,
            request.source_url.clone(),
        )
    };
    
    // Store in Supabase
    match state.supabase.create_job(&job).await {
        Ok(_) => {
            // Create a log stream for this job
            state.create_log_stream(job.id).await;
            
            let stream_url = format!("{}/api/v1/jobs/{}/logs", state.config.base_url, job.id);
            
            tracing::info!(job_id = %job.id, "Created new job");
            
            Ok((
                StatusCode::CREATED,
                Json(CreateJobResponse {
                    job_id: job.id,
                    status: job.status,
                    stream_url,
                }),
            ))
        }
        Err(e) => {
            tracing::error!("Failed to create job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// Request body for upload URL
#[derive(Debug, Deserialize)]
pub struct UploadRequest {
    /// Command to execute (use this OR script)
    pub command: Option<String>,
    /// Script content to execute (use this OR command)
    pub script: Option<String>,
    /// Git commit SHA (for archive deduplication)
    pub commit_sha: Option<String>,
}

/// POST /api/v1/jobs/upload - Request an upload URL for local files
pub async fn request_upload(
    State(state): State<AppState>,
    Extension(user): Extension<AuthUser>,
    Json(request): Json<UploadRequest>,
) -> Result<(StatusCode, Json<UploadUrlResponse>), (StatusCode, Json<ApiError>)> {
    // Validate request
    if request.command.is_none() && request.script.is_none() {
        return Err((
            StatusCode::BAD_REQUEST,
            Json(ApiError::new("Either 'command' or 'script' is required", "validation_error")),
        ));
    }

    let customer_id = user.user_id;
    let job_id = Uuid::new_v4();
    
    // Use commit_sha for storage path if provided (enables deduplication)
    // Same commit = same archive file in storage
    let storage_key = request.commit_sha.as_ref()
        .map(|sha| format!("sources/{}.zip", sha))
        .unwrap_or_else(|| format!("sources/{}.zip", job_id));
    
    // Check if archive already exists (enables skip_upload for deduplication)
    let archive_exists = if request.commit_sha.is_some() {
        let check_url = format!("{}/storage/v1/object/public/{}", state.config.supabase_url, storage_key);
        let http_client = reqwest::Client::new();
        match http_client.head(&check_url).send().await {
            Ok(resp) => resp.status().is_success(),
            Err(_) => false,
        }
    } else {
        false
    };
    
    if archive_exists {
        tracing::info!(storage_key = %storage_key, "Archive already exists, skip_upload enabled");
    }
    
    // CLI uploads to orchestrator, which proxies to Supabase (keeps service key secure)
    let upload_url = format!("{}/api/v1/jobs/{}/upload", state.config.base_url, job_id);
    // Download URL is public Supabase storage
    let download_url = format!("{}/storage/v1/object/public/{}", state.config.supabase_url, storage_key);
    
    // Create job based on command or script
    let mut job = if let Some(ref script) = request.script {
        Job::with_script(
            customer_id,
            script.clone(),
            SourceType::Upload,
            Some(download_url.clone()),
        )
    } else {
        Job::with_command(
            customer_id,
            request.command.clone().unwrap(),
            SourceType::Upload,
            Some(download_url.clone()),
        )
    };
    job.id = job_id;
    
    match state.supabase.create_job(&job).await {
        Ok(_) => {
            tracing::info!(job_id = %job.id, "Created upload job, awaiting file upload");
            
            Ok((
                StatusCode::CREATED,
                Json(UploadUrlResponse {
                    upload_url,
                    download_url,
                    job_id,
                    upload_token: state.config.supabase_key.clone(),
                    skip_upload: archive_exists,
                }),
            ))
        }
        Err(e) => {
            tracing::error!("Failed to create upload job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// POST /api/v1/jobs/:job_id/start - Start a job after upload is complete
pub async fn start_job(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<CreateJobResponse>, (StatusCode, Json<ApiError>)> {
    // Verify job exists and is in pending status
    match state.supabase.get_job(job_id).await {
        Ok(Some(job)) => {
            // If job is already running (worker claimed it), that's ok - just return success
            if job.status == JobStatus::Running {
                let stream_url = format!("{}/api/v1/jobs/{}/logs", state.config.base_url, job.id);
                tracing::info!(job_id = %job.id, "Job already running (worker claimed it)");
                return Ok(Json(CreateJobResponse {
                    job_id: job.id,
                    status: job.status,
                    stream_url,
                }));
            }
            
            if job.status != JobStatus::Pending {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiError::new(
                        format!("Job is in {:?} status, expected pending or running", job.status),
                        "invalid_state"
                    )),
                ));
            }
            
            // Create log stream
            state.create_log_stream(job.id).await;
            
            let stream_url = format!("{}/api/v1/jobs/{}/logs", state.config.base_url, job.id);
            
            tracing::info!(job_id = %job.id, "Job started, ready for worker pickup");
            
            Ok(Json(CreateJobResponse {
                job_id: job.id,
                status: job.status,
                stream_url,
            }))
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(format!("Job {} not found", job_id), "job_not_found")),
        )),
        Err(e) => {
            tracing::error!("Failed to get job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// Query params for listing jobs
#[derive(Debug, Deserialize)]
pub struct ListJobsQuery {
    /// Optional status filter
    pub status: Option<String>,
    /// Max number of jobs to return (default: 20)
    pub limit: Option<usize>,
}

/// GET /api/v1/jobs - List recent jobs
pub async fn list_jobs(
    State(state): State<AppState>,
    axum::extract::Query(query): axum::extract::Query<ListJobsQuery>,
) -> Result<Json<Vec<Job>>, (StatusCode, Json<ApiError>)> {
    let limit = query.limit.unwrap_or(20).min(100); // Cap at 100
    
    match state.supabase.list_jobs(query.status.as_deref(), limit).await {
        Ok(jobs) => Ok(Json(jobs)),
        Err(e) => {
            tracing::error!("Failed to list jobs: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// GET /api/v1/jobs/:job_id - Get job status
pub async fn get_job(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Job>, (StatusCode, Json<ApiError>)> {
    match state.supabase.get_job(job_id).await {
        Ok(Some(job)) => Ok(Json(job)),
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(format!("Job {} not found", job_id), "job_not_found")),
        )),
        Err(e) => {
            tracing::error!("Failed to get job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// GET /api/v1/jobs/:job_id/artifacts - Get job artifacts
pub async fn get_artifacts(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Vec<shared::Artifact>>, (StatusCode, Json<ApiError>)> {
    match state.supabase.get_job_artifacts(job_id).await {
        Ok(artifacts) => Ok(Json(artifacts)),
        Err(e) => {
            tracing::error!("Failed to get artifacts: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// PUT /api/v1/jobs/:job_id/upload - Upload source archive (proxied to Supabase Storage)
pub async fn upload_archive(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
    body: axum::body::Bytes,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    // Get the job to find the correct storage path from source_url
    let job = state.supabase.get_job(job_id).await
        .map_err(|e| {
            tracing::error!("Failed to get job for upload: {}", e);
            (StatusCode::INTERNAL_SERVER_ERROR, Json(ApiError::new(e.to_string(), "database_error")))
        })?
        .ok_or_else(|| {
            (StatusCode::NOT_FOUND, Json(ApiError::new("Job not found", "job_not_found")))
        })?;
    
    // Extract storage path from source_url (e.g., "https://...supabase.co/storage/v1/object/public/sources/abc123.zip")
    let source_url = job.source_url
        .ok_or_else(|| (StatusCode::BAD_REQUEST, Json(ApiError::new("Job has no source URL", "no_source_url"))))?;
    
    // Extract the path after "/public/" or use job_id as fallback
    let upload_path = source_url
        .split("/object/public/")
        .nth(1)
        .unwrap_or(&format!("sources/{}.zip", job_id))
        .to_string();
    
    // Proxy upload to Supabase Storage
    let storage_url = format!(
        "{}/storage/v1/object/{}",
        state.config.supabase_url,
        upload_path
    );
    
    let client = reqwest::Client::new();
    let response = client
        .put(&storage_url)
        .header("apikey", &state.config.supabase_key)
        .header("Authorization", format!("Bearer {}", state.config.supabase_key))
        .header("Content-Type", "application/zip")
        .body(body.to_vec())
        .send()
        .await
        .map_err(|e| {
            tracing::error!("Failed to upload to storage: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "storage_error")),
            )
        })?;

    if !response.status().is_success() {
        let error_text = response.text().await.unwrap_or_default();
        tracing::error!("Storage upload failed: {}", error_text);
        return Err((
            StatusCode::BAD_GATEWAY,
            Json(ApiError::new(error_text, "storage_upload_failed")),
        ));
    }

    tracing::info!(job_id = %job_id, "Archive uploaded successfully");
    Ok(StatusCode::OK)
}

/// POST /api/v1/jobs/:job_id/cancel - Cancel a running job
pub async fn cancel_job(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    // Get the job to check its status
    match state.supabase.get_job(job_id).await {
        Ok(Some(job)) => {
            // Can only cancel pending or running jobs
            if job.status != JobStatus::Pending && job.status != JobStatus::Running {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiError::new(
                        format!("Cannot cancel job in {} status", job.status),
                        "invalid_state",
                    )),
                ));
            }
            
            // Update job status to cancelled
            match state.supabase.update_job_status(job_id, JobStatus::Cancelled).await {
                Ok(_) => {
                    tracing::info!(job_id = %job_id, "Job cancelled");
                    Ok(StatusCode::OK)
                }
                Err(e) => {
                    tracing::error!("Failed to cancel job: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiError::new(e.to_string(), "database_error")),
                    ))
                }
            }
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(format!("Job {} not found", job_id), "job_not_found")),
        )),
        Err(e) => {
            tracing::error!("Failed to get job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}

/// Response for retry job
#[derive(Debug, serde::Serialize)]
pub struct RetryJobResponse {
    pub new_job_id: Uuid,
    pub original_job_id: Uuid,
}

/// POST /api/v1/jobs/:job_id/retry - Retry a failed or cancelled job
pub async fn retry_job(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<(StatusCode, Json<RetryJobResponse>), (StatusCode, Json<ApiError>)> {
    // Get the original job
    match state.supabase.get_job(job_id).await {
        Ok(Some(original)) => {
            // Can only retry failed or cancelled jobs
            if original.status != JobStatus::Failed && original.status != JobStatus::Cancelled {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiError::new(
                        format!("Cannot retry job in {} status (only failed/cancelled)", original.status),
                        "invalid_state",
                    )),
                ));
            }
            
            // Create new job with same parameters
            let mut new_job = if let Some(ref script) = original.script {
                Job::with_script(
                    original.customer_id,
                    script.clone(),
                    original.source_type.clone(),
                    original.source_url.clone(),
                )
            } else if let Some(ref command) = original.command {
                Job::with_command(
                    original.customer_id,
                    command.clone(),
                    original.source_type.clone(),
                    original.source_url.clone(),
                )
            } else {
                return Err((
                    StatusCode::BAD_REQUEST,
                    Json(ApiError::new("Original job has no command or script", "invalid_job")),
                ));
            };
            
            // Set status to pending so it gets picked up
            new_job.status = JobStatus::Pending;
            
            match state.supabase.create_job(&new_job).await {
                Ok(_) => {
                    tracing::info!(new_job_id = %new_job.id, original_job_id = %job_id, "Job retried");
                    Ok((
                        StatusCode::CREATED,
                        Json(RetryJobResponse {
                            new_job_id: new_job.id,
                            original_job_id: job_id,
                        }),
                    ))
                }
                Err(e) => {
                    tracing::error!("Failed to create retry job: {}", e);
                    Err((
                        StatusCode::INTERNAL_SERVER_ERROR,
                        Json(ApiError::new(e.to_string(), "database_error")),
                    ))
                }
            }
        }
        Ok(None) => Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(format!("Job {} not found", job_id), "job_not_found")),
        )),
        Err(e) => {
            tracing::error!("Failed to get job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        }
    }
}
