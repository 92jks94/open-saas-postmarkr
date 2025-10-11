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
SERVER_URL="https://postmarkr-server-server.fly.dev"
CLIENT_URL="https://postmarkr-server-client.fly.dev"
SERVER_APP="postmarkr-server-server"
CLIENT_APP="postmarkr-server-client"

print_status $BLUE "🚀 Full Stack Deployment to Fly.io"
print_status $BLUE "===================================="
echo ""

# Check directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# Step 1: Database validation
print_status $YELLOW "📋 Step 1: Validating database configuration..."
if [ -f "scripts/validate-database.sh" ]; then
    chmod +x scripts/validate-database.sh
    if ./scripts/validate-database.sh; then
        print_status $GREEN "✅ Database validation passed"
    else
        print_status $RED "❌ Database validation failed"
        print_status $YELLOW "   Please fix database issues before deploying"
        exit 1
    fi
else
    print_status $YELLOW "⚠️  Database validation script not found, skipping..."
fi
echo ""

# Step 2: Ensure URLs are set as secrets
print_status $YELLOW "📋 Step 2: Verifying URL configuration..."
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

# Step 3: Build with environment variables
print_status $YELLOW "📋 Step 3: Building Wasp application..."
print_status $BLUE "   Building with WASP_SERVER_URL=${SERVER_URL}"
echo ""

# Export environment variables for the build
export WASP_WEB_CLIENT_URL="${CLIENT_URL}"
export WASP_SERVER_URL="${SERVER_URL}"

# Build the application
wasp build

# Apply server binding patch for Fly.io compatibility (BEFORE cd into build dir)
print_status $BLUE "🔧 Applying server binding patch..."

# Patch the server to bind to 0.0.0.0 for Fly.io
SERVER_JS=".wasp/build/server.js"
if [ -f "$SERVER_JS" ]; then
    # Replace localhost binding with 0.0.0.0
    sed -i "s/hostname: 'localhost'/hostname: '0.0.0.0'/g" "$SERVER_JS"
    sed -i "s/host: 'localhost'/host: '0.0.0.0'/g" "$SERVER_JS"
    sed -i "s/host: \"localhost\"/host: \"0.0.0.0\"/g" "$SERVER_JS"
    print_status $GREEN "✅ Server binding patch applied"
else
    print_status $YELLOW "⚠️  server.js not found, patch may not be needed"
fi

# Navigate to build directory
cd .wasp/build

# Step 4: Deploy Server
print_status $YELLOW "📋 Step 4: Deploying Server..."
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

# Step 5: Deploy Client
print_status $YELLOW "📋 Step 5: Deploying Client..."
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

# Step 6: Check deployment status
print_status $YELLOW "📋 Step 6: Checking deployment status..."
echo ""

print_status $BLUE "Server status:"
flyctl status --app ${SERVER_APP} 2>/dev/null || print_status $YELLOW "⏳ Server still deploying..."
echo ""

print_status $BLUE "Client status:"
flyctl status --app ${CLIENT_APP} 2>/dev/null || print_status $YELLOW "⏳ Client still deploying..."
echo ""

# Step 7: Health check validation
print_status $YELLOW "📋 Step 7: Validating deployment health..."
echo ""

# Wait for services to be ready
print_status $BLUE "⏳ Waiting 30 seconds for services to stabilize..."
sleep 30

# Check server health
print_status $BLUE "🔍 Testing server health endpoint..."
if curl -f -s --max-time 10 "${SERVER_URL}/health/simple" > /dev/null 2>&1; then
    print_status $GREEN "✅ Server health check passed"
else
    print_status $RED "❌ Server health check failed"
    print_status $YELLOW "   Checking server logs..."
    flyctl logs --app ${SERVER_APP} --no-tail | tail -20
fi

# Check client accessibility
print_status $BLUE "🔍 Testing client accessibility..."
if curl -f -s --max-time 10 "${CLIENT_URL}" > /dev/null 2>&1; then
    print_status $GREEN "✅ Client accessibility check passed"
else
    print_status $RED "❌ Client accessibility check failed"
fi

# Check database connectivity through server
print_status $BLUE "🔍 Testing database connectivity..."
if curl -f -s --max-time 10 "${SERVER_URL}/health" | grep -q '"database".*"healthy"' 2>/dev/null; then
    print_status $GREEN "✅ Database connectivity check passed"
else
    print_status $RED "❌ Database connectivity check failed"
    print_status $YELLOW "   Checking database logs..."
    flyctl logs --app postmarkr-db --no-tail | tail -10
fi

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

