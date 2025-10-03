#!/bin/bash
# Development Deployment Script - Proper Wasp Deployment
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

print_status $BLUE "🚀 Development Deployment - Wasp Full-Stack"
print_status $BLUE "==========================================="
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
print_status $YELLOW "📋 Checking existing Fly.io apps..."
if flyctl apps list 2>/dev/null | grep -q "postmarkr"; then
    print_status $GREEN "✅ Found existing Postmarkr apps"
    
    # Check if we have the proper configuration files
    if [ -f "fly-server.toml" ] && [ -f "fly-client.toml" ]; then
        print_status $GREEN "✅ Found Wasp-generated Fly.io configuration files"
        print_status $BLUE "🚀 Deploying using existing configuration..."
        
        # Use Wasp's deploy command
        wasp deploy fly deploy
        
        print_status $GREEN "✅ Deployment completed!"
        echo ""
        print_status $BLUE "🌐 Your app should be available at:"
        print_status $YELLOW "   Check Fly.io dashboard for URLs"
        print_status $BLUE "   Or run: flyctl apps list"
        echo ""
        print_status $YELLOW "📊 Monitor deployment:"
        print_status $BLUE "   Server logs: flyctl logs --app postmarkr-server"
        print_status $BLUE "   Client logs: flyctl logs --app postmarkr-client"
        print_status $BLUE "   Status: flyctl status --app postmarkr-server"
        
    else
        print_status $YELLOW "⚠️  Apps exist but missing configuration files"
        print_status $YELLOW "💡 This suggests the apps were created manually"
        print_status $YELLOW "💡 Consider using: wasp deploy fly launch postmarkr ord"
        exit 1
    fi
else
    print_status $YELLOW "📋 No existing Postmarkr apps found"
    print_status $BLUE "🚀 Setting up new deployment..."
    echo ""
    print_status $YELLOW "This will create new Fly.io apps. Choose a region:"
    print_status $BLUE "   ord (Chicago) - Recommended for US"
    print_status $BLUE "   mia (Miami) - Good for US East"
    print_status $BLUE "   ams (Amsterdam) - Good for Europe"
    echo ""
    read -p "Enter region (default: ord): " REGION
    REGION=${REGION:-ord}
    
    print_status $BLUE "🚀 Launching Wasp app with region: $REGION"
    print_status $YELLOW "This may take several minutes..."
    
    wasp deploy fly launch postmarkr $REGION
    
    print_status $GREEN "✅ Initial deployment completed!"
    echo ""
    print_status $BLUE "🌐 Your app should now be available"
    print_status $YELLOW "📊 Check status with: flyctl status --app postmarkr-server"
fi

print_status $GREEN "🎉 Development deployment completed!"
print_status $BLUE "====================================="
echo ""
print_status $YELLOW "💡 For production deployment, use: ./deploy-production.sh"
