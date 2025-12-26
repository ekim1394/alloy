//! Status command - check job status

use anyhow::Result;
use crossterm::execute;
use crossterm::style::{Color, Print, ResetColor, SetForegroundColor};
use std::io::stdout;
use uuid::Uuid;

use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, job_id: &str) -> Result<()> {
    let job_uuid = job_id.parse::<Uuid>()?;
    let job = client.get_job(job_uuid).await?;

    let (status_icon, status_color) = match job.status {
        shared::JobStatus::Pending => ("⏳", Color::Yellow),
        shared::JobStatus::Running => ("▶️", Color::Blue),
        shared::JobStatus::Completed => ("✓", Color::Green),
        shared::JobStatus::Failed => ("✗", Color::Red),
        shared::JobStatus::Cancelled => ("⊘", Color::DarkGrey),
    };

    println!();
    execute!(
        stdout(),
        SetForegroundColor(status_color),
        Print(format!("{} Job: {}\n", status_icon, job.id)),
        ResetColor
    )?;

    println!("   Status: {:?}", job.status);
    if let Some(ref cmd) = job.command {
        println!("   Command: {cmd}");
    }
    if job.script.is_some() {
        println!("   Script: (inline script)");
    }
    println!("   Source: {:?}", job.source_type);

    if let Some(ref url) = job.source_url {
        println!("   Source URL: {url}");
    }

    println!("   Created: {}", job.created_at);

    if let Some(started) = job.started_at {
        println!("   Started: {started}");
    }

    if let Some(completed) = job.completed_at {
        println!("   Completed: {completed}");
    }

    if let Some(exit_code) = job.exit_code {
        println!("   Exit code: {exit_code}");
    }

    if let Some(minutes) = job.build_minutes {
        println!("   Build time: {}", super::format_build_time(minutes));
    }

    // Check for artifacts
    let artifacts = client.get_artifacts(job_uuid).await?;
    if !artifacts.is_empty() {
        println!();
        println!("📦 Artifacts:");
        for artifact in &artifacts {
            println!("   • {} ({} bytes)", artifact.name, artifact.size_bytes);
        }
    }

    println!();
    Ok(())
}
