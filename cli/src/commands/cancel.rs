//! Cancel command - cancel a running job

use anyhow::Result;
use uuid::Uuid;

use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, job_id: &str) -> Result<()> {
    let job_id = Uuid::parse_str(job_id)
        .map_err(|_| anyhow::anyhow!("Invalid job ID format"))?;

    println!("🛑 Cancelling job {}...", job_id);

    match client.cancel_job(job_id).await {
        Ok(_) => {
            println!("✓ Job {} cancelled", job_id);
            Ok(())
        }
        Err(e) => {
            println!("✗ Failed to cancel job: {}", e);
            Err(e)
        }
    }
}
