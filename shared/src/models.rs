//! Core domain models for Jules Mac Runner

use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// How the source code is provided to the job
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum SourceType {
    /// Clone from a Git repository
    #[default]
    Git,
    /// Download from an uploaded archive (zip/tar.gz)
    Upload,
}

impl std::fmt::Display for SourceType {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SourceType::Git => write!(f, "git"),
            SourceType::Upload => write!(f, "upload"),
        }
    }
}

/// Represents a build/test job submitted by a customer
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Job {
    pub id: Uuid,
    pub customer_id: Uuid,
    /// How the source code is provided
    pub source_type: SourceType,
    /// URL to the source (git URL or upload download URL)
    pub source_url: Option<String>,
    /// Command to execute (mutually exclusive with script)
    pub command: Option<String>,
    /// Script content to execute (mutually exclusive with command)
    pub script: Option<String>,
    pub status: JobStatus,
    pub worker_id: Option<Uuid>,
    pub created_at: DateTime<Utc>,
    pub started_at: Option<DateTime<Utc>>,
    pub completed_at: Option<DateTime<Utc>>,
    pub exit_code: Option<i32>,
    pub build_minutes: Option<f64>,
}

impl Job {
    /// Create a new job with a command
    pub fn with_command(customer_id: Uuid, command: String, source_type: SourceType, source_url: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            customer_id,
            source_type,
            source_url,
            command: Some(command),
            script: None,
            status: JobStatus::Pending,
            worker_id: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            exit_code: None,
            build_minutes: None,
        }
    }

    /// Create a new job with a script
    pub fn with_script(customer_id: Uuid, script: String, source_type: SourceType, source_url: Option<String>) -> Self {
        Self {
            id: Uuid::new_v4(),
            customer_id,
            source_type,
            source_url,
            command: None,
            script: Some(script),
            status: JobStatus::Pending,
            worker_id: None,
            created_at: Utc::now(),
            started_at: None,
            completed_at: None,
            exit_code: None,
            build_minutes: None,
        }
    }

    /// Get the executable content (command or script)
    pub fn executable(&self) -> Option<&str> {
        self.command.as_deref().or(self.script.as_deref())
    }
}

/// Status of a job in the pipeline
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum JobStatus {
    Pending,
    Running,
    Completed,
    Failed,
    Cancelled,
}

impl std::fmt::Display for JobStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            JobStatus::Pending => write!(f, "pending"),
            JobStatus::Running => write!(f, "running"),
            JobStatus::Completed => write!(f, "completed"),
            JobStatus::Failed => write!(f, "failed"),
            JobStatus::Cancelled => write!(f, "cancelled"),
        }
    }
}

/// Request to create a new job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJobRequest {
    /// How the source code is provided
    #[serde(default)]
    pub source_type: SourceType,
    /// URL to the source (git URL or upload download URL)
    pub source_url: Option<String>,
    /// Command to execute (use this OR script, not both)
    pub command: Option<String>,
    /// Script content to execute (use this OR command, not both)
    pub script: Option<String>,
}

/// Response with upload URL for local file uploads
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UploadUrlResponse {
    /// Pre-signed URL to upload the archive
    pub upload_url: String,
    /// URL that will be used to download the archive
    pub download_url: String,
    /// Job ID (created but pending upload)
    pub job_id: Uuid,
    /// Auth token for uploading (used as Authorization header)
    pub upload_token: String,
    /// Whether upload can be skipped (archive already exists)
    #[serde(default)]
    pub skip_upload: bool,
}

/// Response after creating a job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateJobResponse {
    pub job_id: Uuid,
    pub status: JobStatus,
    pub stream_url: String,
}

/// A single log entry from a running job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LogEntry {
    pub job_id: Uuid,
    pub timestamp: DateTime<Utc>,
    pub stream: LogStream,
    pub content: String,
}

/// Which output stream a log came from
#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum LogStream {
    Stdout,
    Stderr,
}

/// Information about a worker in the farm
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerInfo {
    pub id: Uuid,
    pub hostname: String,
    pub capacity: u32,
    pub current_jobs: u32,
    pub last_heartbeat: DateTime<Utc>,
    pub status: WorkerStatus,
}

/// Status of a worker
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WorkerStatus {
    Online,
    Busy,
    Offline,
    Draining,
}

/// Request for worker to claim a job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ClaimJobRequest {
    pub worker_id: Uuid,
}

/// Result of a completed job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobResult {
    pub job_id: Uuid,
    pub exit_code: i32,
    pub artifacts: Vec<Artifact>,
    pub build_minutes: f64,
}

/// An artifact produced by a build
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Artifact {
    pub name: String,
    pub path: String,
    pub size_bytes: u64,
    pub download_url: Option<String>,
}

/// Worker heartbeat message
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkerHeartbeat {
    pub worker_id: Uuid,
    pub current_jobs: u32,
    pub capacity: u32,
}

/// Worker registration request
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterWorkerRequest {
    pub hostname: String,
    pub capacity: u32,
}

/// Worker registration response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RegisterWorkerResponse {
    pub worker_id: Uuid,
    pub token: String,
}
