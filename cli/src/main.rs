//! Alloy CLI - Jules Mac Runner client
//!
//! A lightweight CLI for submitting iOS builds to the Jules Mac Runner platform.

mod archive;
mod client;
mod commands;

use clap::{Parser, Subcommand};
use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

use commands::config::ConfigAction;

#[derive(Parser)]
#[command(name = "alloy")]
#[command(author = "Jules Mac Runner")]
#[command(version = option_env!("ALLOY_VERSION").unwrap_or(env!("CARGO_PKG_VERSION")))]
#[command(about = "Remote macOS builds for iOS developers and AI agents")]
struct Cli {
    /// API endpoint URL
    #[arg(long, default_value = "http://localhost:3000")]
    api_url: String,

    /// API key for authentication
    #[arg(long)]
    api_key: Option<String>,

    #[command(subcommand)]
    command: Commands,
}

#[derive(Subcommand)]
enum Commands {
    /// Run a build script on a remote Mac
    Run {
        /// Path to script file to execute (default: ./build.sh or ./ci.sh if exists)
        script: Option<String>,

        /// Inline command to execute (alternative to script)
        #[arg(short, long)]
        command: Option<String>,

        /// Git repository URL to clone
        #[arg(short, long)]
        repo: Option<String>,
    },

    /// Check the status of a job
    Status {
        /// Job ID to check
        job_id: String,
    },

    /// Download artifacts from a completed job
    Artifacts {
        /// Job ID to download artifacts from
        job_id: String,

        /// Output directory
        #[arg(short, long, default_value = ".")]
        output: String,
    },

    /// Cancel a running job
    Cancel {
        /// Job ID to cancel
        job_id: String,
    },

    /// Stream logs from a running job
    Logs {
        /// Job ID to stream logs from
        job_id: String,
    },

    /// List recent jobs
    Jobs {
        /// Filter by status (pending, running, completed, failed, cancelled)
        #[arg(short, long)]
        status: Option<String>,
    },

    /// Retry a failed or cancelled job
    Retry {
        /// Job ID to retry
        job_id: String,
    },

    /// Configure the CLI
    Config {
        /// Configuration action
        #[command(subcommand)]
        action: ConfigAction,
    },
}

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    // Load .env file if present
    dotenvy::dotenv().ok();

    // Initialize logging (quiet by default for CLI)
    tracing_subscriber::registry()
        .with(
            tracing_subscriber::EnvFilter::try_from_default_env().unwrap_or_else(|_| "warn".into()),
        )
        .with(tracing_subscriber::fmt::layer().with_target(false))
        .init();

    let cli = Cli::parse();

    // Allow environment variables to override CLI args
    let api_url = std::env::var("ALLOY_API_URL").unwrap_or(cli.api_url);
    let api_key = cli.api_key.or_else(|| std::env::var("ALLOY_API_KEY").ok());

    let client = client::AlloyClient::new(&api_url, api_key.as_deref());

    match cli.command {
        Commands::Run {
            script,
            command,
            repo,
        } => commands::run::execute(client, command, script, repo).await,
        Commands::Status { job_id } => commands::status::execute(client, &job_id).await,
        Commands::Artifacts { job_id, output } => {
            commands::artifacts::execute(client, &job_id, &output).await
        },
        Commands::Cancel { job_id } => commands::cancel::execute(client, &job_id).await,
        Commands::Logs { job_id } => commands::logs::execute(client, &job_id).await,
        Commands::Jobs { status } => commands::jobs::execute(client, status.as_deref()).await,
        Commands::Retry { job_id } => commands::retry::execute(client, &job_id).await,
        Commands::Config { action } => {
            commands::config::execute(action);
            Ok(())
        },
    }
}
