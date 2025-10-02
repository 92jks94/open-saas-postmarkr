#!/bin/bash
# Simple Wasp Deployment with Retry - No Health Checks
# Use this for faster deployments when you just want retry logic

set +e  # Don't exit on error - we'll handle retries

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${1}${2}${NC}"
}

# Configuration
MAX_RETRIES=3
RETRY_DELAY=10

print_status $BLUE "🚀 Wasp Deployment with Retry (Simple)"
echo ""

# Check if we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Please run from project root."
    exit 1
fi

# Retry loop
for ((i=1; i<=MAX_RETRIES; i++)); do
    print_status $BLUE "🚀 Deployment attempt $i/$MAX_RETRIES..."
    
    if wasp deploy fly deploy; then
        print_status $GREEN "✅ Deployment completed successfully!"
        exit 0
    else
        if [ $i -lt $MAX_RETRIES ]; then
            print_status $YELLOW "⚠️  Attempt $i failed, retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
        fi
    fi
done

print_status $RED "❌ Deployment failed after $MAX_RETRIES attempts"
print_status $BLUE "💡 Network issues detected. Wait a few minutes and try again."
exit 1

