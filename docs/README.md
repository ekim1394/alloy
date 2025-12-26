# Documentation

Welcome to Alloy - the iOS build runner built for agentic workflows.

## Quick Start

```bash
# Install Alloy CLI
curl -fsSL https://raw.githubusercontent.com/your-org/alloy/main/install.sh | bash

# Set API Key (sign up at https://alloy-ci.dev)
alloy config set api_key YOUR_API_KEY

# Submit a job
alloy run "xcodebuild test -scheme MyApp"
```

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
