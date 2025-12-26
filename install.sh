#!/bin/bash
# Alloy CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/ekim1394/alloy/main/install.sh | bash

set -e

REPO="ekim1394/alloy"
BINARY_NAME="alloy"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

echo "🚀 Installing Alloy CLI..."

# Detect architecture
ARCH=$(uname -m)
case "$ARCH" in
    arm64|aarch64)
        ARTIFACT="alloy-darwin-arm64"
        ;;
    x86_64)
        ARTIFACT="alloy-darwin-x86_64"
        ;;
    *)
        echo "❌ Unsupported architecture: $ARCH"
        exit 1
        ;;
esac

# Get latest release version
echo "📡 Fetching latest release..."
LATEST_VERSION=$(curl -s "https://api.github.com/repos/$REPO/releases/latest" | grep '"tag_name"' | sed -E 's/.*"([^"]+)".*/\1/')

if [ -z "$LATEST_VERSION" ]; then
    echo "❌ Failed to fetch latest version. Check your internet connection or try again later."
    echo ""
    echo "If no releases exist yet, you can build from source:"
    echo "  cargo install --git https://github.com/$REPO --bin alloy"
    exit 1
fi

echo "📦 Downloading $BINARY_NAME $LATEST_VERSION ($ARTIFACT)..."

# Download and extract
DOWNLOAD_URL="https://github.com/$REPO/releases/download/$LATEST_VERSION/$ARTIFACT.tar.gz"
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

curl -sL "$DOWNLOAD_URL" -o "$ARTIFACT.tar.gz"
tar -xzf "$ARTIFACT.tar.gz"

# Install
echo "📦 Installing to $INSTALL_DIR..."
sudo mv "$ARTIFACT" "$INSTALL_DIR/$BINARY_NAME"
sudo chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Alloy CLI $LATEST_VERSION installed successfully!"
echo ""
echo "Configure it by running:"
echo "  alloy config set orchestrator_url http://your-orchestrator:3000"
echo ""
echo "Then run jobs with:"
echo "  alloy run -c 'xcodebuild build'"
