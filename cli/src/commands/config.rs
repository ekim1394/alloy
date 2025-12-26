//! Config command - manage CLI configuration

use clap::Subcommand;

#[derive(Subcommand)]
pub enum ConfigAction {
    /// Set the API URL
    SetUrl { url: String },
    /// Set the API key  
    SetKey { key: String },
    /// Show current configuration
    Show,
}

pub fn execute(action: ConfigAction) {
    match action {
        ConfigAction::SetUrl { url } => {
            println!("Setting API URL to: {url}");
            println!("Add this to your shell profile:");
            println!("  export ALLOY_API_URL=\"{url}\"");
        },
        ConfigAction::SetKey { key } => {
            println!("Setting API key");
            println!("Add this to your shell profile:");
            println!("  export ALLOY_API_KEY=\"{key}\"");
        },
        ConfigAction::Show => {
            println!("Current configuration:");
            println!(
                "  ALLOY_API_URL: {}",
                std::env::var("ALLOY_API_URL").unwrap_or_else(|_| "(not set)".to_string())
            );
            println!(
                "  ALLOY_API_KEY: {}",
                if std::env::var("ALLOY_API_KEY").is_ok() {
                    "(set)"
                } else {
                    "(not set)"
                }
            );
        },
    }
}
