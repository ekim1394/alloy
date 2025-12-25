# Alloy

**Self-hosted iOS/macOS CI runner with instant VM isolation.**

Alloy is a high-performance, self-hosted build runner designed for iOS and macOS developers. It runs Xcode builds, tests, and Fastlane scripts inside isolated [Tart VMs](https://tart.run/) on Apple Silicon Macs—giving you cloud-like CI/CD infrastructure with full control over your hardware.

---

## ✨ Key Features

- **🚀 Fast VM Startup** — Pre-warmed VM pool delivers ~1s job start times (vs ~30s cold boot)
- **🔒 Complete Isolation** — Every job runs in a fresh, ephemeral macOS VM
- **📡 Real-time Logs** — Stream build output live to CLI or dashboard
- **📦 Artifact Collection** — Automatically capture .ipa, .xcresult, and other build outputs
- **🔄 Retry & Timeout** — Built-in job retry logic and configurable timeouts
- **☁️ Flexible Storage** — SQLite for local setups, Supabase/PostgreSQL for teams
- **🤖 AI-Ready** — First-class support for AI coding agents to submit and monitor builds

---

## Why Alloy?

| Challenge | How Alloy Solves It |
|-----------|---------------------|
| **GitHub Actions macOS runners are slow & expensive** | Run on your own Mac Minis with no per-minute costs |
| **Need isolation but VMs take forever to boot** | Pre-warmed VM pool for instant job starts |
| **Want CI but don't trust third-party with code** | Fully self-hosted, your code never leaves your network |
| **AI agents need to run iOS builds** | Simple REST API designed for programmatic access |

---

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
