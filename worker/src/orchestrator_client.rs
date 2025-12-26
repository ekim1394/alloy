//! Orchestrator API client

use anyhow::Result;
use reqwest::{Client, RequestBuilder};
use serde_json::json;
use uuid::Uuid;

use shared::{Job, JobResult, RegisterWorkerResponse};

/// Header name for worker authentication
const WORKER_SECRET_HEADER: &str = "X-Worker-Secret";

#[derive(Clone)]
pub struct OrchestratorClient {
    client: Client,
    base_url: String,
    /// Optional secret key for authentication with orchestrator
    worker_secret_key: Option<String>,
}

impl OrchestratorClient {
    pub fn new(base_url: &str, worker_secret_key: Option<String>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.to_string(),
            worker_secret_key,
        }
    }

    /// Add authentication header to request if secret is configured
    fn with_auth(&self, request: RequestBuilder) -> RequestBuilder {
        match &self.worker_secret_key {
            Some(secret) => request.header(WORKER_SECRET_HEADER, secret),
            None => request,
        }
    }

    /// Register this worker with the orchestrator
    pub async fn register(&self, hostname: &str, capacity: u32) -> Result<RegisterWorkerResponse> {
        let request = self.client
            .post(format!("{}/api/v1/workers/register", self.base_url))
            .json(&json!({
                "hostname": hostname,
                "capacity": capacity,
            }));

        let response = self.with_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to register: {}", error);
        }

        Ok(response.json().await?)
    }

    /// Send heartbeat to orchestrator
    pub async fn heartbeat(&self, worker_id: Uuid, current_jobs: u32, capacity: u32) -> Result<()> {
        let request = self.client
            .post(format!("{}/api/v1/workers/heartbeat", self.base_url))
            .json(&json!({
                "worker_id": worker_id,
                "current_jobs": current_jobs,
                "capacity": capacity,
            }));

        let response = self.with_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Heartbeat failed: {}", error);
        }

        Ok(())
    }

    /// Try to claim a pending job
    pub async fn claim_job(&self, worker_id: Uuid) -> Result<Option<Job>> {
        let request = self.client
            .post(format!("{}/api/v1/workers/claim", self.base_url))
            .json(&json!({
                "worker_id": worker_id,
            }));

        let response = self.with_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to claim job: {}", error);
        }

        Ok(response.json().await?)
    }

    /// Report job completion
    pub async fn complete_job(&self, worker_id: Uuid, result: JobResult) -> Result<()> {
        let request = self.client
            .post(format!("{}/api/v1/workers/{}/complete", self.base_url, worker_id))
            .json(&result);

        let response = self.with_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to complete job: {}", error);
        }

        Ok(())
    }

    /// Push a log entry to the orchestrator
    pub async fn push_log(&self, worker_id: Uuid, entry: &shared::LogEntry) -> Result<()> {
        let request = self.client
            .post(format!("{}/api/v1/workers/{}/log", self.base_url, worker_id))
            .json(entry);

        let response = self.with_auth(request).send().await?;

        if !response.status().is_success() {
            // Don't fail the whole job for log issues
            tracing::warn!("Failed to push log: {}", response.status());
        }

        Ok(())
    }
}
