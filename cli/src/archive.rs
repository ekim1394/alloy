//! File archiving utilities for local uploads

use anyhow::Result;
use std::path::Path;
use std::process::Command;

/// Create a zip archive of the current directory
/// Includes uncommitted changes (working directory state, not just HEAD)
pub fn create_archive(source_dir: &Path) -> Result<Vec<u8>> {
    use std::fs::File;
    use std::io::{Read, Write};
    use zip::write::FileOptions;
    use zip::ZipWriter;

    // Check if this is a git repo
    let git_check = Command::new("git")
        .args(["rev-parse", "--is-inside-work-tree"])
        .current_dir(source_dir)
        .output()?;

    if !git_check.status.success() {
        anyhow::bail!(
            "Directory is not a git repository. Please initialize with 'git init' or use --repo flag."
        );
    }

    // Get list of tracked files (respects .gitignore)
    let output = Command::new("git")
        .args(["ls-files"])
        .current_dir(source_dir)
        .output()?;

    if !output.status.success() {
        anyhow::bail!("git ls-files failed");
    }

    let mut buffer = Vec::new();

    {
        let cursor = std::io::Cursor::new(&mut buffer);
        let mut zip = ZipWriter::new(cursor);
        let options = FileOptions::default()
            .compression_method(zip::CompressionMethod::Deflated)
            .unix_permissions(0o755);

        let files = String::from_utf8_lossy(&output.stdout);
        for file in files.lines() {
            let file_path = source_dir.join(file);
            if file_path.is_file() {
                zip.start_file(file.to_string(), options)?;
                let mut f = File::open(&file_path)?;
                let mut contents = Vec::new();
                f.read_to_end(&mut contents)?;
                zip.write_all(&contents)?;
            }
        }

        zip.finish()?;
    }

    Ok(buffer)
}

/// Get the current git commit SHA (short form)
pub fn get_commit_sha(source_dir: &Path) -> Result<String> {
    let output = Command::new("git")
        .args(["rev-parse", "--short", "HEAD"])
        .current_dir(source_dir)
        .output()?;

    if !output.status.success() {
        anyhow::bail!("Failed to get git commit SHA");
    }

    Ok(String::from_utf8_lossy(&output.stdout).trim().to_string())
}

/// Get the size of the archive in a human-readable format
pub fn format_size(bytes: usize) -> String {
    const KB: usize = 1024;
    const MB: usize = KB * 1024;
    const GB: usize = MB * 1024;

    if bytes >= GB {
        format!("{:.2} GB", bytes as f64 / GB as f64)
    } else if bytes >= MB {
        format!("{:.2} MB", bytes as f64 / MB as f64)
    } else if bytes >= KB {
        format!("{:.2} KB", bytes as f64 / KB as f64)
    } else {
        format!("{bytes} bytes")
    }
}
