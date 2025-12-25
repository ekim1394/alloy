//! VM Pool - manages a pool of pre-warmed VMs for faster job startup

use anyhow::Result;
use std::sync::Arc;
use tokio::process::Command;
use tokio::sync::Mutex;

/// State of a VM in the pool
#[derive(Debug, Clone, PartialEq)]
pub enum VmState {
    /// VM is ready to accept a job
    Ready,
    /// VM is currently running a job
    InUse,
    /// VM is being reset after a job
    Resetting,
}

/// A VM in the pool
#[derive(Debug, Clone)]
pub struct PooledVm {
    /// VM name (used by tart)
    pub name: String,
    /// IP address of the running VM
    pub ip: String,
    /// Current state
    pub state: VmState,
}

/// Pool of pre-warmed VMs
pub struct VmPool {
    vms: Vec<Arc<Mutex<PooledVm>>>,
    base_image: String,
}

impl VmPool {
    /// Create a new VM pool and initialize VMs
    pub async fn new(pool_size: u32, base_image: &str, setup_script: Option<&str>) -> Result<Self> {
        tracing::info!(pool_size = pool_size, "Initializing VM pool...");
        
        let mut vms = Vec::with_capacity(pool_size as usize);
        
        for i in 0..pool_size {
            let vm_name = format!("pool-vm-{}", i);
            
            // Clone the VM
            tracing::info!(vm_name = %vm_name, "Cloning VM for pool...");
            let output = Command::new("tart")
                .args(["clone", base_image, &vm_name])
                .output()
                .await?;
            
            if !output.status.success() {
                let stderr = String::from_utf8_lossy(&output.stderr);
                // If VM already exists, that's ok - just use it
                if !stderr.contains("already exists") {
                    anyhow::bail!("Failed to clone VM {}: {}", vm_name, stderr);
                }
                tracing::info!(vm_name = %vm_name, "VM already exists, reusing");
            }
            
            // Start the VM
            tracing::info!(vm_name = %vm_name, "Starting VM...");
            let _child = Command::new("tart")
                .args(["run", &vm_name, "--no-graphics"])
                .spawn()?;
            
            // Wait for VM to boot
            tokio::time::sleep(std::time::Duration::from_secs(30)).await;
            
            // Get IP
            let ip_output = Command::new("tart")
                .args(["ip", &vm_name])
                .output()
                .await?;
            
            let ip = if ip_output.status.success() {
                String::from_utf8_lossy(&ip_output.stdout).trim().to_string()
            } else {
                tracing::warn!(vm_name = %vm_name, "Failed to get VM IP, will retry later");
                String::new()
            };
            
            // Run setup script if provided
            if let Some(script) = setup_script {
                if !ip.is_empty() {
                    // Check if script is a file path
                    let script_path = std::path::Path::new(script);
                    if script_path.exists() && script_path.is_file() {
                        tracing::info!(vm_name = %vm_name, script = %script, "Copying setup script to VM...");
                        
                        // Copy script to VM
                        let scp_output = Command::new("sshpass")
                            .args([
                                "-p", "admin",
                                "scp",
                                "-o", "StrictHostKeyChecking=no",
                                "-o", "UserKnownHostsFile=/dev/null",
                                "-o", "PubkeyAuthentication=no",
                                script,
                                &format!("admin@{}:~/setup.sh", ip),
                            ])
                            .output()
                            .await;
                        
                        if let Ok(output) = scp_output {
                            if output.status.success() {
                                tracing::info!(vm_name = %vm_name, "Running VM setup script...");
                                let setup_output = Command::new("sshpass")
                                    .args([
                                        "-p", "admin",
                                        "ssh",
                                        "-o", "StrictHostKeyChecking=no",
                                        "-o", "UserKnownHostsFile=/dev/null",
                                        "-o", "PubkeyAuthentication=no",
                                        &format!("admin@{}", ip),
                                        "chmod +x ~/setup.sh && ~/setup.sh",
                                    ])
                                    .output()
                                    .await;
                                
                                match setup_output {
                                    Ok(output) if output.status.success() => {
                                        tracing::info!(vm_name = %vm_name, "VM setup script completed");
                                    }
                                    Ok(output) => {
                                        let stderr = String::from_utf8_lossy(&output.stderr);
                                        let stdout = String::from_utf8_lossy(&output.stdout);
                                        tracing::warn!(vm_name = %vm_name, "VM setup script output: {}{}", stdout, stderr);
                                    }
                                    Err(e) => {
                                        tracing::warn!(vm_name = %vm_name, "VM setup script error: {}", e);
                                    }
                                }
                            } else {
                                let stderr = String::from_utf8_lossy(&output.stderr);
                                tracing::warn!(vm_name = %vm_name, "Failed to copy setup script: {}", stderr);
                            }
                        }
                    } else {
                        // Run as inline command
                        tracing::info!(vm_name = %vm_name, "Running VM setup command...");
                        let setup_output = Command::new("sshpass")
                            .args([
                                "-p", "admin",
                                "ssh",
                                "-o", "StrictHostKeyChecking=no",
                                "-o", "UserKnownHostsFile=/dev/null",
                                "-o", "PubkeyAuthentication=no",
                                &format!("admin@{}", ip),
                                script,
                            ])
                            .output()
                            .await;
                        
                        match setup_output {
                            Ok(output) if output.status.success() => {
                                tracing::info!(vm_name = %vm_name, "VM setup command completed");
                            }
                            Ok(output) => {
                                let stderr = String::from_utf8_lossy(&output.stderr);
                                tracing::warn!(vm_name = %vm_name, "VM setup command failed: {}", stderr);
                            }
                            Err(e) => {
                                tracing::warn!(vm_name = %vm_name, "VM setup command error: {}", e);
                            }
                        }
                    }
                }
            }

            
            tracing::info!(vm_name = %vm_name, ip = %ip, "VM ready in pool");
            
            vms.push(Arc::new(Mutex::new(PooledVm {
                name: vm_name,
                ip,
                state: VmState::Ready,
            })));
        }
        
        tracing::info!(pool_size = pool_size, "VM pool initialized");
        
        Ok(Self {
            vms,
            base_image: base_image.to_string(),
        })
    }

    
    /// Acquire a ready VM from the pool
    pub async fn acquire(&self) -> Option<Arc<Mutex<PooledVm>>> {
        for vm in &self.vms {
            let mut guard = vm.lock().await;
            if guard.state == VmState::Ready {
                guard.state = VmState::InUse;
                
                // Refresh IP if empty
                if guard.ip.is_empty() {
                    if let Ok(output) = Command::new("tart")
                        .args(["ip", &guard.name])
                        .output()
                        .await
                    {
                        if output.status.success() {
                            guard.ip = String::from_utf8_lossy(&output.stdout).trim().to_string();
                        }
                    }
                }
                
                tracing::info!(vm_name = %guard.name, "Acquired VM from pool");
                return Some(Arc::clone(vm));
            }
        }
        None
    }
    
