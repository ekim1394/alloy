//! Job executor with Tart VM integration

use anyhow::Result;
use chrono::Utc;
use std::process::Stdio;
use std::sync::Arc;
use tokio::io::{AsyncBufReadExt, AsyncWriteExt, BufReader};
use tokio::process::Command;
use tokio::sync::Mutex;
use uuid::Uuid;

use shared::{Artifact, Job, JobResult, LogEntry, LogStream, SourceType};
use crate::config::Config;
use crate::orchestrator_client::OrchestratorClient;
use crate::vm_pool::{PooledVm, VmPool};

/// Default VM credentials (admin/admin for Cirrus Tart images)
const VM_USER: &str = "admin";
const VM_PASSWORD: &str = "admin";

pub struct JobExecutor {
    worker_id: Uuid,
    client: OrchestratorClient,
    config: Config,
    vm_pool: Arc<VmPool>,
}

impl JobExecutor {
    pub fn new(worker_id: Uuid, client: OrchestratorClient, config: Config, vm_pool: Arc<VmPool>) -> Self {
        Self {
            worker_id,
            client,
            config,
            vm_pool,
        }
    }

    /// Execute a job in a Tart VM with timeout
    pub async fn execute(&self, job: &Job) -> Result<JobResult> {
        let timeout_duration = std::time::Duration::from_secs(self.config.job_timeout_minutes * 60);
        
        // Acquire a VM from the pool
        let vm = self.vm_pool.acquire().await
            .ok_or_else(|| anyhow::anyhow!("No VMs available in pool"))?;
        
        let vm_for_release = Arc::clone(&vm);
        let pool_for_release = Arc::clone(&self.vm_pool);
        
        let result = tokio::time::timeout(timeout_duration, self.execute_with_vm(job, &vm)).await;
        
        // Always release VM back to pool
        if let Err(e) = pool_for_release.release(vm_for_release).await {
            tracing::warn!(job_id = %job.id, "Failed to release VM to pool: {}", e);
        }
        
        match result {
            Ok(inner_result) => inner_result,
            Err(_) => {
                tracing::error!(job_id = %job.id, timeout_minutes = self.config.job_timeout_minutes, "Job timed out");
                anyhow::bail!("Job timed out after {} minutes", self.config.job_timeout_minutes)
            }
        }
    }

    /// Execute job with a specific pooled VM
    async fn execute_with_vm(&self, job: &Job, vm: &Arc<Mutex<PooledVm>>) -> Result<JobResult> {
        let start_time = Utc::now();
        
        let vm_ip = {
            let guard = vm.lock().await;
            tracing::info!(job_id = %job.id, vm_name = %guard.name, vm_ip = %guard.ip, "Using pooled VM");
            guard.ip.clone()
        };
        
        // Define log path
        let log_path = std::env::temp_dir().join(format!("job-{}.log", job.id));
        
        // Step 1: Fetch source code into VM
        tracing::info!(job_id = %job.id, source_type = ?job.source_type, "Fetching source...");
        self.fetch_source(job, &vm_ip).await?;
        
        // Step 2: Execute the command (capturing logs to file)
        tracing::info!(job_id = %job.id, "Executing command...");
        let exit_code = self.execute_in_vm(job, &vm_ip, &log_path).await?;
        
        // Step 3: Upload logs to storage
        tracing::info!(job_id = %job.id, "Uploading logs...");
        if let Err(e) = self.client.upload_log_file(job.id, &log_path).await {
            tracing::error!(job_id = %job.id, "Failed to upload logs: {}", e);
            // Don't fail the build just because log upload failed, 
            // but we should probably note it.
        }
        
        // Cleanup log file
        let _ = tokio::fs::remove_file(&log_path).await;
        
        // Step 4: Collect artifacts
        let artifacts = self.collect_artifacts(job, &vm_ip).await?;
        
        let end_time = Utc::now();
        let build_minutes = (end_time - start_time).num_seconds() as f64 / 60.0;
        
        Ok(JobResult {
            job_id: job.id,
            exit_code,
            artifacts,
            build_minutes,
        })
    }

