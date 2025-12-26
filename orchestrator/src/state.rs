//! Application state shared across handlers

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use uuid::Uuid;

use crate::config::Config;
use crate::services::SupabaseClient;
use shared::WorkerInfo;

/// Shared application state
#[derive(Clone)]
pub struct AppState {
    pub config: Config,
    pub supabase: SupabaseClient,
    /// HTTP client for external API calls (like Supabase Auth)
    pub client: reqwest::Client,
    /// In-memory cache of active workers (complement to DB)
    pub workers: Arc<RwLock<HashMap<Uuid, WorkerInfo>>>,
    /// Active log streams (`job_id` -> broadcast sender)
    pub log_streams: Arc<RwLock<HashMap<Uuid, tokio::sync::broadcast::Sender<String>>>>,
}

impl AppState {
    pub fn new(config: Config) -> Self {
        let supabase = SupabaseClient::new(&config.supabase_url, &config.supabase_key);

        Self {
            config,
            supabase,
            client: reqwest::Client::new(),
            workers: Arc::new(RwLock::new(HashMap::new())),
            log_streams: Arc::new(RwLock::new(HashMap::new())),
        }
    }

    /// Create a new log stream for a job
    pub async fn create_log_stream(&self, job_id: Uuid) -> tokio::sync::broadcast::Sender<String> {
        let (tx, _) = tokio::sync::broadcast::channel(1000);
        self.log_streams.write().await.insert(job_id, tx.clone());
        tx
    }

    /// Get an existing log stream for a job
    pub async fn get_log_stream(
        &self,
        job_id: Uuid,
    ) -> Option<tokio::sync::broadcast::Sender<String>> {
        self.log_streams.read().await.get(&job_id).cloned()
    }

    /// Remove a log stream when job completes
    pub async fn remove_log_stream(&self, job_id: Uuid) {
        self.log_streams.write().await.remove(&job_id);
    }
}
