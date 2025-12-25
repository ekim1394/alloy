# Example Configurations

## Worker .env

Create a `.env` file for the worker:

```bash
# Required
ORCHESTRATOR_URL=http://localhost:3000

# Optional - Override base VM image
TART_BASE_IMAGE=alloy-worker

# Optional - Number of pre-warmed VMs (default: 2)
VM_POOL_SIZE=2

# Optional - Job timeout in minutes (default: 60)
JOB_TIMEOUT_MINUTES=120

# Optional - Override hostname
WORKER_HOSTNAME=mac-mini-1

# Optional - Max concurrent jobs (default: 2)
WORKER_CAPACITY=2
```

## Orchestrator .env

```bash
# Storage mode: 'supabase' or 'local'
DATABASE_MODE=local

# For Supabase mode:
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_ANON_KEY=your-anon-key
# SUPABASE_SERVICE_KEY=your-service-key

# Server settings
BASE_URL=http://localhost:3000
```

## CLI Configuration

Location: `~/.alloy/config.toml`

```toml
# Orchestrator URL
orchestrator_url = "http://localhost:3000"

# Optional: API key
# api_key = "your-api-key"
```

## Example Build Scripts

### iOS Build (Simulator)

```bash
#!/bin/bash
# build-ios.sh
set -e

xcodebuild build \
  -workspace MyApp.xcworkspace \
  -scheme MyApp \
  -destination 'generic/platform=iOS Simulator' \
  CODE_SIGN_IDENTITY='' \
  CODE_SIGNING_REQUIRED=NO
```

### iOS Tests

```bash
#!/bin/bash
# test-ios.sh
set -e

xcodebuild test \
  -workspace MyApp.xcworkspace \
  -scheme MyApp \
  -destination 'platform=iOS Simulator,name=iPhone 16' \
  -resultBundlePath ./TestResults.xcresult
```

### Fastlane

```bash
#!/bin/bash
# fastlane-build.sh
set -e

bundle install
bundle exec fastlane build
```

## GitHub Actions Integration

```yaml
# .github/workflows/build.yml
name: iOS Build

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest  # Just to trigger, actual build on Mac
    steps:
      - uses: actions/checkout@v4
      
      - name: Submit to Alloy
        env:
          ALLOY_ORCHESTRATOR_URL: ${{ secrets.ALLOY_URL }}
        run: |
          curl -fsSL https://raw.githubusercontent.com/your-org/alloy/main/install.sh | bash
          alloy run -c "xcodebuild build -scheme MyApp"
```
