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

use shared::{ApiError, LogEntry};
use crate::state::AppState;

/// GET /api/v1/jobs/:job_id/logs - Stream logs via WebSocket
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
    let log_tx = match state.get_log_stream(job_id).await {
        Some(tx) => tx,
        None => {
            // Job might not exist or already completed
            let _ = sender.send(Message::Text(
                serde_json::to_string(&serde_json::json!({
                    "error": "Job not found or already completed"
                })).unwrap()
            )).await;
            return;
        }
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
            Ok(Message::Close(_)) => break,
            Err(_) => break,
            _ => {}
        }
    }
    
    send_task.abort();
}

/// POST /api/v1/workers/:worker_id/log - Push log entry from worker
pub async fn push_log(
    State(state): State<AppState>,
    Json(entry): Json<LogEntry>,
) -> Result<StatusCode, (StatusCode, Json<ApiError>)> {
    if let Some(tx) = state.get_log_stream(entry.job_id).await {
        let log_json = serde_json::to_string(&entry).unwrap();
        let _ = tx.send(log_json);
        Ok(StatusCode::OK)
    } else {
        Err((
            StatusCode::NOT_FOUND,
            Json(ApiError::new(
                format!("No active log stream for job {}", entry.job_id),
                "stream_not_found",
            )),
        ))
    }
}
