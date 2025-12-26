//! Worker management endpoints

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use chrono::Utc;
use uuid::Uuid;

use crate::state::AppState;
use shared::{
    ApiError, ClaimJobRequest, Job, JobResult, JobStatus, RegisterWorkerRequest,
    RegisterWorkerResponse, WorkerHeartbeat, WorkerInfo, WorkerStatus,
};

/// POST /api/v1/workers/register - Register a new worker
pub async fn register_worker(
    State(state): State<AppState>,
    Json(request): Json<RegisterWorkerRequest>,
) -> Result<(StatusCode, Json<RegisterWorkerResponse>), (StatusCode, Json<ApiError>)> {
    let worker_id = Uuid::new_v4();
    let token = Uuid::new_v4().to_string(); // Simple token for now

    let worker = WorkerInfo {
        id: worker_id,
        hostname: request.hostname.clone(),
        capacity: request.capacity,
        current_jobs: 0,
        last_heartbeat: Utc::now(),
        status: WorkerStatus::Online,
    };

    // Store in memory cache
    state
        .workers
        .write()
        .await
        .insert(worker_id, worker.clone());

    // Also persist to Supabase
    if let Err(e) = state.supabase.register_worker(&worker).await {
        tracing::warn!("Failed to persist worker to DB: {}", e);
    }

    tracing::info!(worker_id = %worker_id, hostname = %request.hostname, "Worker registered");

    Ok((
        StatusCode::CREATED,
        Json(RegisterWorkerResponse { worker_id, token }),
    ))
}

/// POST /api/v1/workers/heartbeat - Worker heartbeat
pub async fn heartbeat(
    State(state): State<AppState>,
    Json(request): Json<WorkerHeartbeat>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    let mut workers = state.workers.write().await;

    if let Some(worker) = workers.get_mut(&request.worker_id) {
        worker.last_heartbeat = Utc::now();
        worker.current_jobs = request.current_jobs;
        worker.status = if request.current_jobs >= request.capacity {
            WorkerStatus::Busy
        } else {
            WorkerStatus::Online
        };
        Ok(StatusCode::OK)
    } else {
        Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(
                format!("Worker {} not found", request.worker_id),
                "worker_not_found",
            )),
        ))
    }
}

/// POST /api/v1/workers/claim - Worker claims a pending job
pub async fn claim_job(
    State(state): State<AppState>,
    Json(request): Json<ClaimJobRequest>,
) -> Result<Json<Option<Job>>, (StatusCode, Json<ApiError>)> {
    // Find a pending job and assign it to this worker
    match state.supabase.claim_pending_job(request.worker_id).await {
        Ok(job) => {
            if let Some(ref j) = job {
                tracing::info!(job_id = %j.id, worker_id = %request.worker_id, "Job claimed");
            }
            Ok(Json(job))
        },
        Err(e) => {
            tracing::error!("Failed to claim job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        },
    }
}

/// POST /`api/v1/workers/:worker_id/complete` - Mark a job as complete
pub async fn complete_job(
    State(state): State<AppState>,
    Path(worker_id): Path<Uuid>,
    Json(result): Json<JobResult>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    // Update job status
    let status = if result.exit_code == 0 {
        JobStatus::Completed
    } else {
        JobStatus::Failed
    };

    match state
        .supabase
        .complete_job(
            result.job_id,
            status,
            result.exit_code,
            result.build_minutes,
        )
        .await
    {
        Ok(()) => {
            // Send completion message via log stream before closing
            if let Some(tx) = state.get_log_stream(result.job_id).await {
                let completion_msg = serde_json::json!({
                    "type": "job_complete",
                    "job_id": result.job_id.to_string(),
                    "status": format!("{:?}", status),
                    "exit_code": result.exit_code,
                    "build_minutes": result.build_minutes,
                    "artifacts_count": result.artifacts.len(),
                });
                let _ = tx.send(completion_msg.to_string());
            }

            // Clean up log stream
            state.remove_log_stream(result.job_id).await;

            // Upload artifacts if any
            for artifact in result.artifacts {
                if let Err(e) = state
                    .supabase
                    .store_artifact(result.job_id, &artifact)
                    .await
                {
                    tracing::warn!("Failed to store artifact: {}", e);
                }
            }

            tracing::info!(
                job_id = %result.job_id,
                worker_id = %worker_id,
                exit_code = result.exit_code,
                "Job completed"
            );

            Ok(StatusCode::OK)
        },
        Err(e) => {
            tracing::error!("Failed to complete job: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "database_error")),
            ))
        },
    }
}
