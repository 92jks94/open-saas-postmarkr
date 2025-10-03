#!/bin/bash
# Setup & Troubleshooting Script - Pre-deployment checks and diagnostics
# Combines: deploy.sh + authentication checks + comprehensive diagnostics

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

print_status $BLUE "🔍 Deployment Setup & Troubleshooting"
print_status $BLUE "====================================="
echo ""

# Step 1: Check project structure
print_status $YELLOW "📋 Step 1: Checking project structure..."
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Are you in the project root?"
    print_status $YELLOW "💡 Expected location: /path/to/project/main.wasp"
    exit 1
fi
print_status $GREEN "✅ Project structure looks good"

if [ ! -f "fly-server.toml" ]; then
    print_status $RED "❌ fly-server.toml not found"
    print_status $YELLOW "💡 Run: wasp deploy fly setup"
    exit 1
fi
print_status $GREEN "✅ Fly.io configuration found"

# Step 2: Check prerequisites
print_status $YELLOW "📋 Step 2: Checking prerequisites..."

# Check Wasp CLI
if command_exists wasp; then
    WASP_VERSION=$(wasp version 2>/dev/null | head -n1 || echo "unknown")
    print_status $GREEN "✅ Wasp CLI found: $WASP_VERSION"
else
    print_status $RED "❌ Wasp CLI not found"
    print_status $YELLOW "💡 Install: curl -sSL https://get.wasp-lang.dev/installer.sh | sh"
    exit 1
fi

# Check Fly CLI
if command_exists flyctl; then
    FLY_VERSION=$(flyctl version --json 2>/dev/null | grep -o '"version":"[^"]*"' | cut -d'"' -f4 || echo "unknown")
    print_status $GREEN "✅ Fly CLI found: $FLY_VERSION"
else
    print_status $RED "❌ Fly CLI not found"
    print_status $YELLOW "💡 Install: https://fly.io/docs/hands-on/install-flyctl/"
    exit 1
fi

# Check Node.js/npm
if command_exists npm; then
    NODE_VERSION=$(node --version 2>/dev/null || echo "unknown")
    NPM_VERSION=$(npm --version 2>/dev/null || echo "unknown")
    print_status $GREEN "✅ Node.js found: $NODE_VERSION"
    print_status $GREEN "✅ npm found: $NPM_VERSION"
else
    print_status $RED "❌ npm not found"
    print_status $YELLOW "💡 Install Node.js: https://nodejs.org/"
    exit 1
fi

# Step 3: Check authentication
print_status $YELLOW "📋 Step 3: Checking Fly.io authentication..."
if flyctl auth whoami > /dev/null 2>&1; then
    USER=$(flyctl auth whoami 2>/dev/null || echo "unknown")
    print_status $GREEN "✅ Authenticated with Fly.io as: $USER"
else
    print_status $RED "❌ Not authenticated with Fly.io"
    print_status $YELLOW "💡 Run: flyctl auth login"
    exit 1
fi

# Step 4: Check app configuration
print_status $YELLOW "📋 Step 4: Checking app configuration..."
SERVER_APP="postmarkr-server"
CLIENT_APP="postmarkr-client"

# Check if apps exist
if flyctl apps list 2>/dev/null | grep -q "$SERVER_APP"; then
    print_status $GREEN "✅ Server app '$SERVER_APP' exists"
else
    print_status $YELLOW "⚠️  Server app '$SERVER_APP' not found"
    print_status $YELLOW "💡 Run: wasp deploy fly setup"
fi

if flyctl apps list 2>/dev/null | grep -q "$CLIENT_APP"; then
    print_status $GREEN "✅ Client app '$CLIENT_APP' exists"
else
    print_status $YELLOW "⚠️  Client app '$CLIENT_APP' not found"
    print_status $YELLOW "💡 Run: wasp deploy fly setup"
fi

# Step 5: Check network connectivity
print_status $YELLOW "📋 Step 5: Testing network connectivity..."