    /// Fetch source code into the VM based on source type
    async fn fetch_source(&self, job: &Job, vm_ip: &str) -> Result<()> {
        let source_url = job.source_url.as_ref()
            .ok_or_else(|| anyhow::anyhow!("No source URL provided"))?;
        
        let fetch_cmd = match job.source_type {
            SourceType::Git => {
                // Clone git repository
                format!(
                    "cd ~ && git clone --depth 1 '{}' workspace && cd workspace",
                    source_url
                )
            }
            SourceType::Upload => {
                // Download and extract archive
                format!(
                    "cd ~ && curl -sL '{}' -o source.zip && unzip -q source.zip -d workspace && cd workspace",
                    source_url
                )
            }
        };
        
        // Use sshpass for non-interactive password authentication
        let output = Command::new("sshpass")
            .args([
                "-p", VM_PASSWORD,
                "ssh",
                "-o", "StrictHostKeyChecking=no",
                "-o", "UserKnownHostsFile=/dev/null",
                "-o", "PubkeyAuthentication=no",
                &format!("{}@{}", VM_USER, vm_ip),
                &fetch_cmd,
            ])
            .output()
            .await?;
        
        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            anyhow::bail!("Failed to fetch source: {}", stderr);
        }
        
        Ok(())
    }

    /// Clone the base VM image
    async fn tart_clone(&self, vm_name: &str) -> Result<()> {
        let output = Command::new("tart")
            .args(["clone", &self.config.tart_base_image, vm_name])
            .output()
            .await?;

        if !output.status.success() {
            anyhow::bail!(
                "Failed to clone VM: {}",
                String::from_utf8_lossy(&output.stderr)
            );
        }

        Ok(())
    }

    /// Start the VM and get its IP address
    async fn tart_run(&self, vm_name: &str) -> Result<String> {
        // Start VM in background
        let _child = Command::new("tart")
            .args(["run", vm_name, "--no-graphics"])
            .spawn()?;

        // Wait for VM to boot and get IP
        tokio::time::sleep(std::time::Duration::from_secs(30)).await;
        
        let output = Command::new("tart")
            .args(["ip", vm_name])
            .output()
            .await?;

        if !output.status.success() {
            anyhow::bail!("Failed to get VM IP");
        }

        let ip = String::from_utf8_lossy(&output.stdout).trim().to_string();
        Ok(ip)
    }

    /// Execute the job command inside the VM via SSH
    async fn execute_in_vm(&self, job: &Job, vm_ip: &str, log_path: &std::path::Path) -> Result<i32> {
        // Get the executable (command or script)
        let executable = job.executable()
            .ok_or_else(|| anyhow::anyhow!("Job has no command or script"))?;
        
        // Setup log writer
        let log_file = tokio::fs::File::create(log_path).await?;
        let log_writer = Arc::new(Mutex::new(tokio::io::BufWriter::new(log_file)));
        
        // If it's a script, write it to VM and execute
        let run_cmd = if job.script.is_some() {
            // Write script to file and execute
            format!(
                "cat > /tmp/build_script.sh << 'SCRIPT_EOF'\n{}\nSCRIPT_EOF\nchmod +x /tmp/build_script.sh && cd ~/workspace && /tmp/build_script.sh",
                executable
            )
        } else {
            // Single command, run in workspace
            format!("cd ~/workspace && {}", executable)
        };

        let mut cmd = Command::new("sshpass");
        cmd.args([
            "-p", VM_PASSWORD,
            "ssh",
            "-tt",  // Force PTY allocation for tools like fastlane
            "-o", "StrictHostKeyChecking=no",
            "-o", "UserKnownHostsFile=/dev/null",
            "-o", "PubkeyAuthentication=no",
            &format!("{}@{}", VM_USER, vm_ip),
            &run_cmd,
        ])
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());


        let mut child = cmd.spawn()?;
        
        // Stream stdout
        if let Some(stdout) = child.stdout.take() {
            let client = self.client.clone();
            let worker_id = self.worker_id;
            let job_id = job.id;
            let writer = Arc::clone(&log_writer);
            
            tokio::spawn(async move {
                let reader = BufReader::new(stdout);
                let mut lines = reader.lines();
                
                while let Ok(Some(line)) = lines.next_line().await {
                    // Write to file
                    {
                        let mut w = writer.lock().await;
                        let file_entry = format!("[stdout] {}\n", line);
                        let _ = w.write_all(file_entry.as_bytes()).await;
                    }

                    // Send to orchestrator (real-time stream)
                    let entry = LogEntry {
                        job_id,
                        timestamp: Utc::now(),
                        stream: LogStream::Stdout,
                        content: line,
                    };
                    let _ = client.push_log(worker_id, &entry).await;
                }
            });
        }
        
        // Stream stderr
        if let Some(stderr) = child.stderr.take() {
            let client = self.client.clone();
            let worker_id = self.worker_id;
            let job_id = job.id;
            let writer = Arc::clone(&log_writer);
            
            tokio::spawn(async move {
                let reader = BufReader::new(stderr);
                let mut lines = reader.lines();
                
                while let Ok(Some(line)) = lines.next_line().await {
                    // Write to file
                    {
                        let mut w = writer.lock().await;
                        let file_entry = format!("[stderr] {}\n", line);
                        let _ = w.write_all(file_entry.as_bytes()).await;
                    }

                    // Send to orchestrator (real-time stream)
                    let entry = LogEntry {
                        job_id,
                        timestamp: Utc::now(),
                        stream: LogStream::Stderr,
                        content: line,
                    };
                    let _ = client.push_log(worker_id, &entry).await;
                }
            });
        }

        let status = child.wait().await?;
        
        // Flush writer
        let mut w = log_writer.lock().await;
        let _ = w.flush().await;

        Ok(status.code().unwrap_or(-1))
    }

    /// Collect build artifacts from the VM
    async fn collect_artifacts(&self, _job: &Job, vm_ip: &str) -> Result<Vec<Artifact>> {
        let mut artifacts = Vec::new();
        
        // Look for common artifact patterns
        let patterns = [
            "~/Library/Developer/Xcode/DerivedData/**/*.xcresult",
            "~/build/*.app",
            "~/build/*.ipa",
        ];
        
        for pattern in patterns {
            let output = Command::new("sshpass")
                .args([
                    "-p", VM_PASSWORD,
                    "ssh",
                    "-o", "StrictHostKeyChecking=no",
                    "-o", "UserKnownHostsFile=/dev/null",
                    &format!("{}@{}", VM_USER, vm_ip),
                    &format!("ls -la {} 2>/dev/null || true", pattern),
                ])
                .output()
                .await?;

            if output.status.success() {
                let files = String::from_utf8_lossy(&output.stdout);
                for line in files.lines() {
                    if let Some(artifact) = parse_ls_line(line, pattern) {
                        artifacts.push(artifact);
                    }
                }
            }
        }
        
        Ok(artifacts)
    }

    /// Delete the VM
    async fn tart_delete(&self, vm_name: &str) -> Result<()> {
        // First stop the VM if running
        let _ = Command::new("tart")
            .args(["stop", vm_name])
            .output()
            .await;
        
        // Then delete it
        let output = Command::new("tart")
            .args(["delete", vm_name])
            .output()
            .await?;

        if !output.status.success() {
            let stderr = String::from_utf8_lossy(&output.stderr);
            // Ignore "does not exist" errors - VM may have never been created
            if !stderr.contains("does not exist") {
                tracing::warn!("Failed to delete VM {}: {}", vm_name, stderr);
            }
        }

        Ok(())
    }
}

