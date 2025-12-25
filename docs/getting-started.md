# Getting Started with Alloy

Get an iOS/macOS build running in under 5 minutes.

## Prerequisites

- **macOS** with Apple Silicon (for VM workers)
- **Rust** 1.70+ ([rustup.rs](https://rustup.rs))

## Quick Start

```bash
# 1. Clone and build
git clone https://github.com/your-org/jules-mac-runner.git
cd jules-mac-runner
cargo build --release

# 2. Install CLI
cargo install --path cli

# 3. Pull a Tart VM image
brew install cirruslabs/cli/tart
tart clone ghcr.io/cirruslabs/macos-sonoma-xcode:latest

# 4. Start orchestrator (new terminal)
./target/release/orchestrator

# 5. Start worker (new terminal)
TART_BASE_IMAGE=ghcr.io/cirruslabs/macos-sonoma-xcode:latest \
./target/release/worker

# 6. Run your first job!
cd /path/to/your/ios-project
alloy run -c "xcodebuild build -scheme MyApp -destination 'generic/platform=iOS Simulator' CODE_SIGN_IDENTITY='' CODE_SIGNING_REQUIRED=NO"
```

## Example Commands

```bash
# Build an iOS app
alloy run -c "xcodebuild build -scheme MyApp -destination 'generic/platform=iOS Simulator'"

# Run tests (requires simulators in VM)
alloy run -c "xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 16'"

# Run a custom script
alloy run --script build.sh

# Check job status
alloy status <job-id>

# List recent jobs
alloy jobs

# Retry a failed job
alloy retry <job-id>
```

## Configuration

The CLI uses `~/.alloy/config.toml`:

```toml
# Default orchestrator URL
orchestrator_url = "http://localhost:3000"

# Optional: API key for authentication
# api_key = "your-api-key"
```

Or set via environment:
```bash
export ALLOY_ORCHESTRATOR_URL="http://localhost:3000"
```

## Worker Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `ORCHESTRATOR_URL` | Required | API endpoint |
| `TART_BASE_IMAGE` | `ghcr.io/cirruslabs/macos-sonoma-xcode:latest` | VM image |
| `VM_POOL_SIZE` | `2` | Pre-warmed VMs |
| `JOB_TIMEOUT_MINUTES` | `60` | Max job duration |

## VM Images

You can use pre-built Cirrus Labs images or create custom ones:
- `ghcr.io/cirruslabs/macos-sonoma-xcode:latest` - Xcode 16.1
- `ghcr.io/cirruslabs/macos-ventura-xcode:latest` - Xcode 15

See [VM Base Image](./vm-base-image.md) for customization.

## Next Steps

- [CLI Usage](./cli-usage.md) - Full command reference
- [Worker Setup](./setup-worker.md) - Production worker configuration
- [VM Base Image](./vm-base-image.md) - Custom VM images
