//! Configuration management for the orchestrator

use anyhow::{Context, Result};

#[derive(Debug, Clone)]
pub struct Config {
    /// Supabase project URL
    pub supabase_url: String,

    /// Supabase anon/service key
    pub supabase_key: String,

    /// Stripe secret key for billing
    #[allow(dead_code)]
    pub stripe_secret_key: Option<String>,

    /// Stripe webhook secret for verifying webhook signatures
    #[allow(dead_code)]
    pub stripe_webhook_secret: Option<String>,

    /// Stripe publishable key (for frontend)
    #[allow(dead_code)]
    pub stripe_publishable_key: Option<String>,

    /// Server port
    #[allow(dead_code)]
    pub port: u16,

    /// Base URL for the API (used in responses)
    pub base_url: String,

    /// Secret key for worker authentication (optional)
    pub worker_secret_key: Option<String>,
}

impl Config {
    pub fn from_env() -> Result<Self> {
        Ok(Self {
            supabase_url: std::env::var("SUPABASE_URL")
                .context("SUPABASE_URL environment variable required")?,
            supabase_key: std::env::var("SUPABASE_KEY")
                .context("SUPABASE_KEY environment variable required")?,
            stripe_secret_key: std::env::var("STRIPE_SECRET_KEY").ok(),
            stripe_webhook_secret: std::env::var("STRIPE_WEBHOOK_SECRET").ok(),
            stripe_publishable_key: std::env::var("STRIPE_PUBLISHABLE_KEY").ok(),
            port: std::env::var("PORT")
                .unwrap_or_else(|_| "3000".to_string())
                .parse()
                .context("Invalid PORT value")?,
            base_url: std::env::var("BASE_URL")
                .unwrap_or_else(|_| "http://localhost:3000".to_string()),
            worker_secret_key: std::env::var("WORKER_SECRET_KEY").ok(),
        })
    }
}
