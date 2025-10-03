#!/bin/bash
# Fix Current Deployment Script
# Addresses the DATABASE_URL issue and fixes the broken deployment

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

print_status $BLUE "🔧 Fixing Current Deployment"
print_status $BLUE "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "main.wasp" ]; then
    print_status $RED "❌ main.wasp not found. Run from project root."
    exit 1
fi

# Check if apps exist
print_status $YELLOW "📋 Checking existing apps..."
if ! flyctl apps list 2>/dev/null | grep -q "postmarkr"; then
    print_status $RED "❌ No Postmarkr apps found"
    print_status $YELLOW "💡 Run: ./deploy-simple.sh to create new deployment"
    exit 1
fi

print_status $GREEN "✅ Found Postmarkr apps"

# Get DATABASE_URL from server app
print_status $YELLOW "📋 Getting DATABASE_URL from server app..."
SERVER_APP="postmarkr-server"
CLIENT_APP="postmarkr-client"

# Check if server has DATABASE_URL
if flyctl secrets list --app $SERVER_APP 2>/dev/null | grep -q "DATABASE_URL"; then
    print_status $GREEN "✅ Server app has DATABASE_URL"
    
    # Copy DATABASE_URL to client app
    print_status $YELLOW "📋 Copying DATABASE_URL to client app..."
    
    # Get the DATABASE_URL value (this is a bit tricky with flyctl)
    print_status $BLUE "🔧 Setting DATABASE_URL on client app..."
    
    # We need to get the DATABASE_URL from the server app
    # Since flyctl doesn't have a direct way to copy secrets, we'll need to set it manually
    print_status $YELLOW "⚠️  Manual step required:"
    print_status $BLUE "1. Get DATABASE_URL from server app:"
    print_status $BLUE "   flyctl secrets list --app $SERVER_APP"
    print_status $BLUE "2. Set DATABASE_URL on client app:"
    print_status $BLUE "   flyctl secrets set DATABASE_URL='your-database-url' --app $CLIENT_APP"
    echo ""
    
    read -p "Have you set the DATABASE_URL on the client app? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_status $GREEN "✅ DATABASE_URL configured"
    else
        print_status $YELLOW "⚠️  Please set DATABASE_URL on client app first"
        exit 1
    fi
else
    print_status $RED "❌ Server app doesn't have DATABASE_URL"
    print_status $YELLOW "💡 This suggests the server app is also broken"
    print_status $YELLOW "💡 Consider using: ./deploy-simple.sh to create a fresh deployment"
    exit 1
fi

# Restart the client app to pick up the new secret
print_status $YELLOW "📋 Restarting client app..."
flyctl machine restart --app $CLIENT_APP || print_status $YELLOW "⚠️  Could not restart client app"

# Wait a bit for restart
print_status $YELLOW "⏳ Waiting 30 seconds for restart..."
sleep 30

# Check status
print_status $YELLOW "📋 Checking deployment status..."
echo ""

print_status $BLUE "Server status:"
flyctl status --app $SERVER_APP 2>/dev/null || print_status $YELLOW "⏳ Server status unavailable"
echo ""

print_status $BLUE "Client status:"
flyctl status --app $CLIENT_APP 2>/dev/null || print_status $YELLOW "⏳ Client status unavailable"
echo ""

# Check logs
print_status $YELLOW "📋 Checking client logs..."
print_status $BLUE "Recent client logs:"
flyctl logs --app $CLIENT_APP --no-tail | tail -20 || print_status $YELLOW "⏳ Could not get logs"
echo ""

print_status $GREEN "🎉 Deployment fix completed!"
print_status $BLUE "============================"
echo ""
print_status $YELLOW "📊 Monitor deployment:"
print_status $BLUE "   Server logs: flyctl logs --app $SERVER_APP"
print_status $BLUE "   Client logs: flyctl logs --app $CLIENT_APP"
print_status $BLUE "   Server status: flyctl status --app $SERVER_APP"
print_status $BLUE "   Client status: flyctl status --app $CLIENT_APP"
echo ""
print_status $YELLOW "💡 If issues persist, consider using: ./deploy-simple.sh for a fresh deployment"
