# AGENTS.md - AI Agent Context

## Project Overview

**Alloy** is a self-hosted iOS/macOS build runner. It runs Xcode builds in isolated Tart VMs on Apple Silicon Macs.

## Architecture

```
CLI (alloy) → Orchestrator (API) → Worker (Mac Mini) → Tart VM
```

- **Orchestrator**: Axum-based API server, manages job queue, stores in SQLite/Supabase
- **Worker**: Runs on Mac Mini, manages VM pool, executes jobs
- **CLI**: Submits jobs, streams logs, downloads artifacts

## Tech Stack

- **Language**: Rust (2021 edition)
- **Web Framework**: Axum
- **VMs**: Tart (Apple Virtualization.framework)
- **Database**: SQLite (local) or Supabase (cloud)
- **Async Runtime**: Tokio

## Directory Structure

```
orchestrator/     # API server
worker/           # Job executor with VM pool
cli/              # Command-line tool (binary: alloy)
shared/           # Common types/models
docs/             # Documentation
supabase/         # Database schemas
```

## Key Files

- `worker/src/vm_pool.rs` - Pre-warmed VM pool management
- `worker/src/executor.rs` - Job execution pipeline
- `orchestrator/src/routes/jobs.rs` - Job API endpoints
- `cli/src/commands/run.rs` - Job submission logic

## Current State

**Implemented:**
- Job submission with local file upload
- VM pool for fast job startup (~1s vs ~30s)
- Real-time log streaming
- Artifact collection
- Job timeout, retry, cancellation
- Graceful shutdown
- Self-hosted (SQLite) and cloud (Supabase) modes

**Not Implemented:**
- Stripe billing integration
- Shared VM pool between workers (each worker owns its pool)

## Running Locally

```bash
# Build
cargo build --release

# Start orchestrator (terminal 1)
./target/release/orchestrator

# Start worker (terminal 2)
./target/release/worker

# Submit job
alloy run -c "xcodebuild build -scheme MyApp"
```

## Environment Variables

### Worker
| Variable | Default | Description |
|----------|---------|-------------|
| `ORCHESTRATOR_URL` | `http://localhost:3000` | API endpoint |
| `TART_BASE_IMAGE` | `ghcr.io/cirruslabs/macos-sonoma-xcode:latest` | VM image |
| `VM_POOL_SIZE` | `2` | Pre-warmed VMs |
| `JOB_TIMEOUT_MINUTES` | `60` | Max job duration |

### Orchestrator
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_MODE` | `local` | `local` (SQLite) or `supabase` |
| `BASE_URL` | `http://localhost:3000` | Public URL |

## Common Tasks

### Adding a new CLI command
1. Create `cli/src/commands/yourcommand.rs`
2. Add to `cli/src/commands/mod.rs`
3. Register in `cli/src/main.rs`

### Adding an API endpoint
1. Add handler in `orchestrator/src/routes/`
2. Register route in `orchestrator/src/main.rs`

### Modifying job execution
1. Edit `worker/src/executor.rs`
2. VM lifecycle is in `worker/src/vm_pool.rs`

## Known Issues

- Dead code warnings in `orchestrator/src/auth.rs` (auth middleware not yet used)
- `base_image` field in VmPool unused (for future hot-reload of base image)
