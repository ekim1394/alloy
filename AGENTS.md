# AGENTS.md - AI Agent Context

## Project Overview

**Alloy** is a self-hosted iOS/macOS build runner. It runs Xcode builds in isolated Tart VMs on Apple Silicon Macs.

## Architecture

```
CLI (alloy) → Orchestrator (API) → Worker (Mac Mini) → Tart VM
Dashboard → Supabase (Auth + DB) → Stripe (Billing)
```

- **Orchestrator**: Axum-based API server, manages job queue, stores in SQLite/Supabase
- **Worker**: Runs on Mac Mini, manages VM pool, executes jobs
- **CLI**: Submits jobs, streams logs, downloads artifacts
- **Dashboard**: React frontend for job management and billing

## Tech Stack

- **Language**: Rust (2021 edition), TypeScript (dashboard)
- **Web Framework**: Axum (backend), React + Vite (frontend)
- **VMs**: Tart (Apple Virtualization.framework)
- **Database**: SQLite (local) or Supabase (cloud)
- **Billing**: Stripe via Supabase Wrapper + Edge Functions
- **Async Runtime**: Tokio

## Directory Structure

```
orchestrator/       # API server
worker/             # Job executor with VM pool
cli/                # Command-line tool (binary: alloy)
shared/             # Common types/models
dashboard/          # React frontend
supabase/
  migrations/       # Database schemas
  functions/        # Edge Functions (billing)
docs/               # Documentation
```

## Key Files

- `worker/src/vm_pool.rs` - Pre-warmed VM pool management
- `worker/src/executor.rs` - Job execution pipeline
- `orchestrator/src/routes/jobs.rs` - Job API endpoints
- `cli/src/commands/run.rs` - Job submission logic
- `dashboard/src/pages/Billing.tsx` - Subscription management UI
- `supabase/functions/create-checkout/` - Stripe checkout Edge Function
- `supabase/functions/stripe-webhook/` - Webhook handler

## Current State

**Implemented:**
- Job submission with local file upload
- VM pool for fast job startup (~1s vs ~30s)
- Real-time log streaming
- Artifact collection
- Job timeout, retry, cancellation
- Graceful shutdown
- Self-hosted (SQLite) and cloud (Supabase) modes
- Worker authentication (shared secret)
- **Stripe billing** (Supabase native via wrapper + Edge Functions)
- Dashboard billing page

**Billing Architecture:**
- Uses Supabase Stripe Wrapper for querying Stripe data via SQL
- Edge Functions for checkout/portal sessions
- 7-day trial for Pro plan, no free tier
- Pro: $20/mo, 300 min included, overage billed
- Team: $200/mo, unlimited minutes

## Running Locally

```bash
# Build
cargo build --release

# Start orchestrator (terminal 1)
./target/release/orchestrator

# Start worker (terminal 2)
./target/release/worker

# Dashboard (terminal 3)
cd dashboard && npm run dev

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
| `WORKER_SECRET_KEY` | (none) | Shared auth secret |

### Orchestrator
| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_MODE` | `local` | `local` (SQLite) or `supabase` |
| `BASE_URL` | `http://localhost:3000` | Public URL |
| `WORKER_SECRET_KEY` | (none) | Shared auth secret |

### Dashboard
| Variable | Description |
|----------|-------------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `VITE_API_URL` | Orchestrator API URL (prod only) |

### Supabase Edge Functions (Secrets)
| Variable | Description |
|----------|-------------|
| `STRIPE_SECRET_KEY` | Stripe API secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan |
| `STRIPE_TEAM_PRICE_ID` | Stripe Price ID for Team plan |

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

### Deploying Edge Functions
```bash
supabase functions deploy
supabase secrets set KEY=value
```

## Known Issues

- Dead code warnings in `orchestrator/src/auth.rs` (auth middleware not yet used)
- Dead code warnings in `orchestrator/src/config.rs` (Stripe config fields for future use)
- `base_image` field in VmPool unused (for future hot-reload of base image)

