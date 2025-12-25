# Jules Mac Runner

A commercial-grade macOS CI/CD platform for iOS developers and AI agents.

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    CLI Tool     │────▶│   Orchestrator   │────▶│  Worker Farm    │
│  (alloy run)    │     │   (Rust/Axum)    │     │  (Mac Minis)    │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │    Database      │     │    Tart VMs     │
                        │ (SQLite/PG/Supa) │     │  (macOS Sonoma) │
                        └──────────────────┘     └─────────────────┘
```

## Quick Start

```bash
# Build
cargo build --release

# Start orchestrator (SQLite - zero config)
./target/release/orchestrator

# On Mac Mini, start worker
./target/release/worker

# Submit a job
./target/release/alloy run "xcodebuild test -scheme MyApp"
```

## Documentation

| Guide | Description |
| --- | --- |
| [Installation](./docs/installation.md) | Build and install |
| [Cloud Setup](./docs/setup-cloud.md) | Supabase configuration |
| [Self-Hosted](./docs/setup-self-hosted.md) | SQLite/PostgreSQL |
| [Worker Setup](./docs/setup-worker.md) | Mac Mini configuration |
| [CLI Usage](./docs/cli-usage.md) | Command reference |

## CLI Examples

```bash
alloy run "xcodebuild test -scheme MyApp"    # Local directory
alloy run "fastlane test" --repo github.com/...  # From Git
alloy status <job-id>                        # Check status
alloy artifacts <job-id> --download          # Get artifacts
```

## Project Structure

```
jules-mac-runner/
├── orchestrator/   # API server
├── worker/         # Mac Mini agent
├── cli/            # alloy CLI
├── shared/         # Common types
├── docs/           # Documentation
└── supabase/       # Database schema
```

## License

MIT
