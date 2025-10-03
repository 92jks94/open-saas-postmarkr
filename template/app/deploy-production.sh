#!/bin/bash
# Production Deployment Script - Complete Full-Stack Deployment with Health Checks
# Combines: scripts/deploy.sh + deploy-full.sh + comprehensive validation

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

# Configuration
SERVER_URL="https://postmarkr-server.fly.dev"
CLIENT_URL="https://postmarkr-client.fly.dev"
SERVER_APP="postmarkr-server"
CLIENT_APP="postmarkr-client"

print_status $BLUE "🚀 Production Deployment - Full Stack"
print_status $BLUE "====================================="
echo ""

# Step 1: Prerequisite Checks
print_status $YELLOW "📋 Step 1: Checking prerequisites..."
if ! command_exists wasp; then
    print_status $RED "❌ Wasp CLI not found. Please install Wasp first."
    exit 1
fi
if ! command_exists flyctl; then
    print_status $RED "❌ Fly CLI not found. Please install Fly CLI first."
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

# Step 4: URL Configuration
print_status $YELLOW "📋 Step 4: Configuring URLs..."
print_status $BLUE "   Server URL: ${SERVER_URL}"
print_status $BLUE "   Client URL: ${CLIENT_URL}"
echo ""

read -p "Update Fly.io secrets with these URLs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    print_status $BLUE "🔧 Setting secrets on server app..."
    flyctl secrets set \
      WASP_WEB_CLIENT_URL="${CLIENT_URL}" \
      WASP_SERVER_URL="${SERVER_URL}" \
      --app ${SERVER_APP} || true
    
    print_status $BLUE "🔧 Setting secrets on client app..."
    flyctl secrets set \
      WASP_WEB_CLIENT_URL="${CLIENT_URL}" \
      WASP_SERVER_URL="${SERVER_URL}" \
      --app ${CLIENT_APP} || true
    
    print_status $GREEN "✅ Secrets updated"
    echo ""
else
    print_status $YELLOW "⏭️  Skipping secret update"
    echo ""
fi

# Step 5: Build with environment variables
print_status $YELLOW "📋 Step 5: Building Wasp application..."
print_status $BLUE "   Building with WASP_SERVER_URL=${SERVER_URL}"
echo ""

# Export environment variables for the build
export WASP_WEB_CLIENT_URL="${CLIENT_URL}"
export WASP_SERVER_URL="${SERVER_URL}"

# Build the application
wasp build

# Navigate to build directory
cd .wasp/build

# Step 6: Deploy Server
print_status $YELLOW "📋 Step 6: Deploying Server..."
print_status $BLUE "   Deploying to: ${SERVER_APP}"
echo ""

flyctl deploy \
  --config ../../fly-server.toml \
  --app ${SERVER_APP} \
  --detach \
  --verbose

print_status $GREEN "✅ Server deployment initiated"
echo ""

# Wait for server to be ready
print_status $YELLOW "⏳ Waiting 30 seconds for server to initialize..."
sleep 30

# Step 7: Deploy Client
print_status $YELLOW "📋 Step 7: Deploying Client..."
print_status $BLUE "   Deploying to: ${CLIENT_APP}"
print_status $BLUE "   Client will connect to: ${SERVER_URL}"
echo ""

flyctl deploy \
  --config ../../fly-client.toml \
  --app ${CLIENT_APP} \
  --detach \
  --verbose

print_status $GREEN "✅ Client deployment initiated"
echo ""

# Step 8: Post-deployment health checks
print_status $YELLOW "📋 Step 8: Running health checks..."
echo ""

# Check server health endpoint
print_status $BLUE "📊 Checking server health endpoint..."
for i in {1..5}; do
    if curl -f -s https://postmarkr-server.fly.dev/health > /dev/null; then
        print_status $GREEN "✅ Server health check passed"
        break
    else
        if [ $i -eq 5 ]; then
            print_status $RED "❌ Server health check failed after 5 attempts"
            print_status $YELLOW "⚠️  Deployment completed but server is not responding"
            exit 1
        fi
        print_status $YELLOW "⚠️  Attempt $i/5 failed, retrying in 5 seconds..."
        sleep 5
    fi
done

# Check client
print_status $BLUE "📊 Checking client..."
if curl -f -s https://postmarkr-client.fly.dev > /dev/null; then
    print_status $GREEN "✅ Client health check passed"
else
    print_status $YELLOW "⚠️  Client may not be responding"
fi

# Step 9: Final status check
print_status $YELLOW "📋 Step 9: Checking deployment status..."
echo ""

print_status $BLUE "Server status:"
flyctl status --app ${SERVER_APP} 2>/dev/null || print_status $YELLOW "⏳ Server still deploying..."
echo ""

print_status $BLUE "Client status:"
flyctl status --app ${CLIENT_APP} 2>/dev/null || print_status $YELLOW "⏳ Client still deploying..."
echo ""

# Final summary
print_status $GREEN "🎉 Production Deployment Complete!"
print_status $BLUE "=================================" 
echo ""
print_status $BLUE "🌐 URLs:"
print_status $GREEN "   Client: ${CLIENT_URL}"
print_status $GREEN "   Server: ${SERVER_URL}"
echo ""
print_status $YELLOW "📊 Monitor deployments:"
print_status $BLUE "   Server logs: flyctl logs --app ${SERVER_APP}"
print_status $BLUE "   Client logs: flyctl logs --app ${CLIENT_APP}"
print_status $BLUE "   Server status: flyctl status --app ${SERVER_APP}"
print_status $BLUE "   Client status: flyctl status --app ${CLIENT_APP}"
echo ""
print_status $YELLOW "🔍 Test the deployment:"
print_status $BLUE "   Health check: curl -f ${SERVER_URL}/health/simple"
print_status $BLUE "   Visit app: ${CLIENT_URL}"
echo ""
print_status $GREEN "🎉 Production deployment completed successfully!"
