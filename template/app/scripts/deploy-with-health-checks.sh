#!/bin/bash
# Production Deployment Script with Health Checks
# This script deploys the application and runs comprehensive health checks

set -e  # Exit on any error

echo "🚀 Starting Production Deployment with Health Checks"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
print_status $BLUE "📋 Checking prerequisites..."

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

# Deploy the application
print_status $BLUE "🚀 Deploying application to Fly.io..."

if wasp deploy fly deploy; then
    print_status $GREEN "✅ Deployment completed successfully"
else
    print_status $RED "❌ Deployment failed"
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

print_status $GREEN "🎉 Deployment is healthy and ready!"

# Final status
print_status $BLUE "📊 Deployment Summary:"
echo "  • Client URL: https://postmarkr-client.fly.dev"
echo "  • Server URL: https://postmarkr-server.fly.dev"
echo "  • Health Check: https://postmarkr-server.fly.dev/health"
echo "  • Monitoring: https://fly.io/apps/postmarkr-server/monitoring"

print_status $GREEN "🎉 Production deployment completed successfully!"