# Test Fly.io API
if curl -f -s --max-time 10 "https://api.machines.dev/v1/apps" > /dev/null; then
    print_status $GREEN "✅ Fly.io API accessible"
else
    print_status $YELLOW "⚠️  Fly.io API not accessible"
    print_status $YELLOW "💡 Check your internet connection"
fi

# Test GitHub (for potential CI/CD)
if curl -f -s --max-time 10 "https://api.github.com" > /dev/null; then
    print_status $GREEN "✅ GitHub API accessible"
else
    print_status $YELLOW "⚠️  GitHub API not accessible"
fi

# Step 6: Check WSL2 specific issues (if applicable)
if [ -f "/proc/version" ] && grep -qi "microsoft" /proc/version; then
    print_status $YELLOW "📋 Step 6: WSL2 environment detected..."
    
    # Check if we're in WSL2
    if grep -qi "wsl2" /proc/version; then
        print_status $BLUE "🔍 WSL2 detected - checking network configuration..."
        
        # Check TCP keepalive settings
        KEEPALIVE_TIME=$(sysctl net.ipv4.tcp_keepalive_time 2>/dev/null | cut -d' ' -f3 || echo "unknown")
        print_status $BLUE "   TCP keepalive time: $KEEPALIVE_TIME"
        
        if [ "$KEEPALIVE_TIME" != "unknown" ] && [ "$KEEPALIVE_TIME" -lt 60 ]; then
            print_status $YELLOW "⚠️  TCP keepalive time is low ($KEEPALIVE_TIME)"
            print_status $YELLOW "💡 Consider running: sudo sysctl -w net.ipv4.tcp_keepalive_time=60"
        else
            print_status $GREEN "✅ TCP keepalive settings look good"
        fi
    fi
fi

# Step 7: Check environment variables
print_status $YELLOW "📋 Step 7: Checking environment variables..."
if [ -n "$WASP_SERVER_URL" ]; then
    print_status $GREEN "✅ WASP_SERVER_URL is set: $WASP_SERVER_URL"
else
    print_status $YELLOW "⚠️  WASP_SERVER_URL not set"
fi

if [ -n "$WASP_WEB_CLIENT_URL" ]; then
    print_status $GREEN "✅ WASP_WEB_CLIENT_URL is set: $WASP_WEB_CLIENT_URL"
else
    print_status $YELLOW "⚠️  WASP_WEB_CLIENT_URL not set"
fi

# Step 8: Check package.json scripts
print_status $YELLOW "📋 Step 8: Checking package.json scripts..."
if [ -f "package.json" ]; then
    if grep -q '"check:production"' package.json; then
        print_status $GREEN "✅ Production check script found"
    else
        print_status $YELLOW "⚠️  No production check script found"
        print_status $YELLOW "💡 Consider adding: \"check:production\": \"echo 'Add your checks here'\""
    fi
else
    print_status $YELLOW "⚠️  package.json not found"
fi

# Final summary
echo ""
print_status $GREEN "🎉 Setup Check Complete!"
print_status $BLUE "======================"
echo ""
print_status $BLUE "📋 Next Steps:"
print_status $GREEN "   Development: ./deploy-dev.sh"
print_status $GREEN "   Production:  ./deploy-production.sh"
echo ""
print_status $BLUE "🔧 If you found issues:"
print_status $YELLOW "   • Authentication: flyctl auth login"
print_status $YELLOW "   • App setup: wasp deploy fly setup"
print_status $YELLOW "   • WSL2 issues: Use deploy-dev.sh (has WSL2 optimizations)"
echo ""
print_status $BLUE "📊 Useful commands:"
print_status $YELLOW "   • Check apps: flyctl apps list"
print_status $YELLOW "   • Check status: flyctl status --app postmarkr-server"
print_status $YELLOW "   • View logs: flyctl logs --app postmarkr-server"
echo ""
