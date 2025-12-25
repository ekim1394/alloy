//! Artifacts command - download build artifacts

use anyhow::Result;
use std::path::Path;
use uuid::Uuid;

use crate::client::AlloyClient;

pub async fn execute(client: AlloyClient, job_id: &str, output_dir: &str) -> Result<()> {
    let job_uuid = job_id.parse::<Uuid>()?;
    let artifacts = client.get_artifacts(job_uuid).await?;

    if artifacts.is_empty() {
        println!("No artifacts found for job {}", job_id);
        return Ok(());
    }

    // Create output directory if it doesn't exist
    let output_path = Path::new(output_dir);
    std::fs::create_dir_all(output_path)?;

    println!("📥 Downloading {} artifact(s) to {}...\n", artifacts.len(), output_dir);

    for artifact in artifacts {
        if let Some(ref url) = artifact.download_url {
            println!("   Downloading {}...", artifact.name);
            
            let response = reqwest::get(url).await?;
            let bytes = response.bytes().await?;
            
            let file_path = output_path.join(&artifact.name);
            std::fs::write(&file_path, &bytes)?;
            
            println!("   ✓ Saved to {}", file_path.display());
        } else {
            println!("   ⚠ No download URL for {}", artifact.name);
        }
    }

    println!("\n✓ Download complete!");
    Ok(())
}
