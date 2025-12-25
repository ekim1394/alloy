#!/bin/bash
# VM Setup Script
# This script runs once when each VM is initialized in the pool

set -e

echo "Setting up VM environment..."

# Set locale to prevent encoding issues
export LANG=en_US.UTF-8
echo "export LANG=en_US.UTF-8" >> ~/.zshrc
echo "export LC_ALL=en_US.UTF-8" >> ~/.zshrc

# Add Homebrew to PATH
eval "$(/opt/homebrew/bin/brew shellenv)"
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zshrc

# Install fastlane via Homebrew (includes modern Ruby)
/opt/homebrew/bin/brew install fastlane

# Boot simulator to pre-warm it
echo "Pre-warming simulator..."
xcrun simctl boot "iPhone 16" || true
sleep 10
xcrun simctl shutdown "iPhone 16" || true

# List available simulators
echo "Available simulators:"
xcrun simctl list devices available

# Verify installation
/opt/homebrew/bin/fastlane --version

echo "VM setup complete!"

