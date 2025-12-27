use anyhow::Result;
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use tokio::fs;

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct AlloyConfig {
    pub api_url: Option<String>,
    pub api_key: Option<String>,
}

impl AlloyConfig {
    pub async fn load() -> Result<Self> {
        let config_path = get_config_path()?;
        if !config_path.exists() {
            return Ok(Self::default());
        }

        let content = fs::read_to_string(config_path).await?;
        let config: Self = serde_json::from_str(&content)?;
        Ok(config)
    }

    pub async fn save(&self) -> Result<()> {
        let config_path = get_config_path()?;
        if let Some(parent) = config_path.parent() {
            fs::create_dir_all(parent).await?;
        }

        let content = serde_json::to_string_pretty(self)?;
        fs::write(config_path, content).await?;
        Ok(())
    }
}

fn get_config_path() -> Result<PathBuf> {
    let home =
        std::env::var("HOME").map_err(|_| anyhow::anyhow!("HOME environment variable not set"))?;
    Ok(PathBuf::from(home).join(".alloy").join("config.json"))
}
