//! Jules Mac Runner Worker Agent
//!
//! Runs on Mac Minis to execute build jobs in Tart VMs.

mod config;
mod executor;
mod orchestrator_client;
mod vm_pool;

use chrono::Utc;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use crate::config::Config;
use crate::executor::JobExecutor;
use crate::orchestrator_client::OrchestratorClient;
use crate::vm_pool::VmPool;
use shared::{JobResult, LogEntry, LogStream};

#[tokio::main]
#[allow(clippy::too_many_lines)]
async fn main() -> anyhow::Result<()> {
    // Load environment variables
    dotenvy::dotenv().ok();

    // Initialize tracing
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "worker=debug".into()),
        )
        .with(tracing_subscriber::fmt::layer())
        .init();

    let config = Config::from_env()?;

    tracing::info!("Starting Alloy Worker");
    tracing::info!("Orchestrator URL: {}", config.orchestrator_url);
    tracing::info!("VM Pool Size: {}", config.vm_pool_size);

    // Initialize VM pool
    if let Some(ref script) = config.vm_setup_script {
        tracing::info!("VM Setup Script: {}", script);
    }
    let vm_pool = Arc::new(
        VmPool::new(
            config.vm_pool_size,
            &config.tart_base_image,
            config.vm_setup_script.as_deref(),
        )
        .await?,
    );
    let pool_for_shutdown = Arc::clone(&vm_pool);

    // Shutdown flag for graceful shutdown
    let shutdown_requested = Arc::new(AtomicBool::new(false));
    let shutdown_flag = shutdown_requested.clone();

    // Set up signal handlers
    tokio::spawn(async move {
        let ctrl_c = async {
            tokio::signal::ctrl_c()
                .await
                .expect("Failed to install Ctrl+C handler");
        };

        #[cfg(unix)]
        let terminate = async {
            tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate())
                .expect("Failed to install SIGTERM handler")
                .recv()
                .await;
        };

        #[cfg(not(unix))]
        let terminate = std::future::pending::<()>();

        tokio::select! {
            () = ctrl_c => {
                tracing::info!("Received Ctrl+C, initiating graceful shutdown...");
            }
            () = terminate => {
                tracing::info!("Received SIGTERM, initiating graceful shutdown...");
            }
        }

        shutdown_flag.store(true, Ordering::SeqCst);
    });

    let client =
        OrchestratorClient::new(&config.orchestrator_url, config.worker_secret_key.clone());

    // Log worker auth status
    if config.worker_secret_key.is_some() {
        tracing::info!("Worker authentication enabled (WORKER_SECRET_KEY is set)");
    } else {
        tracing::warn!("Worker authentication disabled (WORKER_SECRET_KEY not set)");
    }

    // Ensure data directory exists
    let data_dir = std::path::PathBuf::from(&config.data_dir);
    if !data_dir.exists() {
        tokio::fs::create_dir_all(&data_dir).await?;
    }

    let worker_id_path = data_dir.join("worker_id");
    let stored_worker_id = if worker_id_path.exists() {
        match tokio::fs::read_to_string(&worker_id_path).await {
            Ok(content) => match content.trim().parse::<uuid::Uuid>() {
                Ok(id) => {
                    tracing::info!("Found existing worker ID: {}", id);
                    Some(id)
                },
                Err(e) => {
                    tracing::warn!("Failed to parse stored worker ID: {}", e);
                    None
                },
            },
            Err(e) => {
                tracing::warn!("Failed to read worker ID file: {}", e);
                None
            },
        }
    } else {
        None
    };

    // Register with orchestrator
    let registration = client
        .register(&config.hostname, config.capacity, stored_worker_id)
        .await?;
    tracing::info!("Registered as worker {}", registration.worker_id);

    // Save worker ID if it's new or different
    if Some(registration.worker_id) != stored_worker_id {
        if let Err(e) = tokio::fs::write(&worker_id_path, registration.worker_id.to_string()).await
        {
            tracing::warn!("Failed to save worker ID to file: {}", e);
        } else {
            tracing::info!("Saved worker ID to {}", worker_id_path.display());
        }
    }

    let executor = JobExecutor::new(
        registration.worker_id,
        client.clone(),
        config.clone(),
        Arc::clone(&vm_pool),
    );

    // Main worker loop
    while !shutdown_requested.load(Ordering::SeqCst) {
        // Send heartbeat
        if let Err(e) = client
            .heartbeat(registration.worker_id, 0, config.capacity)
            .await
        {
            tracing::warn!("Failed to send heartbeat: {}", e);
        }

        // Try to claim a job
        match client.claim_job(registration.worker_id).await {
            Ok(Some(job)) => {
                tracing::info!(job_id = %job.id, "Claimed job, executing...");

                // Execute the job
                let start_time = Instant::now();
                match executor.execute(&job).await {
                    Ok(result) => {
                        tracing::info!(
                            job_id = %job.id,
                            exit_code = result.exit_code,
                            "Job completed"
                        );

                        // Report completion
                        if let Err(e) = client.complete_job(registration.worker_id, result).await {
                            tracing::error!("Failed to report job completion: {}", e);
                        }
                    },
                    Err(e) => {
                        tracing::error!(job_id = %job.id, "Job execution failed: {}", e);

                        // Report failure to orchestrator so job isn't stuck
                        let error_msg = format!("Job execution failed on worker: {e}");

                        // 1. Push error log
                        let log_entry = LogEntry {
                            job_id: job.id,
                            timestamp: Utc::now(),
                            stream: LogStream::Stderr,
                            content: error_msg,
                        };
                        if let Err(log_err) =
                            client.push_log(registration.worker_id, &log_entry).await
                        {
                            tracing::warn!("Failed to push failure log: {}", log_err);
                        }

                        // 2. Report completion with failure
                        let duration = start_time.elapsed().as_secs_f64() / 60.0;
                        let failure_result = JobResult {
                            job_id: job.id,
                            exit_code: -1, // Internal error
                            artifacts: vec![],
                            build_minutes: duration,
                        };

                        if let Err(report_err) = client
                            .complete_job(registration.worker_id, failure_result)
                            .await
                        {
                            tracing::error!("Failed to report job failure: {}", report_err);
                        }
                    },
                }
            },
            Ok(None) => {
                // No jobs available, wait before polling again
                tokio::time::sleep(Duration::from_secs(5)).await;
            },
            Err(e) => {
                tracing::warn!("Failed to claim job: {}", e);
                tokio::time::sleep(Duration::from_secs(10)).await;
            },
        }
    }

    // Deregister from orchestrator before shutting down
    tracing::info!("Deregistering from orchestrator...");
    if let Err(e) = client.deregister(registration.worker_id).await {
        tracing::warn!("Failed to deregister: {}", e);
    }

    // Graceful shutdown - clean up VM pool
    pool_for_shutdown.shutdown().await;

    tracing::info!("Graceful shutdown complete");
    Ok(())
}
