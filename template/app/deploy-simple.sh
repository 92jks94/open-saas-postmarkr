#!/bin/bash
# Simple Wasp Deployment Script
# Uses Wasp's built-in deployment commands for reliable deployment

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${1}${2}${NC}"
}

command_exists() {
    command -v "$1" >/dev/null 2>&1
}

print_status $BLUE "🚀 Simple Wasp Deployment"
print_status $BLUE "========================="
echo ""

# Check directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# Check prerequisites
print_status $YELLOW "📋 Checking prerequisites..."
if ! command_exists wasp; then
    print_status $RED "❌ Wasp CLI not found. Please install Wasp first."
    print_status $YELLOW "💡 Install: curl -sSL https://get.wasp-lang.dev/installer.sh | sh"
    exit 1
fi

if ! command_exists flyctl; then
    print_status $RED "❌ Fly CLI not found. Please install Fly CLI first."
    print_status $YELLOW "💡 Install: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

print_status $GREEN "✅ All prerequisites found"

# Check if apps are already configured
print_status $YELLOW "📋 Checking existing deployment..."
if flyctl apps list 2>/dev/null | grep -q "postmarkr"; then
    print_status $GREEN "✅ Found existing Postmarkr apps"
    
    if [ -f "fly-server.toml" ] && [ -f "fly-client.toml" ]; then
        print_status $GREEN "✅ Found Wasp-generated configuration files"
        print_status $BLUE "🚀 Deploying using existing configuration..."
        
        wasp deploy fly deploy
        
        print_status $GREEN "✅ Deployment completed!"
    else
        print_status $YELLOW "⚠️  Apps exist but missing configuration files"
        print_status $YELLOW "💡 Consider using: wasp deploy fly launch postmarkr ord"
        exit 1
    fi
else
    print_status $YELLOW "📋 No existing Postmarkr apps found"
    print_status $BLUE "🚀 Setting up new deployment..."
    
    # Use ord (Chicago) as default region
    REGION="ord"
    print_status $BLUE "🚀 Launching Wasp app with region: $REGION"
    print_status $YELLOW "This may take several minutes..."
    
    wasp deploy fly launch postmarkr $REGION
    
    print_status $GREEN "✅ Initial deployment completed!"
fi

print_status $GREEN "🎉 Deployment completed!"
print_status $BLUE "======================="
echo ""
print_status $YELLOW "📊 Monitor deployment:"
print_status $BLUE "   Server logs: flyctl logs --app postmarkr-server"
print_status $BLUE "   Client logs: flyctl logs --app postmarkr-client"
print_status $BLUE "   Status: flyctl status --app postmarkr-server"
echo ""