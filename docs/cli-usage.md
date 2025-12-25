# CLI Usage

The `alloy` CLI is used to submit jobs and manage builds.

## Configuration

```bash
# Set API endpoint
alloy config set-url http://localhost:3000

# Set API key (for programmatic access)
alloy config set-key jmr_your_api_key
```

Or use environment variables:
```bash
export ALLOY_API_URL=http://localhost:3000
export ALLOY_API_KEY=jmr_your_api_key
```

## Submitting Jobs

### From Git Repository

```bash
alloy run "xcodebuild test -scheme MyApp" \
  --repo https://github.com/you/your-app.git
```

### From Local Directory

```bash
cd /path/to/your/project
alloy run "xcodebuild test -scheme MyApp"
```

This automatically:
1. Zips your project (respecting `.gitignore`)
2. Uploads to the server
3. Runs the command in a fresh VM
4. Streams logs in real-time

## Watching Logs

Logs stream automatically. Press `Ctrl+C` to detach (job continues).

## Checking Status

```bash
alloy status <job-id>
```

Output:
```
Job: abc123-def456
  Status: completed
  Command: xcodebuild test -scheme MyApp
  Source: upload
  Exit code: 0
  Build time: 4.23 minutes
```

## Downloading Artifacts

```bash
# List artifacts
alloy artifacts <job-id>

# Download to current directory
alloy artifacts <job-id> --download

# Download to specific path
alloy artifacts <job-id> --download --output ./build-results/
```

## Common Commands

| Command | Description |
| --- | --- |
| `alloy run <cmd>` | Submit a job |
| `alloy status <id>` | Check job status |
| `alloy artifacts <id>` | List/download artifacts |
| `alloy config show` | Show current config |

## Examples

### iOS Build
```bash
alloy run "xcodebuild -scheme MyApp -sdk iphonesimulator build"
```

### Run Tests
```bash
alloy run "xcodebuild test -scheme MyApp -destination 'platform=iOS Simulator,name=iPhone 15'"
```

### Archive for Distribution
```bash
alloy run "xcodebuild archive -scheme MyApp -archivePath build/MyApp.xcarchive"
```

### Custom Script
```bash
alloy run "chmod +x ./scripts/ci.sh && ./scripts/ci.sh"
```
