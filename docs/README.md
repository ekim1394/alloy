# Documentation

Welcome to Alloy - the self-hosted iOS/macOS build runner.

## Table of Contents

### 🚀 Getting Started

- [**Getting Started Guide**](./getting-started.md)
  *Quick start guide to get your first build running in 5 minutes.*
- [**Installation**](./installation.md)
  *Comprehensive build and installation instructions.*
- [**Example Configurations**](./examples.md)
  *Sample configurations and scripts for common use cases.*

### ☁️ Deployment

- [**Cloud Setup (Supabase)**](./setup-cloud.md)
  *Managed deployment using Supabase. Covers Authentication (GitHub), Database, Storage, and Billing (Stripe).*
- [**Self-Hosted Setup**](./setup-self-hosted.md)
  *Guide for self-hosting with SQLite (simplest) or PostgreSQL (production).*

### 🛠️ Components

- [**Worker Setup**](./setup-worker.md)
  *Setting up Mac Mini workers, configuring Tart, and managing the `WORKER_SECRET_KEY`.*
- [**CLI Usage**](./cli-usage.md)
  *Full reference for the `alloy` command-line tool - submission, artifacts, and configuration.*
- [**VM Base Image**](./vm-base-image.md)
  *Creating and customizing Tart VM images for iOS/macOS builds.*

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
