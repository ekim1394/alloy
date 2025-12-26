//! Logs command - stream logs from a running job

use anyhow::Result;
use crossterm::{
    execute,
    style::{Color, Print, ResetColor, SetForegroundColor},
};
use futures_util::StreamExt;
use std::io::stdout;
use tokio_tungstenite::connect_async;
use uuid::Uuid;

use shared::LogEntry;
use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, job_id: &str) -> Result<()> {
    let job_id = Uuid::parse_str(job_id)
        .map_err(|_| anyhow::anyhow!("Invalid job ID format"))?;

    // Get job status first
    let job = client.get_job(job_id).await?;
    
    println!("📺 Streaming logs for job {}...", job_id);
    println!("   Status: {:?}", job.status);
    println!();
    println!("{}", "─".repeat(60));

    // Connect to WebSocket for log streaming
    let ws_url = client.get_stream_url(job_id);
    let (ws_stream, _) = connect_async(&ws_url).await?;
    let (_, mut read) = ws_stream.split();

    // Stream logs to terminal
    while let Some(msg) = read.next().await {
        match msg {
            Ok(tokio_tungstenite::tungstenite::Message::Text(text)) => {
                if let Ok(entry) = serde_json::from_str::<LogEntry>(&text) {
                    let color = match entry.stream {
                        shared::LogStream::Stdout => Color::White,
                        shared::LogStream::Stderr => Color::Yellow,
                    };
                    execute!(
                        stdout(),
                        SetForegroundColor(color),
                        Print(&entry.content),
                        Print("\n"),
                        ResetColor
                    )?;
                } else if let Ok(error) = serde_json::from_str::<serde_json::Value>(&text) {
                    if let Some(err) = error.get("error") {
                        execute!(
                            stdout(),
                            SetForegroundColor(Color::Red),
                            Print(format!("Error: {}\n", err)),
                            ResetColor
                        )?;
                        break;
                    }
                }
            }
            Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                break;
            }
            Err(e) => {
                eprintln!("WebSocket error: {}", e);
                break;
            }
            _ => {}
        }
    }

    println!("{}", "─".repeat(60));
    println!();

    // Get final job status
    let job = client.get_job(job_id).await?;
    
    let (status_icon, status_color) = match job.status {
        shared::JobStatus::Completed => ("✓", Color::Green),
        shared::JobStatus::Failed => ("✗", Color::Red),
        shared::JobStatus::Running => ("▶", Color::Cyan),
        _ => ("?", Color::Yellow),
    };

    execute!(
        stdout(),
        SetForegroundColor(status_color),
        Print(format!("{} Job {} - {:?}\n", status_icon, job.id, job.status)),
        ResetColor
    )?;

    if let Some(exit_code) = job.exit_code {
        println!("   Exit code: {}", exit_code);
    }
    if let Some(minutes) = job.build_minutes {
        println!("   Build time: {}", super::format_build_time(minutes));
    }

    Ok(())
}
