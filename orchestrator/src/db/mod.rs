//! Database abstraction layer for supporting multiple backends
//!
//! Supports:
//! - Supabase (managed cloud)
//! - SQLite (simple self-hosted)
//! - PostgreSQL (production self-hosted)

pub mod sqlite;

use anyhow::Result;
use async_trait::async_trait;
use uuid::Uuid;

use shared::{Artifact, Job, JobStatus, WorkerInfo};

pub use sqlite::SqliteDb;

/// Abstract database operations
#[async_trait]
pub trait Database: Send + Sync + Clone {
    // Job operations
    async fn create_job(&self, job: &Job) -> Result<()>;
    async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>>;
    async fn claim_pending_job(&self, worker_id: Uuid) -> Result<Option<Job>>;
    async fn complete_job(
        &self,
        job_id: Uuid,
        status: JobStatus,
        exit_code: i32,
        build_minutes: f64,
    ) -> Result<()>;

    // Worker operations
    async fn register_worker(&self, worker: &WorkerInfo) -> Result<()>;
    async fn update_worker_heartbeat(&self, worker_id: Uuid) -> Result<()>;

    // Artifact operations
    async fn get_job_artifacts(&self, job_id: Uuid) -> Result<Vec<Artifact>>;
    async fn store_artifact(&self, job_id: Uuid, artifact: &Artifact) -> Result<()>;

    // API key operations
    async fn verify_api_key(&self, key_hash: &str) -> Result<Option<ApiKeyRecord>>;
    async fn update_api_key_usage(&self, key_id: Uuid) -> Result<()>;
    async fn create_api_key(&self, user_id: Uuid, name: &str, key_hash: &str) -> Result<Uuid>;
    async fn list_api_keys(&self, user_id: Uuid) -> Result<Vec<ApiKeyInfo>>;
    async fn delete_api_key(&self, user_id: Uuid, key_id: Uuid) -> Result<bool>;
    
    // User operations
    async fn verify_user(&self, email: &str, password: &str) -> Result<Option<Uuid>>;
    async fn create_user(&self, email: &str, password_hash: &str) -> Result<Uuid>;
}


/// API key record from database
#[derive(Debug, Clone)]
pub struct ApiKeyRecord {
    pub id: Uuid,
    pub user_id: Uuid,
    pub name: String,
    pub key_hash: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// API key info (without sensitive hash)
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ApiKeyInfo {
    pub id: Uuid,
    pub name: String,
    pub created_at: chrono::DateTime<chrono::Utc>,
    pub last_used_at: Option<chrono::DateTime<chrono::Utc>>,
}

/// Database backend type
#[derive(Debug, Clone)]
pub enum DatabaseBackend {
    /// Supabase (cloud)
    Supabase {
        url: String,
        key: String,
    },
    /// SQLite (self-hosted, simple)
    Sqlite {
        path: String,
    },
    /// PostgreSQL (self-hosted, production)
    Postgres {
        url: String,
    },
}

impl DatabaseBackend {
    /// Create from environment configuration
    pub fn from_env() -> Result<Self> {
        // Check for Supabase first
        if let (Ok(url), Ok(key)) = (
            std::env::var("SUPABASE_URL"),
            std::env::var("SUPABASE_KEY"),
        ) {
            return Ok(Self::Supabase { url, key });
        }

        // Check for PostgreSQL
        if let Ok(url) = std::env::var("DATABASE_URL") {
            if url.starts_with("postgres") {
                return Ok(Self::Postgres { url });
            }
        }

        // Default to SQLite
        let path = std::env::var("SQLITE_PATH")
            .unwrap_or_else(|_| "data/jules-mac-runner.db".to_string());
        
        Ok(Self::Sqlite { path })
    }
}
