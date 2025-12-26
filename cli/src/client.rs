//! API client for the Alloy CLI

use anyhow::Result;
use reqwest::Client;
use serde_json::json;
use uuid::Uuid;

use shared::{Artifact, CreateJobResponse, Job, UploadUrlResponse};

#[derive(Clone)]
pub struct AlloyClient {
    client: Client,
    base_url: String,
    api_key: Option<String>,
}

impl AlloyClient {
    pub fn new(base_url: &str, api_key: Option<&str>) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.to_string(),
            api_key: api_key.map(std::string::ToString::to_string),
        }
    }

    fn add_auth(&self, request: reqwest::RequestBuilder) -> reqwest::RequestBuilder {
        if let Some(ref key) = self.api_key {
            request.header("Authorization", format!("Bearer {key}"))
        } else {
            request
        }
    }

    /// Create a new job with git source
    pub async fn create_job_git(
        &self,
        command: Option<&str>,
        script: Option<&str>,
        repo_url: &str,
    ) -> Result<CreateJobResponse> {
        let mut body = json!({
            "source_type": "git",
            "source_url": repo_url,
        });

        if let Some(cmd) = command {
            body["command"] = json!(cmd);
        }
        if let Some(scr) = script {
            body["script"] = json!(scr);
        }

        let request = self
            .client
            .post(format!("{}/api/v1/jobs", self.base_url))
            .json(&body);

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to create job: {error}");
        }

        Ok(response.json().await?)
    }

    /// Request an upload URL for local file upload
    pub async fn request_upload_url(
        &self,
        command: Option<&str>,
        script: Option<&str>,
        commit_sha: Option<&str>,
    ) -> Result<UploadUrlResponse> {
        let mut body = json!({});

        if let Some(cmd) = command {
            body["command"] = json!(cmd);
        }
        if let Some(scr) = script {
            body["script"] = json!(scr);
        }
        if let Some(sha) = commit_sha {
            body["commit_sha"] = json!(sha);
        }

        let request = self
            .client
            .post(format!("{}/api/v1/jobs/upload", self.base_url))
            .json(&body);

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to get upload URL: {error}");
        }

        Ok(response.json().await?)
    }

    /// Upload archive to the provided URL with auth token
    pub async fn upload_archive(
        &self,
        upload_url: &str,
        _upload_token: &str,
        data: Vec<u8>,
    ) -> Result<()> {
        // Upload goes through orchestrator proxy (no auth needed from CLI)
        let request = self
            .client
            .put(upload_url)
            .header("Content-Type", "application/zip")
            .body(data);

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to upload archive: {error}");
        }

        Ok(())
    }

    /// Confirm upload and start the job
    pub async fn confirm_upload(&self, job_id: Uuid) -> Result<CreateJobResponse> {
        let request = self
            .client
            .post(format!("{}/api/v1/jobs/{}/start", self.base_url, job_id));

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to start job: {error}");
        }

        Ok(response.json().await?)
    }

    /// Get job status
    pub async fn get_job(&self, job_id: Uuid) -> Result<Job> {
        let request = self
            .client
            .get(format!("{}/api/v1/jobs/{}", self.base_url, job_id));

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to get job: {error}");
        }

        Ok(response.json().await?)
    }

    /// Get job artifacts
    pub async fn get_artifacts(&self, job_id: Uuid) -> Result<Vec<Artifact>> {
        let request = self.client.get(format!(
            "{}/api/v1/jobs/{}/artifacts",
            self.base_url, job_id
        ));

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to get artifacts: {error}");
        }

        Ok(response.json().await?)
    }

    /// Get the WebSocket URL for log streaming
    pub fn get_stream_url(&self, job_id: Uuid) -> String {
        let ws_base = self
            .base_url
            .replace("http://", "ws://")
            .replace("https://", "wss://");
        format!("{ws_base}/api/v1/jobs/{job_id}/logs")
    }

    /// Cancel a running job
    pub async fn cancel_job(&self, job_id: Uuid) -> Result<()> {
        let request = self
            .client
            .post(format!("{}/api/v1/jobs/{}/cancel", self.base_url, job_id));

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to cancel job: {error}");
        }

        Ok(())
    }

    /// List recent jobs
    pub async fn list_jobs(&self, status: Option<&str>) -> Result<Vec<Job>> {
        let mut url = format!("{}/api/v1/jobs", self.base_url);

        if let Some(s) = status {
            url = format!("{url}?status={s}");
        }

        let request = self.client.get(&url);
        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to list jobs: {error}");
        }

        Ok(response.json().await?)
    }

    /// Retry a failed or cancelled job
    pub async fn retry_job(&self, job_id: Uuid) -> Result<Uuid> {
        #[derive(serde::Deserialize)]
        struct RetryResponse {
            new_job_id: Uuid,
        }

        let request = self
            .client
            .post(format!("{}/api/v1/jobs/{}/retry", self.base_url, job_id));

        let response = self.add_auth(request).send().await?;

        if !response.status().is_success() {
            let error = response.text().await?;
            anyhow::bail!("Failed to retry job: {error}");
        }

        let resp: RetryResponse = response.json().await?;
        Ok(resp.new_job_id)
    }
}
