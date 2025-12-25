//! Supabase client for database and storage operations

use anyhow::Result;
use chrono::Utc;
use reqwest::Client;
use serde_json::json;
use uuid::Uuid;

use shared::{Artifact, Job, JobStatus, WorkerInfo};

/// Client for interacting with Supabase
#[derive(Clone)]
pub struct SupabaseClient {
    client: Client,
    base_url: String,
    api_key: String,
}

impl SupabaseClient {
    pub fn new(base_url: &str, api_key: &str) -> Self {
        Self {
            client: Client::new(),
            base_url: base_url.to_string(),
            api_key: api_key.to_string(),
        }
    }

    fn rest_url(&self) -> String {
        format!("{}/rest/v1", self.base_url)
    }

    fn storage_url(&self) -> String {
        format!("{}/storage/v1", self.base_url)
    }

    /// Create a new job in the database
    pub async fn create_job(&self, job: &Job) -> Result<()> {
        let response = self.client
            .post(format!("{}/jobs", self.rest_url()))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&json!({
                "id": job.id,
                "customer_id": job.customer_id,
                "source_type": job.source_type.to_string(),
                "source_url": job.source_url,
                "command": job.command,
                "script": job.script,
                "status": job.status.to_string(),
                "created_at": job.created_at,
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to create job: {}", error_text);
        }

        Ok(())
    }

    /// Get a job by ID
    pub async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>> {
        let response = self.client
            .get(format!("{}/jobs?id=eq.{}", self.rest_url(), job_id))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get job: {}", error_text);
        }

        let jobs: Vec<Job> = response.json().await?;
        Ok(jobs.into_iter().next())
    }

    /// List recent jobs with optional status filter
    pub async fn list_jobs(&self, status: Option<&str>, limit: usize) -> Result<Vec<Job>> {
        let mut url = format!(
            "{}/jobs?order=created_at.desc&limit={}",
            self.rest_url(),
            limit
        );
        
        if let Some(status_filter) = status {
            url = format!("{}&status=eq.{}", url, status_filter);
        }
        
        let response = self.client
            .get(&url)
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to list jobs: {}", error_text);
        }

