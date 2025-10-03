#!/bin/bash
# Complete deployment script for both client and server
# This ensures URLs are properly configured

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

# Configuration
SERVER_URL="https://postmarkr-server.fly.dev"
CLIENT_URL="https://postmarkr-client.fly.dev"
SERVER_APP="postmarkr-server"
CLIENT_APP="postmarkr-client"

print_status $BLUE "🚀 Full Stack Deployment to Fly.io"
print_status $BLUE "===================================="
echo ""

# Check directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# Step 1: Ensure URLs are set as secrets
print_status $YELLOW "📋 Step 1: Verifying URL configuration..."
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

# Step 2: Build with environment variables
print_status $YELLOW "📋 Step 2: Building Wasp application..."
print_status $BLUE "   Building with WASP_SERVER_URL=${SERVER_URL}"
echo ""

# Export environment variables for the build
export WASP_WEB_CLIENT_URL="${CLIENT_URL}"
export WASP_SERVER_URL="${SERVER_URL}"

# Build the application
wasp build

# Navigate to build directory
cd .wasp/build

# Step 3: Deploy Server
print_status $YELLOW "📋 Step 3: Deploying Server..."
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
print_status $YELLOW "⏳ Waiting 20 seconds for server to initialize..."
sleep 20

# Step 4: Deploy Client
print_status $YELLOW "📋 Step 4: Deploying Client..."
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

# Step 5: Check deployment status
print_status $YELLOW "📋 Step 5: Checking deployment status..."
echo ""

print_status $BLUE "Server status:"
flyctl status --app ${SERVER_APP} 2>/dev/null || print_status $YELLOW "⏳ Server still deploying..."
echo ""

print_status $BLUE "Client status:"
flyctl status --app ${CLIENT_APP} 2>/dev/null || print_status $YELLOW "⏳ Client still deploying..."
echo ""

# Final summary
print_status $GREEN "🎉 Deployment Complete!"
print_status $BLUE "=======================" 
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

