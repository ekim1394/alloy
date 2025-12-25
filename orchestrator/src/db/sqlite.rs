//! SQLite database backend for self-hosted deployments

use anyhow::Result;
use async_trait::async_trait;
use chrono::Utc;
use sqlx::{sqlite::SqlitePoolOptions, Pool, Sqlite};
use uuid::Uuid;

use shared::{Artifact, Job, JobStatus, SourceType, WorkerInfo};
use super::{ApiKeyInfo, ApiKeyRecord, Database};

/// SQLite database implementation
#[derive(Clone)]
pub struct SqliteDb {
    pool: Pool<Sqlite>,
}

impl SqliteDb {
    /// Create a new SQLite database connection
    pub async fn new(database_path: &str) -> Result<Self> {
        // Create directory if needed
        if let Some(parent) = std::path::Path::new(database_path).parent() {
            std::fs::create_dir_all(parent)?;
        }

        let pool = SqlitePoolOptions::new()
            .max_connections(5)
            .connect(&format!("sqlite:{}?mode=rwc", database_path))
            .await?;

        let db = Self { pool };
        db.run_migrations().await?;
        
        Ok(db)
    }

    /// Run database migrations
    async fn run_migrations(&self) -> Result<()> {
        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS jobs (
                id TEXT PRIMARY KEY,
                customer_id TEXT NOT NULL,
                source_type TEXT NOT NULL DEFAULT 'git',
                source_url TEXT,
                command TEXT,
                script TEXT,
                status TEXT NOT NULL DEFAULT 'pending',
                worker_id TEXT,
                created_at TEXT NOT NULL,
                started_at TEXT,
                completed_at TEXT,
                exit_code INTEGER,
                build_minutes REAL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS workers (
                id TEXT PRIMARY KEY,
                hostname TEXT NOT NULL,
                capacity INTEGER NOT NULL,
                current_jobs INTEGER NOT NULL DEFAULT 0,
                last_heartbeat TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'online'
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS artifacts (
                id TEXT PRIMARY KEY,
                job_id TEXT NOT NULL,
                name TEXT NOT NULL,
                path TEXT NOT NULL,
                size_bytes INTEGER NOT NULL DEFAULT 0,
                download_url TEXT,
                FOREIGN KEY (job_id) REFERENCES jobs(id)
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS api_keys (
                id TEXT PRIMARY KEY,
                user_id TEXT NOT NULL,
                name TEXT NOT NULL,
                key_hash TEXT NOT NULL UNIQUE,
                created_at TEXT NOT NULL,
                last_used_at TEXT
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        sqlx::query(
            r#"
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                email TEXT UNIQUE,
                password_hash TEXT,
                created_at TEXT NOT NULL
            )
            "#,
        )
        .execute(&self.pool)
        .await?;

        // Create indexes
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)")
            .execute(&self.pool)
            .await?;
        sqlx::query("CREATE INDEX IF NOT EXISTS idx_api_keys_hash ON api_keys(key_hash)")
            .execute(&self.pool)
            .await?;

        Ok(())
    }
}

#[async_trait]
impl Database for SqliteDb {
    async fn create_job(&self, job: &Job) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO jobs (id, customer_id, source_type, source_url, command, script, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(job.id.to_string())
        .bind(job.customer_id.to_string())
        .bind(job.source_type.to_string())
        .bind(&job.source_url)
        .bind(&job.command)
        .bind(&job.script)
        .bind(job.status.to_string())
        .bind(job.created_at.to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn get_job(&self, job_id: Uuid) -> Result<Option<Job>> {
        let row = sqlx::query_as::<_, JobRow>(
            "SELECT * FROM jobs WHERE id = ?"
        )
        .bind(job_id.to_string())
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| r.into()))
    }

    async fn claim_pending_job(&self, worker_id: Uuid) -> Result<Option<Job>> {
        // Find and claim a pending job atomically
        let row = sqlx::query_as::<_, JobRow>(
            r#"
            UPDATE jobs 
            SET status = 'running', worker_id = ?, started_at = ?
            WHERE id = (
                SELECT id FROM jobs WHERE status = 'pending' ORDER BY created_at ASC LIMIT 1
            )
            RETURNING *
            "#,
        )
        .bind(worker_id.to_string())
        .bind(Utc::now().to_rfc3339())
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| r.into()))
    }