/// Helper to parse ls -la output
fn parse_ls_line(line: &str, pattern: &str) -> Option<Artifact> {
    if line.is_empty() || line.starts_with("total") {
        return None;
    }

    let parts: Vec<&str> = line.split_whitespace().collect();

    // We expect at least enough parts to have a filename.
    // ls -l output format:
    // permissions links owner group size date time name
    // -rw-r--r--  1     user  staff 1234 Oct  25 10:00 file.txt

    // Safe check: assume name is last.
    let name = parts.last()?;

    // Try to parse size at index 4. If fails or index out of bounds, default to 0.
    // This assumes standard 8-column ls output (or 9 with year/time split differently, but size is usually 5th field).
    // Index 4 is the 5th field.
    let size_bytes = if parts.len() >= 5 {
        parts[4].parse::<u64>().unwrap_or(0)
    } else {
        0
    };

    Some(Artifact {
        name: name.to_string(),
        path: pattern.to_string(),
        size_bytes,
        download_url: None,
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_ls_line() {
        let pattern = "~/build/*.ipa";

        // Standard case
        let line = "-rw-r--r--  1 user  staff  12345678 Oct 25 10:00 app.ipa";
        let artifact = parse_ls_line(line, pattern).expect("Should parse");
        assert_eq!(artifact.name, "app.ipa");
        assert_eq!(artifact.size_bytes, 12345678);

        // Empty line
        assert!(parse_ls_line("", pattern).is_none());

        // Total line
        assert!(parse_ls_line("total 1234", pattern).is_none());

        // Missing size (malformed) - should still parse name but size 0 if index 4 is missing/invalid
        let line_short = "-rw-r--r-- 1 user app.ipa"; // Not enough fields
        let artifact = parse_ls_line(line_short, pattern).expect("Should parse");
        assert_eq!(artifact.name, "app.ipa");
        assert_eq!(artifact.size_bytes, 0); // Default to 0

        // Invalid size
        let line_invalid_size = "-rw-r--r--  1 user  staff  NOT_A_NUMBER Oct 25 10:00 app.ipa";
        let artifact = parse_ls_line(line_invalid_size, pattern).expect("Should parse");
        assert_eq!(artifact.name, "app.ipa");
        assert_eq!(artifact.size_bytes, 0);
    }
}
