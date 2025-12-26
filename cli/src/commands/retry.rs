//! Retry command - retry a failed or cancelled job

use anyhow::Result;
use crossterm::{
    execute,
    style::{Color, Print, ResetColor, SetForegroundColor},
};
use std::io::stdout;
use uuid::Uuid;

use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, job_id: &str) -> Result<()> {
    let job_id = Uuid::parse_str(job_id).map_err(|_| anyhow::anyhow!("Invalid job ID format"))?;

    println!("🔄 Retrying job {job_id}...");

    match client.retry_job(job_id).await {
        Ok(new_job_id) => {
            execute!(
                stdout(),
                SetForegroundColor(Color::Green),
                Print(format!("✓ Created new job: {new_job_id}\n")),
                ResetColor
            )?;
            println!("   Original job: {job_id}");
            println!();
            println!("Stream logs with: alloy logs {new_job_id}");
            Ok(())
        },
        Err(e) => {
            execute!(
                stdout(),
                SetForegroundColor(Color::Red),
                Print(format!("✗ Failed to retry job: {e}\n")),
                ResetColor
            )?;
            Err(e)
        },
    }
}
