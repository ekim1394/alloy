# Documentation

Welcome to Alloy - the self-hosted iOS/macOS build runner.

## Getting Started

- [**Getting Started Guide**](./getting-started.md) - Quick start in 5 minutes
- [Installation](./installation.md) - Build and install
- [Example Configurations](./examples.md) - Sample configs and scripts

## Setup Guides

- [Cloud Setup](./setup-cloud.md) - Using Supabase (managed)
- [Self-Hosted Setup](./setup-self-hosted.md) - SQLite or PostgreSQL

## Components

- [Worker Setup](./setup-worker.md) - Configure Mac Mini workers
- [CLI Usage](./cli-usage.md) - Submit and manage jobs
- [VM Base Image](./vm-base-image.md) - Custom Tart VM images

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   CLI       │────▶│ Orchestrator │◀────│   Worker    │
│  (alloy)    │     │   (API)      │     │ (Mac Mini)  │
└─────────────┘     └──────────────┘     └─────────────┘
                           │                    │
                           ▼                    ▼
                    ┌──────────────┐     ┌─────────────┐
                    │   Database   │     │  Tart VM    │
                    │ (SQLite/PG)  │     │  (macOS)    │
                    └──────────────┘     └─────────────┘
```

## Quick Start

```bash
# Build
cargo build --release

# Run orchestrator (SQLite - zero config)
./target/release/orchestrator

# Run worker on Mac Mini
./target/release/worker

# Submit a job
alloy run "xcodebuild test"
```
