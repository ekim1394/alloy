# Worker Setup

This guide covers setting up Mac Mini workers to execute build jobs.

## Requirements

- **macOS** 12+ on Apple Silicon (M1/M2/M3)
- **Tart** for VM management
- Network access to the orchestrator

## 1. Install Tart

```bash
brew install cirruslabs/cli/tart
```

## 2. Pull Base Image

```bash
# macOS Sonoma with Xcode
tart pull ghcr.io/cirruslabs/macos-sonoma-xcode:latest

# Or create your own
tart create --from-ipsw=latest my-base-image
```

## 3. Configure Worker
 
 ```bash
 export ORCHESTRATOR_URL=http://your-orchestrator:3000
 export WORKER_HOSTNAME=$(hostname)
 export WORKER_CAPACITY=2  # Concurrent jobs
 export TART_BASE_IMAGE=ghcr.io/cirruslabs/macos-sonoma-xcode:latest
 export WORKER_SECRET_KEY=your-shared-secret
 ```
 
 ## 4. Start Worker
 
 ```bash
 ./target/release/worker
 ```
 
 You should see:
 ```
 INFO worker: Registered with orchestrator, id=abc123
 INFO worker: Polling for jobs...
 ```
 
 ## Running as a Service
 
 ### launchd (macOS)
 
 Create `/Library/LaunchDaemons/com.jules.worker.plist`:
 
 ```xml
 <?xml version="1.0" encoding="UTF-8"?>
 <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
 <plist version="1.0">
 <dict>
     <key>Label</key>
     <string>com.jules.worker</string>
     <key>ProgramArguments</key>
     <array>
         <string>/usr/local/bin/jules-worker</string>
     </array>
     <key>EnvironmentVariables</key>
     <dict>
         <key>ORCHESTRATOR_URL</key>
         <string>http://orchestrator:3000</string>
         <key>TART_BASE_IMAGE</key>
         <string>ghcr.io/cirruslabs/macos-sonoma-xcode:latest</string>
         <key>WORKER_SECRET_KEY</key>
         <string>your-shared-secret</string>
     </dict>
     <key>RunAtLoad</key>
     <true/>
     <key>KeepAlive</key>
     <true/>
 </dict>
 </plist>
 ```

```bash
sudo launchctl load /Library/LaunchDaemons/com.jules.worker.plist
```

## Custom Base Image

For faster builds, create a pre-configured image:

```bash
# Clone and customize
tart clone ghcr.io/cirruslabs/macos-sonoma-xcode:latest my-custom-image
tart run my-custom-image

# Inside VM: install dependencies, configure tools, etc.

# Save as new base
tart stop my-custom-image
```

## Monitoring

Workers send heartbeats every 30 seconds. Check status:

```bash
curl http://orchestrator:3000/api/v1/workers
```

## Troubleshooting

### Worker not connecting
```bash
# Check network
curl -v $ORCHESTRATOR_URL/health
```

### VM not starting
```bash
# Verify Tart works
tart list
tart run --no-graphics your-image
```

### Job timeout
```bash
# Increase timeout
export JOB_TIMEOUT_SECONDS=3600
```
