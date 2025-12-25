#!/bin/bash
# Alloy CLI Installer
# Usage: curl -fsSL https://raw.githubusercontent.com/OWNER/jules-mac-runner/main/install.sh | bash

set -e

BINARY_NAME="alloy"
INSTALL_DIR="${INSTALL_DIR:-/usr/local/bin}"

echo "🚀 Installing Alloy CLI..."

# Check if Rust is installed
if ! command -v cargo &> /dev/null; then
    echo "📦 Rust not found, installing via rustup..."
    curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh -s -- -y
    source "$HOME/.cargo/env"
fi

# Clone and build
TEMP_DIR=$(mktemp -d)
cd "$TEMP_DIR"

echo "📥 Downloading source..."
git clone --depth 1 https://github.com/OWNER/jules-mac-runner.git .

echo "🔨 Building CLI..."
cargo build --release -p cli

echo "📦 Installing to $INSTALL_DIR..."
sudo cp target/release/alloy "$INSTALL_DIR/$BINARY_NAME"
sudo chmod +x "$INSTALL_DIR/$BINARY_NAME"

# Cleanup
cd - > /dev/null
rm -rf "$TEMP_DIR"

echo ""
echo "✅ Alloy CLI installed successfully!"
echo ""
echo "Configure it by running:"
echo "  alloy config set orchestrator_url http://your-orchestrator:3000"
echo ""
echo "Then run jobs with:"
echo "  alloy run -c 'xcodebuild build'"
