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
            Self::Git => write!(f, "git"),
            Self::Upload => write!(f, "upload"),
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
    #[must_use]
    pub fn with_command(
        customer_id: Uuid,
        command: String,
        source_type: SourceType,
        source_url: Option<String>,
    ) -> Self {
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
    #[must_use]
    pub fn with_script(
        customer_id: Uuid,
        script: String,
        source_type: SourceType,
        source_url: Option<String>,
    ) -> Self {
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
    #[must_use]
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
            Self::Pending => write!(f, "pending"),
            Self::Running => write!(f, "running"),
            Self::Completed => write!(f, "completed"),
            Self::Failed => write!(f, "failed"),
            Self::Cancelled => write!(f, "cancelled"),
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

/// A stored log entry
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct JobLog {
    pub id: Uuid,
    pub job_id: Uuid,
    pub content: String,
    pub created_at: DateTime<Utc>,
}

// ============================================
// Billing Models
// ============================================

/// Subscription plan tiers
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionPlan {
    #[default]
    Pro,
    Team,
}

impl SubscriptionPlan {
    /// Monthly included minutes for this plan
    #[must_use]
    pub const fn included_minutes(&self) -> Option<u32> {
        match self {
            Self::Pro => Some(300),
            Self::Team => None, // Unlimited
        }
    }

    /// Monthly price in cents
    #[must_use]
    pub const fn price_cents(&self) -> u32 {
        match self {
            Self::Pro => 2000,   // $20
            Self::Team => 20000, // $200
        }
    }

    /// Whether this plan supports metered billing for overages
    #[must_use]
    pub const fn has_metered_billing(&self) -> bool {
        matches!(self, Self::Pro)
    }

    /// Trial duration in days
    #[must_use]
    pub const fn trial_days(&self) -> u32 {
        7
    }
}

impl std::fmt::Display for SubscriptionPlan {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Pro => write!(f, "pro"),
            Self::Team => write!(f, "team"),
        }
    }
}

impl std::str::FromStr for SubscriptionPlan {
    type Err = String;

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s.to_lowercase().as_str() {
            "pro" => Ok(Self::Pro),
            "team" => Ok(Self::Team),
            _ => Err(format!("Unknown plan: {s}")),
        }
    }
}

/// Subscription status
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize, Default)]
#[serde(rename_all = "snake_case")]
pub enum SubscriptionStatus {
    #[default]
    Active,
    PastDue,
    Canceled,
    Trialing,
}

impl std::fmt::Display for SubscriptionStatus {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            Self::Active => write!(f, "active"),
            Self::PastDue => write!(f, "past_due"),
            Self::Canceled => write!(f, "canceled"),
            Self::Trialing => write!(f, "trialing"),
        }
    }
}

/// User subscription record
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Subscription {
    pub id: Uuid,
    pub user_id: Uuid,
    pub plan: SubscriptionPlan,
    pub status: SubscriptionStatus,
    pub stripe_customer_id: Option<String>,
    pub stripe_subscription_id: Option<String>,
    pub current_period_start: Option<DateTime<Utc>>,
    pub current_period_end: Option<DateTime<Utc>>,
    /// When the trial ends (if on trial)
    pub trial_ends_at: Option<DateTime<Utc>>,
    /// Minutes included in the plan
    pub minutes_included: Option<u32>,
    /// Minutes used in the current billing period
    pub minutes_used: f64,
    pub created_at: DateTime<Utc>,
    pub updated_at: DateTime<Utc>,
}

impl Subscription {
    /// Create a new trial subscription for a user (7-day Pro trial)
    #[must_use]
    pub fn new_trial(user_id: Uuid) -> Self {
        let now = Utc::now();
        let trial_end = now + chrono::Duration::days(7);
        Self {
            id: Uuid::new_v4(),
            user_id,
            plan: SubscriptionPlan::Pro,
            status: SubscriptionStatus::Trialing,
            stripe_customer_id: None,
            stripe_subscription_id: None,
            current_period_start: Some(now),
            current_period_end: None,
            trial_ends_at: Some(trial_end),
            minutes_included: Some(300), // Pro plan minutes during trial
            minutes_used: 0.0,
            created_at: now,
            updated_at: now,
        }
    }

    /// Check if currently in trial period
    #[must_use]
    pub fn is_trial_active(&self) -> bool {
        if self.status != SubscriptionStatus::Trialing {
            return false;
        }
        self.trial_ends_at.is_some_and(|end| Utc::now() < end)
    }

    /// Check if trial has expired
    #[must_use]
    pub fn is_trial_expired(&self) -> bool {
        if self.status != SubscriptionStatus::Trialing {
            return false;
        }
        self.trial_ends_at.is_some_and(|end| Utc::now() >= end)
    }

    /// Check if the user can run a job
    #[must_use]
    pub fn can_run_job(&self) -> bool {
        // Trial expired users cannot run jobs
        if self.is_trial_expired() {
            return false;
        }

        match self.plan {
            // Unlimited
            SubscriptionPlan::Team | SubscriptionPlan::Pro => true, // Pro has metered billing
        }
    }

    /// Get remaining minutes (None for unlimited plans)
    #[must_use]
    pub fn remaining_minutes(&self) -> Option<f64> {
        match self.plan {
            SubscriptionPlan::Team => None,
            SubscriptionPlan::Pro => {
                let included = f64::from(self.minutes_included.unwrap_or(300));
                Some((included - self.minutes_used).max(0.0))
            },
        }
    }

    /// Days remaining in trial (None if not on trial)
    #[must_use]
    pub fn trial_days_remaining(&self) -> Option<i64> {
        if self.status != SubscriptionStatus::Trialing {
            return None;
        }
        self.trial_ends_at.map(|end| {
            let remaining = end - Utc::now();
            remaining.num_days().max(0)
        })
    }
}

/// Usage record for a single job
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageRecord {
    pub id: Uuid,
    pub subscription_id: Uuid,
    pub job_id: Uuid,
    pub minutes_used: f64,
    pub recorded_at: DateTime<Utc>,
}

/// Response for billing status endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BillingStatusResponse {
    pub subscription: Subscription,
    pub usage_this_period: f64,
    pub quota_remaining: Option<f64>,
    pub can_run_jobs: bool,
    pub upgrade_required: bool,
}

/// Request to create a checkout session for plan upgrade
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CreateCheckoutRequest {
    pub plan: SubscriptionPlan,
    pub success_url: String,
    pub cancel_url: String,
}

/// Response with checkout session URL
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CheckoutSessionResponse {
    pub checkout_url: String,
    pub session_id: String,
}

/// Response with customer portal URL
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortalSessionResponse {
    pub portal_url: String,
}
