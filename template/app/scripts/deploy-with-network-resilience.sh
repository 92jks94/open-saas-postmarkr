#!/bin/bash
# Enhanced Wasp Deployment Script with Network Resilience
# This script handles network connectivity issues and server binding for Fly.io deployment

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

# Configuration
MAX_RETRIES=5
RETRY_DELAY=15
CURRENT_RETRY=0
NETWORK_TIMEOUT=30

print_status $BLUE "🚀 Enhanced Wasp Deployment with Network Resilience"
print_status $BLUE "====================================================="
echo ""

# Check if we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Please run this script from the project root."
    exit 1
fi

# Function to check network connectivity
check_network() {
    print_status $BLUE "🌐 Checking network connectivity..."
    
    # Test basic connectivity
    if ! ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_status $RED "❌ No internet connectivity"
        return 1
    fi
    
    # Test Fly.io API connectivity
    if ! curl -s --max-time $NETWORK_TIMEOUT "https://api.fly.io/graphql" > /dev/null; then
        print_status $YELLOW "⚠️ Fly.io API connectivity issues detected"
        return 1
    fi
    
    print_status $GREEN "✅ Network connectivity verified"
    return 0
}

# Function to apply server binding patch
apply_server_patch() {
    print_status $BLUE "🔧 Applying server binding patch for Fly.io..."
    
    # Path to the generated server file
    SERVER_FILE=".wasp/build/server/src/server.ts"
    
    # Check if the server file exists
    if [ ! -f "$SERVER_FILE" ]; then
        print_status $RED "❌ Server file not found: $SERVER_FILE"
        print_status $YELLOW "   Running wasp build first..."
        wasp build
    fi
    
    # Create backup
    cp "$SERVER_FILE" "$SERVER_FILE.backup"
    
    # Apply the patch
    print_status $BLUE "📝 Patching server binding..."
    
    # Replace server.listen(port) with server.listen(port, '0.0.0.0')
    sed -i "s/server\.listen(port)/server.listen(port, '0.0.0.0')/g" "$SERVER_FILE"
    
    # Update the listening message to show the correct binding
    sed -i "s/'port ' + addr\.port/'0.0.0.0:' + addr.port/g" "$SERVER_FILE"
    
    # Verify the changes
    if grep -q "server.listen(port, '0.0.0.0')" "$SERVER_FILE"; then
        print_status $GREEN "✅ Server binding patch applied successfully"
    else
        print_status $RED "❌ Patch verification failed - reverting changes"
        mv "$SERVER_FILE.backup" "$SERVER_FILE"
        exit 1
    fi
}

# Function to deploy with wasp
deploy_with_wasp() {
    print_status $BLUE "🚀 Attempting deployment (attempt $((CURRENT_RETRY + 1))/$MAX_RETRIES)..."
    
    # Check network before deployment
    if ! check_network; then
        print_status $YELLOW "⚠️ Network issues detected, waiting before retry..."
        sleep 30
        return 1
    fi
    
    # Apply server binding patch before deployment
    apply_server_patch
    
    # Run the deployment using correct Wasp command with timeout
    timeout $NETWORK_TIMEOUT wasp deploy fly deploy
    return $?
}

# Function to wait for deployment stability
wait_for_deployment() {
    local max_wait=300  # 5 minutes
    local wait_time=0
    
    print_status $BLUE "⏳ Waiting for deployment to stabilize..."
    
    while [ $wait_time -lt $max_wait ]; do
        if curl -f -s --max-time 10 "https://postmarkr-server.fly.dev/health/simple" > /dev/null 2>&1; then
            print_status $GREEN "✅ Server is responding"
            return 0
        fi
        
        sleep 10
        wait_time=$((wait_time + 10))
        print_status $YELLOW "   Still waiting... (${wait_time}s/${max_wait}s)"
    done
    
    print_status $YELLOW "⚠️ Server not responding after ${max_wait}s - may still be starting"
    return 1
}

# Main retry loop
while [ $CURRENT_RETRY -lt $MAX_RETRIES ]; do
    if deploy_with_wasp; then
        print_status $GREEN "✅ Deployment completed successfully!"
        echo ""
        
        # Wait for deployment to stabilize
        wait_for_deployment
        
        # Run health checks
        print_status $BLUE "🏥 Running health checks..."
        
        # Check server health
        if curl -f -s --max-time 10 "https://postmarkr-server.fly.dev/health/simple" > /dev/null; then
            print_status $GREEN "✅ Server health check passed"
        else
            print_status $YELLOW "⚠️ Server health check failed - may still be starting up"
        fi
        
        # Check client health
        if curl -f -s --max-time 10 "https://postmarkr-client.fly.dev/" > /dev/null; then
            print_status $GREEN "✅ Client health check passed"
        else
            print_status $YELLOW "⚠️ Client health check failed - may still be starting up"
        fi
        
        print_status $GREEN "🎉 Deployment and health checks completed!"
        print_status $BLUE "🌐 Your app is accessible at: https://postmarkr-client.fly.dev"
        exit 0
    else
        CURRENT_RETRY=$((CURRENT_RETRY + 1))
        if [ $CURRENT_RETRY -lt $MAX_RETRIES ]; then
            print_status $YELLOW "⚠️ Deployment failed. Retrying in $RETRY_DELAY seconds... (attempt $((CURRENT_RETRY + 1))/$MAX_RETRIES)"
            sleep $RETRY_DELAY
        else
            print_status $RED "❌ Deployment failed after $MAX_RETRIES attempts"
            print_status $YELLOW "💡 Common solutions:"
            print_status $YELLOW "   - Check your internet connection"
            print_status $YELLOW "   - Verify Fly.io service status"
            print_status $YELLOW "   - Try again in a few minutes"
            exit 1
        fi
    fi
done