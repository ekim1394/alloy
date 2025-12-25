# Installation Guide

This guide covers installing Jules Mac Runner for both cloud and self-hosted deployments.

## Prerequisites

- **Rust** 1.70+ ([rustup.rs](https://rustup.rs))
- **macOS** for workers (Tart VMs require Apple Silicon)
- **Tart** for VM management ([github.com/cirruslabs/tart](https://github.com/cirruslabs/tart))

## Quick Install

```bash
# Clone the repository
git clone https://github.com/your-org/jules-mac-runner.git
cd jules-mac-runner

# Build all components
cargo build --release
```

This creates three binaries:
- `target/release/orchestrator` - API server
- `target/release/worker` - Mac Mini agent  
- `target/release/alloy` - CLI tool

## Installing the CLI

```bash
# Install globally
cargo install --path cli

# Or copy to PATH
cp target/release/alloy /usr/local/bin/
```

## Verify Installation

```bash
alloy --version
# jules-mac-runner-cli 0.1.0
```

## Next Steps

- [Cloud Setup](./setup-cloud.md) - Using Supabase
- [Self-Hosted Setup](./setup-self-hosted.md) - Using SQLite/PostgreSQL
- [Worker Setup](./setup-worker.md) - Configuring Mac Mini workers
