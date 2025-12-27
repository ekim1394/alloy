//! Config command - manage CLI configuration

use anyhow::Result;
use clap::Subcommand;

use crate::config_store::AlloyConfig;

#[derive(Subcommand)]
pub enum ConfigAction {
    /// Set the API URL
    SetUrl { url: String },
    /// Set the API key  
    SetKey { key: String },
    /// Show current configuration
    Show,
}

pub async fn execute(action: ConfigAction) -> Result<()> {
    match action {
        ConfigAction::SetUrl { url } => {
            let mut config = AlloyConfig::load().await?;
            config.api_url = Some(url.clone());
            config.save().await?;
            println!("Updated API URL to: {url}");
        },
        ConfigAction::SetKey { key } => {
            let mut config = AlloyConfig::load().await?;
            config.api_key = Some(key);
            config.save().await?;
            println!("Updated API key");
        },
        ConfigAction::Show => {
            let config = AlloyConfig::load().await?;

            println!("Current configuration:");

            // API URL
            let env_url = std::env::var("ALLOY_API_URL").ok();
            let config_url = config.api_url.as_deref();

            let effective_url = env_url
                .as_deref()
                .or(config_url)
                .unwrap_or("https://api.alloy-ci.dev/"); // Default

            println!("  API URL: {effective_url}");
            if let Some(url) = env_url {
                println!("    (overridden by ALLOY_API_URL: {url})");
            } else if let Some(url) = config_url {
                println!("    (set in config file: {url})");
            } else {
                println!("    (default)");
            }

            // API Key
            let env_key = std::env::var("ALLOY_API_KEY").ok();
            let config_key = config.api_key.as_deref();

            let is_set = env_key.is_some() || config_key.is_some();

            println!("  API Key: {}", if is_set { "(set)" } else { "(not set)" });
            if env_key.is_some() {
                println!("    (overridden by ALLOY_API_KEY)");
            } else if config_key.is_some() {
                println!("    (set in config file)");
            }
        },
    }
    Ok(())
}
