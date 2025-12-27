//! Worker configuration

use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Config {
    /// URL of the orchestrator API
    pub orchestrator_url: String,

    /// This worker's hostname
    pub hostname: String,

    /// Maximum concurrent jobs
    pub capacity: u32,

    /// Base Tart VM image to clone
    pub tart_base_image: String,

    /// Job timeout in minutes (default: 60)
    pub job_timeout_minutes: u64,

    /// Number of VMs to pre-create in the pool (default: 2)
    pub vm_pool_size: u32,

    /// Optional script to run when VM is initialized (e.g., install fastlane)
    pub vm_setup_script: Option<String>,

    /// Secret key for authenticating with orchestrator (optional)
    pub worker_secret_key: Option<String>,

    /// Directory to store persistent data (like worker ID)
    pub data_dir: String,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            orchestrator_url: std::env::var("ORCHESTRATOR_URL")
                .context("ORCHESTRATOR_URL environment variable required")?,
            hostname: std::env::var("WORKER_HOSTNAME").unwrap_or_else(|_| {
                hostname::get().map_or_else(
                    |_| "unknown".to_string(),
                    |h| h.to_string_lossy().to_string(),
                )
            }),
            capacity: std::env::var("WORKER_CAPACITY")
                .unwrap_or_else(|_| "2".to_string())
                .parse()
                .context("Invalid WORKER_CAPACITY value")?,
            tart_base_image: std::env::var("TART_BASE_IMAGE")
                .unwrap_or_else(|_| "ghcr.io/cirruslabs/macos-tahoe-xcode:latest".to_string()),
            job_timeout_minutes: std::env::var("JOB_TIMEOUT_MINUTES")
                .unwrap_or_else(|_| "60".to_string())
                .parse()
                .context("Invalid JOB_TIMEOUT_MINUTES value")?,
            vm_pool_size: std::env::var("VM_POOL_SIZE")
                .unwrap_or_else(|_| "1".to_string())
                .parse()
                .context("Invalid VM_POOL_SIZE value")?,
            vm_setup_script: std::env::var("VM_SETUP_SCRIPT").ok(),
            worker_secret_key: std::env::var("WORKER_SECRET_KEY").ok(),
            data_dir: std::env::var("WORKER_DATA_DIR").unwrap_or_else(|_| {
                dirs::home_dir().map_or_else(
                    || "/tmp/alloy-worker".to_string(),
                    |h| h.join(".alloy").to_string_lossy().to_string(),
                )
            }),
        })
    }
}
