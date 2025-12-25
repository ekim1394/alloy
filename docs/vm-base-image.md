# Creating a Custom Tart VM Base Image

This guide shows how to create a Tart VM image with iOS Simulators pre-configured for testing.

## Quick Start

```bash
# 1. Pull the base Xcode image
tart clone ghcr.io/cirruslabs/macos-sonoma-xcode:latest alloy-base

# 2. Start the VM
tart run alloy-base

# 3. In the VM, open Terminal and run:
# Create a simulator
xcrun simctl create "iPhone 16" "com.apple.CoreSimulator.SimDeviceType.iPhone-16" "com.apple.CoreSimulator.SimRuntime.iOS-18-1"

# Boot it once to pre-warm
xcrun simctl boot "iPhone 16"
xcrun simctl shutdown "iPhone 16"

# 4. Shutdown the VM from inside
sudo shutdown -h now

# 5. Save as your base image
tart clone alloy-base ghcr.io/your-org/alloy-xcode-sim:latest
```

## Set as Worker Base Image

```bash
# In .env
TART_BASE_IMAGE=alloy-base

# Or for the worker
export TART_BASE_IMAGE=alloy-base
./target/release/worker
```

## Verify Simulators

```bash
# SSH into a running VM
tart run alloy-base &
sleep 30
tart ip alloy-base
sshpass -p admin ssh admin@<IP> "xcrun simctl list devices"
```

## Available Cirrus Images

- `ghcr.io/cirruslabs/macos-sonoma-xcode:latest` - Xcode 16.1
- `ghcr.io/cirruslabs/macos-ventura-xcode:latest` - Xcode 15

See more at: https://github.com/cirruslabs/macos-image-templates
