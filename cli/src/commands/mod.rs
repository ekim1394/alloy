//! CLI commands

pub mod artifacts;
pub mod cancel;
pub mod config;
pub mod jobs;
pub mod logs;
pub mod retry;
pub mod run;
pub mod status;

/// Format build time (in minutes) as a human-readable string
/// Examples: "45s", "5m 30s", "1h 23m 45s"
#[allow(clippy::cast_possible_truncation, clippy::cast_sign_loss)]
pub fn format_build_time(minutes: f64) -> String {
    let total_seconds = (minutes * 60.0).round() as u64;
    let hours = total_seconds / 3600;
    let mins = (total_seconds % 3600) / 60;
    let secs = total_seconds % 60;

    if hours > 0 {
        format!("{hours}h {mins}m {secs}s")
    } else if mins > 0 {
        format!("{mins}m {secs}s")
    } else {
        format!("{secs}s")
    }
}
