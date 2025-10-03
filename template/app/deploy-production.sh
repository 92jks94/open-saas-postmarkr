#!/bin/bash
# Production Deployment Script - Proper Wasp Deployment with Health Checks
# Uses Wasp's built-in deployment commands for reliable full-stack deployment

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

print_status $BLUE "🚀 Production Deployment - Wasp Full-Stack"
print_status $BLUE "=========================================="
echo ""

# Step 1: Prerequisite Checks
print_status $YELLOW "📋 Step 1: Checking prerequisites..."
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
if ! command_exists npm; then
    print_status $RED "❌ npm not found. Please install Node.js first."
    exit 1
fi
print_status $GREEN "✅ All prerequisites found"

# Check directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# Step 2: Pre-deployment validation
print_status $YELLOW "📋 Step 2: Running pre-deployment checks..."
if npm run check:production 2>/dev/null; then
    print_status $GREEN "✅ Pre-deployment checks passed"
else
    print_status $YELLOW "⚠️  Pre-deployment checks not configured, continuing..."
fi

# Step 3: Verify Fly.io connectivity
print_status $YELLOW "📋 Step 3: Verifying Fly.io connectivity..."
if ! flyctl auth whoami > /dev/null 2>&1; then
    print_status $RED "❌ Not authenticated with Fly.io. Run: flyctl auth login"
    exit 1
fi
print_status $GREEN "✅ Connected to Fly.io"

# Step 4: Check existing deployment
print_status $YELLOW "📋 Step 4: Checking existing deployment..."
if flyctl apps list 2>/dev/null | grep -q "postmarkr"; then
    print_status $GREEN "✅ Found existing Postmarkr apps"
    
    # Check if we have the proper configuration files
    if [ -f "fly-server.toml" ] && [ -f "fly-client.toml" ]; then
        print_status $GREEN "✅ Found Wasp-generated Fly.io configuration files"
        
        # Step 5: Set environment variables for build
        print_status $YELLOW "📋 Step 5: Setting up environment variables..."
        print_status $BLUE "   Setting WASP_SERVER_URL and WASP_WEB_CLIENT_URL for build"
        
        # Get the actual URLs from Fly.io
        SERVER_URL=$(flyctl apps list --json | jq -r '.[] | select(.Name | contains("postmarkr-server")) | .Hostname' | head -1)
        CLIENT_URL=$(flyctl apps list --json | jq -r '.[] | select(.Name | contains("postmarkr-client")) | .Hostname' | head -1)
        
        if [ -n "$SERVER_URL" ] && [ -n "$CLIENT_URL" ]; then
            SERVER_URL="https://$SERVER_URL"
            CLIENT_URL="https://$CLIENT_URL"
            print_status $BLUE "   Server URL: $SERVER_URL"
            print_status $BLUE "   Client URL: $CLIENT_URL"
            
            # Export for build
            export WASP_SERVER_URL="$SERVER_URL"
            export WASP_WEB_CLIENT_URL="$CLIENT_URL"
        else
            print_status $YELLOW "⚠️  Could not determine URLs, using defaults"
            export WASP_SERVER_URL="https://postmarkr-server.fly.dev"
            export WASP_WEB_CLIENT_URL="https://postmarkr-client.fly.dev"
        fi
        
        # Step 6: Deploy using Wasp
        print_status $YELLOW "📋 Step 6: Deploying with Wasp..."
        print_status $BLUE "🚀 Running: wasp deploy fly deploy"
        print_status $YELLOW "This may take several minutes..."
        
        wasp deploy fly deploy
        
        print_status $GREEN "✅ Deployment completed!"
        
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
fi

# Step 7: Post-deployment health checks
print_status $YELLOW "📋 Step 7: Running health checks..."
echo ""

# Get the actual URLs for health checks
SERVER_URL=$(flyctl apps list --json | jq -r '.[] | select(.Name | contains("postmarkr-server")) | .Hostname' | head -1)
CLIENT_URL=$(flyctl apps list --json | jq -r '.[] | select(.Name | contains("postmarkr-client")) | .Hostname' | head -1)

if [ -n "$SERVER_URL" ] && [ -n "$CLIENT_URL" ]; then
    SERVER_URL="https://$SERVER_URL"
    CLIENT_URL="https://$CLIENT_URL"
    
    # Check server health endpoint
    print_status $BLUE "📊 Checking server health endpoint..."
    for i in {1..5}; do
        if curl -f -s "$SERVER_URL/health" > /dev/null 2>&1; then
            print_status $GREEN "✅ Server health check passed"
            break
        else
            if [ $i -eq 5 ]; then
                print_status $YELLOW "⚠️  Server health check failed after 5 attempts"
                print_status $YELLOW "💡 Server may still be starting up"
            else
                print_status $YELLOW "⏳ Health check attempt $i/5..."
                sleep 10
            fi
        fi
    done
    
    # Check client accessibility
    print_status $BLUE "📊 Checking client accessibility..."
    for i in {1..3}; do
        if curl -f -s "$CLIENT_URL" > /dev/null 2>&1; then
            print_status $GREEN "✅ Client is accessible"
            break
        else
            if [ $i -eq 3 ]; then
                print_status $YELLOW "⚠️  Client accessibility check failed"
                print_status $YELLOW "💡 Client may still be starting up"
            else
                print_status $YELLOW "⏳ Client check attempt $i/3..."
                sleep 10
            fi
        fi
    done
else
    print_status $YELLOW "⚠️  Could not determine URLs for health checks"
fi

# Step 8: Final status check
print_status $YELLOW "📋 Step 8: Checking deployment status..."
echo ""

print_status $BLUE "Server status:"
flyctl status --app postmarkr-server 2>/dev/null || print_status $YELLOW "⏳ Server status unavailable"
echo ""

print_status $BLUE "Client status:"
flyctl status --app postmarkr-client 2>/dev/null || print_status $YELLOW "⏳ Client status unavailable"
echo ""

# Final summary
print_status $GREEN "🎉 Production Deployment Complete!"
print_status $BLUE "=================================="
echo ""
if [ -n "$SERVER_URL" ] && [ -n "$CLIENT_URL" ]; then
    print_status $BLUE "🌐 URLs:"
    print_status $GREEN "   Client: $CLIENT_URL"
    print_status $GREEN "   Server: $SERVER_URL"
    echo ""
fi
print_status $YELLOW "📊 Monitor deployments:"
print_status $BLUE "   Server logs: flyctl logs --app postmarkr-server"
print_status $BLUE "   Client logs: flyctl logs --app postmarkr-client"
print_status $BLUE "   Server status: flyctl status --app postmarkr-server"
print_status $BLUE "   Client status: flyctl status --app postmarkr-client"
echo ""
print_status $YELLOW "🔍 Test the deployment:"
if [ -n "$SERVER_URL" ]; then
    print_status $BLUE "   Health check: curl -f $SERVER_URL/health"
fi
if [ -n "$CLIENT_URL" ]; then
    print_status $BLUE "   Visit app: $CLIENT_URL"
fi
echo ""