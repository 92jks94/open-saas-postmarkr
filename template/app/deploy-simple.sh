#!/bin/bash
# Simple deployment script that works better with WSL2 networking

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

print_status $BLUE "🚀 Deploying to Fly.io..."

# Check we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found"
    exit 1
fi

# Build the app
print_status $BLUE "📦 Building Wasp app..."
wasp build

# Navigate to build directory
cd .wasp/build

# Set environment variables to avoid timeouts
export FLY_API_READ_TIMEOUT=300
export FLY_API_CONNECT_TIMEOUT=60

# Deploy server with longer timeout
print_status $BLUE "🚀 Deploying server (this may take a few minutes)..."
flyctl deploy \
  --config ../../fly-server.toml \
  --local-only \
  --verbose \
  --detach

print_status $GREEN "✅ Server deployment initiated"

# Give it a moment before checking
sleep 10

# Check status
print_status $BLUE "📊 Checking deployment status..."
flyctl status --app postmarkr-server

print_status $GREEN "🎉 Deployment completed!"
print_status $BLUE "🌐 Server: https://postmarkr-server.fly.dev"

