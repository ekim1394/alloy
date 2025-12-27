//! Jobs command - list recent jobs

use anyhow::Result;
use crossterm::{
    execute,
    style::{Color, Print, ResetColor, SetForegroundColor},
};
use std::io::stdout;

use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, status: Option<&str>) -> Result<()> {
    let jobs = client.list_jobs(status).await?;

    if jobs.is_empty() {
        println!("No jobs found.");
        return Ok(());
    }

    println!("📋 Recent Jobs ({} total)\n", jobs.len());
    println!(
        "{:<8} {:<12} {:<38} {:<20}",
        "STATUS", "TIME", "JOB ID", "COMMAND"
    );
    println!("{}", "─".repeat(78));

    for job in &jobs {
        let (icon, color) = match job.status {
            shared::JobStatus::Pending => ("⏳", Color::Yellow),
            shared::JobStatus::Uploading => ("📤", Color::Cyan),
            shared::JobStatus::Running => ("▶️ ", Color::Cyan),
            shared::JobStatus::Completed => ("✓ ", Color::Green),
            shared::JobStatus::Failed => ("✗ ", Color::Red),
            shared::JobStatus::Cancelled => ("⊘ ", Color::DarkGrey),
        };

        let command = job
            .command
            .as_deref()
            .or_else(|| job.script.as_ref().map(|_| "[script]"))
            .unwrap_or("-");

        // Truncate command if too long
        let command_display = if command.len() > 18 {
            format!("{}...", &command[..15])
        } else {
            command.to_string()
        };

        let time = job.created_at.format("%m/%d %H:%M").to_string();

        execute!(
            stdout(),
            SetForegroundColor(color),
            Print(format!("{icon:<8}")),
            ResetColor,
            Print(format!("{:<12} {:<38} {}\n", time, job.id, command_display)),
        )?;
    }

    println!("\nUse 'alloy status <job_id>' for details or 'alloy logs <job_id>' to stream logs.");

    Ok(())
}