    /// Release a VM back to the pool after resetting it
    pub async fn release(&self, vm: Arc<Mutex<PooledVm>>) -> Result<()> {
        let vm_name = {
            let mut guard = vm.lock().await;
            guard.state = VmState::Resetting;
            guard.name.clone()
        };
        
        tracing::info!(vm_name = %vm_name, "Resetting VM...");
        
        // Reset VM by cleaning workspace
        let _ = Command::new("sshpass")
            .args([
                "-p", "admin",
                "ssh",
                "-o", "StrictHostKeyChecking=no",
                "-o", "UserKnownHostsFile=/dev/null",
                "-o", "PubkeyAuthentication=no",
                &format!("admin@{}", vm.lock().await.ip),
                "rm -rf ~/workspace ~/source.zip",
            ])
            .output()
            .await;
        
        // Mark as ready
        {
            let mut guard = vm.lock().await;
            guard.state = VmState::Ready;
            tracing::info!(vm_name = %guard.name, "VM reset and ready");
        }
        
        Ok(())
    }
    
    /// Shutdown all VMs in the pool
    pub async fn shutdown(&self) {
        tracing::info!("Shutting down VM pool...");
        
        for vm in &self.vms {
            let guard = vm.lock().await;
            tracing::info!(vm_name = %guard.name, "Stopping VM...");
            
            let _ = Command::new("tart")
                .args(["stop", &guard.name])
                .output()
                .await;
            
            let _ = Command::new("tart")
                .args(["delete", &guard.name])
                .output()
                .await;
        }
        
        tracing::info!("VM pool shutdown complete");
    }
}
