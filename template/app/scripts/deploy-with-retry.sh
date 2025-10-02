#!/bin/bash
# Wasp Deployment Script with Automatic Retry Logic
# Handles transient network issues during Docker builds

set +e  # Don't exit on error - we'll handle retries

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

# Configuration
MAX_RETRIES=3
RETRY_DELAY=10
CURRENT_RETRY=0

print_status $BLUE "🚀 Wasp Deployment with Retry Logic"
print_status $BLUE "======================================"
echo ""

# Check if we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Please run this script from the project root."
    exit 1
fi

# Function to deploy with wasp
deploy_with_wasp() {
    print_status $BLUE "🚀 Attempting deployment (attempt $((CURRENT_RETRY + 1))/$MAX_RETRIES)..."
    
    # Run the deployment using correct Wasp command
    wasp deploy fly deploy
    return $?
}

# Main retry loop
while [ $CURRENT_RETRY -lt $MAX_RETRIES ]; do
    if deploy_with_wasp; then
        print_status $GREEN "✅ Deployment completed successfully!"
        echo ""
        
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
                echo ""
                break
            else
                if [ $i -eq 5 ]; then
                    print_status $RED "❌ Server health check failed after 5 attempts"
                    print_status $YELLOW "⚠️  Deployment completed but server is not responding"
                    print_status $BLUE "💡 Check server logs: flyctl logs --app postmarkr-server"
                    exit 1
                fi
                print_status $YELLOW "⚠️  Health check attempt $i/5 failed, retrying in 5 seconds..."
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
        exit 0
    else
        CURRENT_RETRY=$((CURRENT_RETRY + 1))
        
        if [ $CURRENT_RETRY -lt $MAX_RETRIES ]; then
            print_status $YELLOW "⚠️  Deployment attempt $CURRENT_RETRY failed"
            print_status $YELLOW "⏳ Waiting $RETRY_DELAY seconds before retry..."
            echo ""
            sleep $RETRY_DELAY
            
            # Exponential backoff - double the delay for next attempt
            RETRY_DELAY=$((RETRY_DELAY * 2))
        else
            print_status $RED "❌ Deployment failed after $MAX_RETRIES attempts"
            print_status $BLUE "💡 Troubleshooting tips:"
            print_status $BLUE "   1. Check npm registry status: https://status.npmjs.org/"
            print_status $BLUE "   2. Check Fly.io status: https://status.flyio.net/"
            print_status $BLUE "   3. Try again in a few minutes - network issues are often transient"
            print_status $BLUE "   4. Check flyctl logs: flyctl logs --app postmarkr-server"
            exit 1
        fi
    fi
done

