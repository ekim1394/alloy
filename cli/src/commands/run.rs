//! Run command - submit a job and stream logs

use anyhow::Result;
use crossterm::execute;
use crossterm::style::{Color, Print, ResetColor, SetForegroundColor};
use futures_util::StreamExt;
use std::io::{stdout, Write};
use std::path::Path;
use tokio_tungstenite::connect_async;

use crate::archive;
use crate::client::AlloyClient;
use shared::LogEntry;

pub async fn execute(
    client: AlloyClient,
    command: Option<String>,
    script_path: Option<String>,
    repo: Option<String>,
) -> Result<()> {
    // Validate: need either command or script
    if command.is_none() && script_path.is_none() {
        anyhow::bail!("Either a command or --script is required");
    }

    // Read script file if provided
    let script = if let Some(ref path) = script_path {
        let script_content = std::fs::read_to_string(Path::new(path))
            .map_err(|e| anyhow::anyhow!("Failed to read script file '{path}': {e}"))?;
        Some(script_content)
    } else {
        None
    };

    println!("🚀 Submitting job to Alloy API...");
    if let Some(ref cmd) = command {
        println!("   Command: {cmd}");
    }
    if let Some(ref path) = script_path {
        println!("   Script: {path}");
    }

    let response = if let Some(ref repo_url) = repo {
        // Git-based job
        println!("   Source: Git repository");
        println!("   URL: {repo_url}");
        println!();

        client
            .create_job_git(command.as_deref(), script.as_deref(), repo_url)
            .await?
    } else {
        // Local upload job
        let cwd = std::env::current_dir()?;
        println!("   Source: Local directory");
        println!("   Path: {}", cwd.display());
        println!();

        // Get git commit SHA for deduplication
        let commit_sha = archive::get_commit_sha(&cwd).ok();
        if let Some(ref sha) = commit_sha {
            println!("   Commit: {sha}");
        }

        // Create archive
        print!("📦 Creating archive...");
        stdout().flush().ok();
        let archive_data = archive::create_archive(&cwd)?;
        println!(" ✓ ({})", archive::format_size(archive_data.len()));

        // Request upload URL
        print!("📤 Requesting upload URL...");
        stdout().flush().ok();
        let upload_info = client
            .request_upload_url(command.as_deref(), script.as_deref(), commit_sha.as_deref())
            .await?;
        println!(" ✓");

        // Upload archive (skip if already exists with same commit)
        if upload_info.skip_upload {
            println!("📦 Archive already exists, skipping upload");
        } else {
            print!("📤 Uploading archive...");
            stdout().flush().ok();
            client
                .upload_archive(
                    &upload_info.upload_url,
                    &upload_info.upload_token,
                    archive_data,
                )
                .await?;
            println!(" ✓");
        }

        // Confirm and start job
        print!("▶️  Starting job...");
        stdout().flush().ok();
        let response = client.confirm_upload(upload_info.job_id).await?;
        println!(" ✓");

        response
    };

    execute!(
        stdout(),
        SetForegroundColor(Color::Green),
        Print(format!("\n✓ Job created: {}\n", response.job_id)),
        ResetColor
    )?;
    println!("   Stream URL: {}", response.stream_url);
    println!();
    println!("📺 Streaming logs...\n");
    println!("{}", "─".repeat(60));

    // Connect to WebSocket for log streaming
    let ws_url = client.get_stream_url(response.job_id);
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
                } else if let Ok(json) = serde_json::from_str::<serde_json::Value>(&text) {
                    // Check for job_complete message
                    if json.get("type").and_then(|t| t.as_str()) == Some("job_complete") {
                        let status = json
                            .get("status")
                            .and_then(|s| s.as_str())
                            .unwrap_or("Unknown");
                        let exit_code =
                            json.get("exit_code").and_then(serde_json::Value::as_i64).unwrap_or(-1);
                        let build_minutes = json
                            .get("build_minutes")
                            .and_then(serde_json::Value::as_f64)
                            .unwrap_or(0.0);

                        println!("\n{}", "─".repeat(60));
                        let (icon, color) = if exit_code == 0 {
                            ("✓", Color::Green)
                        } else {
                            ("✗", Color::Red)
                        };
                        execute!(
                            stdout(),
                            SetForegroundColor(color),
                            Print(format!(
                                "\n{icon} Job {status} with exit code {exit_code}\n"
                            )),
                            ResetColor
                        )?;
                        println!("   Build time: {}", super::format_build_time(build_minutes));
                        break;
                    } else if let Some(err) = json.get("error") {
                        execute!(
                            stdout(),
                            SetForegroundColor(Color::Red),
                            Print(format!("Error: {err}\n")),
                            ResetColor
                        )?;
                    }
                }
            },
            Ok(tokio_tungstenite::tungstenite::Message::Close(_)) => {
                break;
            },
            Err(e) => {
                eprintln!("WebSocket error: {e}");
                break;
            },
            _ => {},
        }
    }

    println!("{}", "─".repeat(60));
    println!();

    // Get final job status
    let job = client.get_job(response.job_id).await?;

    let (status_icon, status_color) = match job.status {
        shared::JobStatus::Completed => ("✓", Color::Green),
        shared::JobStatus::Failed => ("✗", Color::Red),
        _ => ("?", Color::Yellow),
    };

    execute!(
        stdout(),
        SetForegroundColor(status_color),
        Print(format!(
            "{} Job {} - {:?}\n",
            status_icon, job.id, job.status
        )),
        ResetColor
    )?;

    if let Some(exit_code) = job.exit_code {
        println!("   Exit code: {exit_code}");
    }
    if let Some(minutes) = job.build_minutes {
        println!("   Build time: {}", super::format_build_time(minutes));
    }

    // Check for artifacts
    let artifacts = client.get_artifacts(response.job_id).await?;
    if !artifacts.is_empty() {
        println!();
        println!("📦 Artifacts:");
        for artifact in &artifacts {
            println!("   • {} ({} bytes)", artifact.name, artifact.size_bytes);
        }
        println!();
        println!("   Download with: alloy artifacts {}", response.job_id);
    }

    Ok(())
}
