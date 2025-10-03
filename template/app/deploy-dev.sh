#!/bin/bash
# Development Deployment Script - Fast Server-Only Deployment with WSL2 Optimizations
# Combines: deploy-simple.sh + deploy-wsl-fix.sh + scripts/deploy-quick.sh

set +e  # Don't exit on error - we'll handle retries

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
SERVER_APP="postmarkr-server"
MAX_RETRIES=3
RETRY_DELAY=10

print_status $BLUE "🚀 Development Deployment - Server Only"
print_status $BLUE "======================================="
echo ""

# Check directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# WSL2 Network Optimizations
print_status $YELLOW "🔧 Applying WSL2 network optimizations..."
if command -v sysctl >/dev/null 2>&1; then
    sudo sysctl -w net.ipv4.tcp_keepalive_time=60 2>/dev/null || true
    sudo sysctl -w net.ipv4.tcp_keepalive_intvl=10 2>/dev/null || true
    sudo sysctl -w net.ipv4.tcp_keepalive_probes=6 2>/dev/null || true
    print_status $GREEN "✅ WSL2 optimizations applied"
else
    print_status $YELLOW "⚠️  sysctl not available, skipping WSL2 optimizations"
fi

# Verify flyctl connectivity with retry
print_status $BLUE "🌐 Testing Fly.io connectivity..."
MAX_CONN_RETRIES=3
for i in $(seq 1 $MAX_CONN_RETRIES); do
    if flyctl auth whoami > /dev/null 2>&1; then
        print_status $GREEN "✅ Connected to Fly.io"
        break
    else
        if [ $i -eq $MAX_CONN_RETRIES ]; then
            print_status $RED "❌ Cannot connect to Fly.io after $MAX_CONN_RETRIES attempts"
            print_status $YELLOW "💡 Try: flyctl auth login"
            exit 1
        fi
        print_status $YELLOW "⏳ Retry $i/$MAX_CONN_RETRIES..."
        sleep 5
    fi
done

# Build
print_status $BLUE "📦 Building Wasp application..."
wasp build

# Navigate to build directory
cd .wasp/build

# Set longer timeouts for WSL2
export FLY_API_READ_TIMEOUT=600
export FLY_API_CONNECT_TIMEOUT=120

# Retry loop for deployment
print_status $BLUE "🚀 Deploying server with retry logic..."
for ((i=1; i<=MAX_RETRIES; i++)); do
    print_status $BLUE "🚀 Deployment attempt $i/$MAX_RETRIES..."
    
    # Use --detach to avoid WSL2 connection timeouts
    if flyctl deploy \
      --config ../../fly-server.toml \
      --app ${SERVER_APP} \
      --detach \
      --verbose; then
        print_status $GREEN "✅ Deployment completed successfully!"
        break
    else
        if [ $i -lt $MAX_RETRIES ]; then
            print_status $YELLOW "⚠️  Attempt $i failed, retrying in $RETRY_DELAY seconds..."
            sleep $RETRY_DELAY
            RETRY_DELAY=$((RETRY_DELAY * 2))  # Exponential backoff
        else
            print_status $RED "❌ Deployment failed after $MAX_RETRIES attempts"
            print_status $BLUE "💡 Network issues detected. Wait a few minutes and try again."
            exit 1
        fi
    fi
done

# Wait a bit for deployment to process
print_status $YELLOW "⏳ Waiting 15 seconds for deployment to stabilize..."
sleep 15

# Check status with retry
print_status $BLUE "📊 Checking deployment status..."
for i in {1..3}; do
    if flyctl status --app ${SERVER_APP} 2>/dev/null; then
        break
    else
        print_status $YELLOW "⏳ Waiting for status... (attempt $i/3)"
        sleep 10
    fi
done

# Quick health check
print_status $BLUE "🏥 Running quick health check..."
for i in {1..3}; do
    if curl -f -s ${SERVER_URL}/health/simple > /dev/null; then
        print_status $GREEN "✅ Server is responding"
        break
    else
        if [ $i -eq 3 ]; then
            print_status $YELLOW "⚠️  Server may still be starting up"
        else
            print_status $YELLOW "⏳ Health check attempt $i/3..."
            sleep 5
        fi
    fi
done

print_status $GREEN "🎉 Development deployment completed!"
print_status $BLUE "====================================="
echo ""
print_status $BLUE "🌐 Server URL: ${SERVER_URL}"
print_status $YELLOW "📊 Monitor deployment:"
print_status $BLUE "   Logs: flyctl logs --app ${SERVER_APP}"
print_status $BLUE "   Status: flyctl status --app ${SERVER_APP}"
print_status $BLUE "   Health: curl -f ${SERVER_URL}/health/simple"
echo ""
print_status $YELLOW "💡 For full-stack deployment, use: ./deploy-production.sh"