        Ok(response.json().await?)
    }

    /// Claim a pending job for a worker
    pub async fn claim_pending_job(&self, worker_id: Uuid) -> Result<Option<Job>> {
        // Find a pending job
        let response = self.client
            .get(format!(
                "{}/jobs?status=eq.pending&order=created_at.asc&limit=1",
                self.rest_url()
            ))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to find pending job: {}", error_text);
        }

        let jobs: Vec<Job> = response.json().await?;
        
        if let Some(job) = jobs.into_iter().next() {
            // Update to running status
            let update_response = self.client
                .patch(format!("{}/jobs?id=eq.{}", self.rest_url(), job.id))
                .header("apikey", &self.api_key)
                .header("Authorization", format!("Bearer {}", self.api_key))
                .header("Content-Type", "application/json")
                .header("Prefer", "return=representation")
                .json(&json!({
                    "status": "running",
                    "worker_id": worker_id,
                    "started_at": Utc::now(),
                }))
                .send()
                .await?;

            if update_response.status().is_success() {
                let updated_jobs: Vec<Job> = update_response.json().await?;
                return Ok(updated_jobs.into_iter().next());
            }
        }

        Ok(None)
    }

    /// Complete a job
    pub async fn complete_job(
        &self,
        job_id: Uuid,
        status: JobStatus,
        exit_code: i32,
        build_minutes: f64,
    ) -> Result<()> {
        let response = self.client
            .patch(format!("{}/jobs?id=eq.{}", self.rest_url(), job_id))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&json!({
                "status": status.to_string(),
                "exit_code": exit_code,
                "build_minutes": build_minutes,
                "completed_at": Utc::now(),
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to complete job: {}", error_text);
        }

        Ok(())
    }

    /// Update job status (e.g., for cancellation)
    pub async fn update_job_status(&self, job_id: Uuid, status: JobStatus) -> Result<()> {
        let response = self.client
            .patch(format!("{}/jobs?id=eq.{}", self.rest_url(), job_id))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&json!({
                "status": status.to_string(),
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to update job status: {}", error_text);
        }

        Ok(())
    }

    /// Register a worker
    pub async fn register_worker(&self, worker: &WorkerInfo) -> Result<()> {
        let response = self.client
            .post(format!("{}/workers", self.rest_url()))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&json!({
                "id": worker.id,
                "hostname": worker.hostname,
                "capacity": worker.capacity,
                "current_jobs": worker.current_jobs,
                "last_heartbeat": worker.last_heartbeat,
                "status": format!("{:?}", worker.status).to_lowercase(),
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to register worker: {}", error_text);
        }

        Ok(())
    }

    /// Get artifacts for a job
    pub async fn get_job_artifacts(&self, job_id: Uuid) -> Result<Vec<Artifact>> {
        let response = self.client
            .get(format!("{}/artifacts?job_id=eq.{}", self.rest_url(), job_id))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to get artifacts: {}", error_text);
        }

        let artifacts: Vec<Artifact> = response.json().await?;
        Ok(artifacts)
    }

    /// Store an artifact record
    pub async fn store_artifact(&self, job_id: Uuid, artifact: &Artifact) -> Result<()> {
        let response = self.client
            .post(format!("{}/artifacts", self.rest_url()))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&json!({
                "job_id": job_id,
                "name": artifact.name,
                "path": artifact.path,
                "size_bytes": artifact.size_bytes,
                "download_url": artifact.download_url,
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to store artifact: {}", error_text);
        }

        Ok(())
    }

    /// Upload artifact file to Supabase Storage
    pub async fn upload_artifact_file(
        &self,
        job_id: Uuid,
        file_name: &str,
        data: Vec<u8>,
    ) -> Result<String> {
        let path = format!("artifacts/{}/{}", job_id, file_name);
        
        let response = self.client
            .post(format!("{}/object/{}", self.storage_url(), path))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/octet-stream")
            .body(data)
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to upload artifact: {}", error_text);
        }

        // Return public URL
        Ok(format!("{}/object/public/{}", self.storage_url(), path))
    }

    /// Verify an API key by its hash
    pub async fn verify_api_key(&self, key_hash: &str) -> Result<Option<ApiKeyRecord>> {
        let response = self.client
            .get(format!("{}/api_keys?key_hash=eq.{}&select=*", self.rest_url(), key_hash))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to verify API key: {}", error_text);
        }

        let keys: Vec<ApiKeyRecord> = response.json().await?;
        Ok(keys.into_iter().next())
    }

    /// Update API key last_used_at timestamp
    pub async fn update_api_key_usage(&self, key_id: Uuid) -> Result<()> {
        let response = self.client
            .patch(format!("{}/api_keys?id=eq.{}", self.rest_url(), key_id))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .json(&json!({
                "last_used_at": chrono::Utc::now(),
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            tracing::warn!("Failed to update API key usage");
        }

        Ok(())
    }

    /// Create a new API key for a user
    pub async fn create_api_key(&self, user_id: Uuid, name: &str, key_hash: &str) -> Result<Uuid> {
        let key_id = Uuid::new_v4();
        
        let response = self.client
            .post(format!("{}/api_keys", self.rest_url()))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .header("Content-Type", "application/json")
            .header("Prefer", "return=minimal")
            .json(&json!({
                "id": key_id,
                "user_id": user_id,
                "name": name,
                "key_hash": key_hash,
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to create API key: {}", error_text);
        }

        Ok(key_id)
    }

    /// List API keys for a user (without the hash)
    pub async fn list_api_keys(&self, user_id: Uuid) -> Result<Vec<ApiKeyInfo>> {
        let response = self.client
            .get(format!(
                "{}/api_keys?user_id=eq.{}&select=id,name,created_at,last_used_at",
                self.rest_url(),
                user_id
            ))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to list API keys: {}", error_text);
        }

        let keys: Vec<ApiKeyInfo> = response.json().await?;
        Ok(keys)
    }

    /// Delete an API key
    pub async fn delete_api_key(&self, user_id: Uuid, key_id: Uuid) -> Result<bool> {
        let response = self.client
            .delete(format!(
                "{}/api_keys?id=eq.{}&user_id=eq.{}",
                self.rest_url(),
                key_id,
                user_id
            ))
            .header("apikey", &self.api_key)
            .header("Authorization", format!("Bearer {}", self.api_key))
            .send()
            .await?;

        Ok(response.status().is_success())
    }
    
    /// Verify user credentials (for Supabase, use their Auth API)
    pub async fn verify_user(&self, email: &str, password: &str) -> Result<Option<Uuid>> {
        // Use Supabase Auth API for login
        let response = self.client
            .post(format!("{}/auth/v1/token?grant_type=password", self.base_url))
            .header("apikey", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&json!({
                "email": email,
                "password": password
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            return Ok(None);
        }

        #[derive(serde::Deserialize)]
        struct AuthResponse {
            user: Option<AuthUser>,
        }
        
        #[derive(serde::Deserialize)]
        struct AuthUser {
            id: Uuid,
        }

        let auth_response: AuthResponse = response.json().await?;
        Ok(auth_response.user.map(|u| u.id))
    }
    
    /// Create a new user (for Supabase, use their Auth API)
    pub async fn create_user(&self, email: &str, password: &str) -> Result<Uuid> {
        let response = self.client
            .post(format!("{}/auth/v1/signup", self.base_url))
            .header("apikey", &self.api_key)
            .header("Content-Type", "application/json")
            .json(&json!({
                "email": email,
                "password": password
            }))
            .send()
            .await?;

        if !response.status().is_success() {
            let error_text = response.text().await?;
            anyhow::bail!("Failed to create user: {}", error_text);
        }

        #[derive(serde::Deserialize)]
        struct SignupResponse {
            user: AuthUser,
        }
        
        #[derive(serde::Deserialize)]
        struct AuthUser {
            id: Uuid,
        }

        let signup_response: SignupResponse = response.json().await?;
        Ok(signup_response.user.id)
    }
}


/// API key record from database (with hash for verification)
#[derive(Debug, serde::Deserialize)]
pub struct ApiKeyRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub key_hash: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// API key info (without sensitive hash)
#[derive(Debug, serde::Serialize, serde::Deserialize)]
pub struct ApiKeyInfo {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}
