#!/bin/bash
# Enhanced Wasp Deployment with Integrated Health Checks
# This script wraps wasp deploy fly deploy with comprehensive health checks

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

echo "🚀 Enhanced Wasp Deployment with Health Checks"
echo "=============================================="

# Check if we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Please run this script from the project root."
    exit 1
fi

# Pre-deployment checks
print_status $BLUE "🔍 Running pre-deployment checks..."
if npm run check:production; then
    print_status $GREEN "✅ Pre-deployment checks passed"
else
    print_status $RED "❌ Pre-deployment checks failed. Please fix issues before deploying."
    exit 1
fi

# Deploy with Wasp
print_status $BLUE "🚀 Deploying with Wasp..."
if wasp deploy fly deploy; then
    print_status $GREEN "✅ Wasp deployment completed successfully"
else
    print_status $RED "❌ Wasp deployment failed"
    exit 1
fi

# Wait for deployment to stabilize
print_status $YELLOW "⏳ Waiting for deployment to stabilize (30 seconds)..."
sleep 30

# Post-deployment health checks
print_status $BLUE "🏥 Running post-deployment health checks..."

# Check server health endpoint
print_status $BLUE "📊 Checking server health endpoint..."
for i in {1..5}; do
    if curl -f -s https://postmarkr-server.fly.dev/health > /dev/null; then
        print_status $GREEN "✅ Server health check passed"
        
        # Get detailed health info
        print_status $BLUE "📊 Server health details:"
        curl -s https://postmarkr-server.fly.dev/health | head -20
        break
    else
        if [ $i -eq 5 ]; then
            print_status $RED "❌ Server health check failed after 5 attempts"
            print_status $YELLOW "⚠️  Deployment completed but server is not responding"
            print_status $BLUE "💡 Check server logs: flyctl logs --app postmarkr-server"
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

print_status $GREEN "🎉 Deployment is healthy and ready!"

print_status $GREEN "🎉 Enhanced deployment completed successfully!"
