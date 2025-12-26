//! Log streaming endpoints

use axum::{
    extract::{
        ws::{Message, WebSocket, WebSocketUpgrade},
        Path, State,
    },
    http::StatusCode,
    response::IntoResponse,
    Json,
};
use futures_util::{SinkExt, StreamExt};
use uuid::Uuid;

use crate::state::AppState;
use shared::{ApiError, LogEntry};

/// GET /`api/v1/jobs/:job_id/logs` - Stream logs via WebSocket
pub async fn stream_logs(
    ws: WebSocketUpgrade,
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> impl IntoResponse {
    ws.on_upgrade(move |socket| handle_log_stream(socket, state, job_id))
}

async fn handle_log_stream(socket: WebSocket, state: AppState, job_id: Uuid) {
    let (mut sender, mut receiver) = socket.split();

    // Get or wait for the log stream for this job
    let Some(log_tx) = state.get_log_stream(job_id).await else {
        // Job might not exist or already completed
        let _ = sender
            .send(Message::Text(
                serde_json::to_string(&serde_json::json!({
                    "error": "Job not found or already completed"
                }))
                .unwrap(),
            ))
            .await;
        return;
    };

    let mut log_rx = log_tx.subscribe();

    // Spawn task to forward logs to client
    let send_task = tokio::spawn(async move {
        while let Ok(log) = log_rx.recv().await {
            if sender.send(Message::Text(log)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages (like close)
    while let Some(msg) = receiver.next().await {
        match msg {
            Ok(Message::Close(_)) | Err(_) => break,
            _ => {},
        }
    }

    send_task.abort();
}

/// POST /`api/v1/workers/:worker_id/log` - Push log entry from worker
pub async fn push_log(
    State(state): State<AppState>,
    Json(entry): Json<LogEntry>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    if let Some(tx) = state.get_log_stream(entry.job_id).await {
        let log_json = serde_json::to_string(&entry).unwrap();
        let _ = tx.send(log_json);
    }
    Ok(StatusCode::OK)
}

/// GET /`api/v1/jobs/:job_id/logs/stored` - Get stored logs for a job
pub async fn get_stored_logs(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
) -> Result<Json<Vec<shared::JobLog>>, (StatusCode, Json<ApiError>)> {
    // Try to get the log file from storage
    // Path: logs/{job_id}.log
    state.supabase.download_log_file(job_id).await.map_or_else(
        |_| Ok(Json(vec![])),
        |content| {
            // Parse content line by line into JobLog entries
            // Format in file: "[STDOUT] line content" or just content
            let logs: Vec<shared::JobLog> = content
                .lines()
                .map(|line| {
                    // Try to parse stream type if present, otherwise default to stdout
                    let (_stream, content) = line.strip_prefix("[STDOUT] ").map_or_else(
                        || {
                            line.strip_prefix("[STDERR] ")
                                .map_or((shared::LogStream::Stdout, line), |stripped| {
                                    (shared::LogStream::Stderr, stripped)
                                })
                        },
                        |stripped| (shared::LogStream::Stdout, stripped),
                    );

                    shared::JobLog {
                        id: Uuid::new_v4(), // Ephemeral ID
                        job_id,
                        content: content.to_string(),
                        created_at: chrono::Utc::now(), // We don't have timestamps in simple log file yet
                    }
                })
                .collect();

            Ok(Json(logs))
        },
    )
}

/// POST /`api/v1/jobs/:job_id/logs/upload` - Upload complete log file
pub async fn upload_logs(
    State(state): State<AppState>,
    Path(job_id): Path<Uuid>,
    body: axum::body::Bytes,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    match state.supabase.upload_log_file(job_id, body.to_vec()).await {
        Ok(()) => Ok(StatusCode::OK),
        Err(e) => {
            tracing::error!("Failed to upload log file: {}", e);
            Err((
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiError::new(e.to_string(), "upload_error")),
            ))
        },
    }
}