    async fn complete_job(
        &self,
        job_id: Uuid,
        status: JobStatus,
        exit_code: i32,
        build_minutes: f64,
    ) -> Result<()> {
        sqlx::query(
            r#"
            UPDATE jobs 
            SET status = ?, exit_code = ?, build_minutes = ?, completed_at = ?
            WHERE id = ?
            "#,
        )
        .bind(status.to_string())
        .bind(exit_code)
        .bind(build_minutes)
        .bind(Utc::now().to_rfc3339())
        .bind(job_id.to_string())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn register_worker(&self, worker: &WorkerInfo) -> Result<()> {
        sqlx::query(
            r#"
            INSERT OR REPLACE INTO workers (id, hostname, capacity, current_jobs, last_heartbeat, status)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(worker.id.to_string())
        .bind(&worker.hostname)
        .bind(worker.capacity as i64)
        .bind(worker.current_jobs as i64)
        .bind(worker.last_heartbeat.to_rfc3339())
        .bind(format!("{:?}", worker.status).to_lowercase())
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn update_worker_heartbeat(&self, worker_id: Uuid) -> Result<()> {
        sqlx::query("UPDATE workers SET last_heartbeat = ? WHERE id = ?")
            .bind(Utc::now().to_rfc3339())
            .bind(worker_id.to_string())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn get_job_artifacts(&self, job_id: Uuid) -> Result<Vec<Artifact>> {
        let rows = sqlx::query_as::<_, ArtifactRow>(
            "SELECT * FROM artifacts WHERE job_id = ?"
        )
        .bind(job_id.to_string())
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn store_artifact(&self, job_id: Uuid, artifact: &Artifact) -> Result<()> {
        sqlx::query(
            r#"
            INSERT INTO artifacts (id, job_id, name, path, size_bytes, download_url)
            VALUES (?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(Uuid::new_v4().to_string())
        .bind(job_id.to_string())
        .bind(&artifact.name)
        .bind(&artifact.path)
        .bind(artifact.size_bytes as i64)
        .bind(&artifact.download_url)
        .execute(&self.pool)
        .await?;

        Ok(())
    }

    async fn verify_api_key(&self, key_hash: &str) -> Result<Option<ApiKeyRecord>> {
        let row = sqlx::query_as::<_, ApiKeyRow>(
            "SELECT * FROM api_keys WHERE key_hash = ?"
        )
        .bind(key_hash)
        .fetch_optional(&self.pool)
        .await?;

        Ok(row.map(|r| r.into()))
    }

    async fn update_api_key_usage(&self, key_id: Uuid) -> Result<()> {
        sqlx::query("UPDATE api_keys SET last_used_at = ? WHERE id = ?")
            .bind(Utc::now().to_rfc3339())
            .bind(key_id.to_string())
            .execute(&self.pool)
            .await?;

        Ok(())
    }

    async fn create_api_key(&self, user_id: Uuid, name: &str, key_hash: &str) -> Result<Uuid> {
        let key_id = Uuid::new_v4();
        
        sqlx::query(
            r#"
            INSERT INTO api_keys (id, user_id, name, key_hash, created_at)
            VALUES (?, ?, ?, ?, ?)
            "#,
        )
        .bind(key_id.to_string())
        .bind(user_id.to_string())
        .bind(name)
        .bind(key_hash)
        .bind(Utc::now().to_rfc3339())
        .execute(&self.pool)
        .await?;

        Ok(key_id)
    }

    async fn list_api_keys(&self, user_id: Uuid) -> Result<Vec<ApiKeyInfo>> {
        let rows = sqlx::query_as::<_, ApiKeyInfoRow>(
            "SELECT id, name, created_at, last_used_at FROM api_keys WHERE user_id = ?"
        )
        .bind(user_id.to_string())
        .fetch_all(&self.pool)
        .await?;

        Ok(rows.into_iter().map(|r| r.into()).collect())
    }

    async fn delete_api_key(&self, user_id: Uuid, key_id: Uuid) -> Result<bool> {
        let result = sqlx::query("DELETE FROM api_keys WHERE id = ? AND user_id = ?")
            .bind(key_id.to_string())
            .bind(user_id.to_string())
            .execute(&self.pool)
            .await?;

        Ok(result.rows_affected() > 0)
    }
    
    async fn verify_user(&self, email: &str, password: &str) -> Result<Option<Uuid>> {
        // Hash the password the same way we do for registration
        let password_hash = format!("{:x}", md5::compute(password));
        
        let result: Option<(String,)> = sqlx::query_as(
            "SELECT id FROM users WHERE email = ? AND password_hash = ?"
        )
        .bind(email)
        .bind(&password_hash)
        .fetch_optional(&self.pool)
        .await?;
        
        Ok(result.map(|(id,)| Uuid::parse_str(&id).unwrap_or_default()))
    }
    
    async fn create_user(&self, email: &str, password_hash: &str) -> Result<Uuid> {
        let user_id = Uuid::new_v4();
        let now = Utc::now().to_rfc3339();
        
        sqlx::query(
            "INSERT INTO users (id, email, password_hash, created_at) VALUES (?, ?, ?, ?)"
        )
        .bind(user_id.to_string())
        .bind(email)
        .bind(password_hash)
        .bind(now)
        .execute(&self.pool)
        .await?;
        
        Ok(user_id)
    }
}


// Row types for SQLx
#[derive(sqlx::FromRow)]
struct JobRow {
    id: String,
    customer_id: String,
    source_type: String,
    source_url: Option<String>,
    command: Option<String>,
    script: Option<String>,
    status: String,
    worker_id: Option<String>,
    created_at: String,
    started_at: Option<String>,
    completed_at: Option<String>,
    exit_code: Option<i32>,
    build_minutes: Option<f64>,
}

impl From<JobRow> for Job {
    fn from(row: JobRow) -> Self {
        Job {
            id: Uuid::parse_str(&row.id).unwrap_or_default(),
            customer_id: Uuid::parse_str(&row.customer_id).unwrap_or_default(),
            source_type: match row.source_type.as_str() {
                "upload" => SourceType::Upload,
                _ => SourceType::Git,
            },
            source_url: row.source_url,
            command: row.command,
            script: row.script,
            status: match row.status.as_str() {
                "running" => JobStatus::Running,
                "completed" => JobStatus::Completed,
                "failed" => JobStatus::Failed,
                "cancelled" => JobStatus::Cancelled,
                _ => JobStatus::Pending,
            },
            worker_id: row.worker_id.and_then(|s| Uuid::parse_str(&s).ok()),
            created_at: chrono::DateTime::parse_from_rfc3339(&row.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            started_at: row.started_at.and_then(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .ok()
            }),
            completed_at: row.completed_at.and_then(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .ok()
            }),
            exit_code: row.exit_code,
            build_minutes: row.build_minutes,
        }
    }
}

#[derive(sqlx::FromRow)]
struct ArtifactRow {
    #[allow(dead_code)]
    id: String,
    #[allow(dead_code)]
    job_id: String,
    name: String,
    path: String,
    size_bytes: i64,
    download_url: Option<String>,
}

impl From<ArtifactRow> for Artifact {
    fn from(row: ArtifactRow) -> Self {
        Artifact {
            name: row.name,
            path: row.path,
            size_bytes: row.size_bytes as u64,
            download_url: row.download_url,
        }
    }
}

#[derive(sqlx::FromRow)]
struct ApiKeyRow {
    id: String,
    user_id: String,
    name: String,
    key_hash: String,
    created_at: String,
    last_used_at: Option<String>,
}

impl From<ApiKeyRow> for ApiKeyRecord {
    fn from(row: ApiKeyRow) -> Self {
        ApiKeyRecord {
            id: Uuid::parse_str(&row.id).unwrap_or_default(),
            user_id: Uuid::parse_str(&row.user_id).unwrap_or_default(),
            name: row.name,
            key_hash: row.key_hash,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            last_used_at: row.last_used_at.and_then(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .ok()
            }),
        }
    }
}

#[derive(sqlx::FromRow)]
struct ApiKeyInfoRow {
    id: String,
    name: String,
    created_at: String,
    last_used_at: Option<String>,
}

impl From<ApiKeyInfoRow> for ApiKeyInfo {
    fn from(row: ApiKeyInfoRow) -> Self {
        ApiKeyInfo {
            id: Uuid::parse_str(&row.id).unwrap_or_default(),
            name: row.name,
            created_at: chrono::DateTime::parse_from_rfc3339(&row.created_at)
                .map(|dt| dt.with_timezone(&Utc))
                .unwrap_or_else(|_| Utc::now()),
            last_used_at: row.last_used_at.and_then(|s| {
                chrono::DateTime::parse_from_rfc3339(&s)
                    .map(|dt| dt.with_timezone(&Utc))
                    .ok()
            }),
        }
    }
}
