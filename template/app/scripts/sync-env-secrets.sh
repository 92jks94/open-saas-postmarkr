#!/bin/bash
# Sync .env.server with Fly.io secrets
# This script reads .env.server and sets the variables as Fly.io secrets

set -e

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

echo "🔄 Syncing .env.server with Fly.io Secrets"
echo "=========================================="

# Check if .env.server exists
if [ ! -f ".env.server" ]; then
    print_status $RED "❌ .env.server file not found"
    exit 1
fi

# Check if flyctl is available
if ! command -v flyctl &> /dev/null; then
    print_status $RED "❌ flyctl not found. Please install Fly CLI first."
    exit 1
fi

# Check if we're logged in
if ! flyctl auth whoami &> /dev/null; then
    print_status $RED "❌ Not logged in to Fly.io. Please run 'flyctl auth login' first."
    exit 1
fi

print_status $BLUE "📋 Reading .env.server file..."

# Read .env.server and set secrets
secret_count=0
skipped_count=0

while IFS='=' read -r key value; do
    # Skip empty lines and comments
    if [[ -z "$key" || "$key" =~ ^[[:space:]]*# ]]; then
        continue
    fi
    
    # Remove leading/trailing whitespace
    key=$(echo "$key" | xargs)
    value=$(echo "$value" | xargs)
    
    # Skip if value is empty
    if [[ -z "$value" ]]; then
        print_status $YELLOW "⚠️  Skipping $key (empty value)"
        ((skipped_count++))
        continue
    fi
    
    # Skip if value contains "test" or "sample" (safety check)
    if [[ "$value" =~ (test|sample|example|your-|placeholder) ]]; then
        print_status $YELLOW "⚠️  Skipping $key (appears to be test/sample value)"
        ((skipped_count++))
        continue
    fi
    
    print_status $BLUE "🔐 Setting secret: $key"
    
    # Set the secret
    if flyctl secrets set "$key=$value" --app postmarkr-server; then
        print_status $GREEN "✅ Set $key"
        ((secret_count++))
    else
        print_status $RED "❌ Failed to set $key"
    fi
    
done < .env.server

print_status $GREEN "🎉 Sync completed!"
echo "  • Secrets set: $secret_count"
echo "  • Skipped: $skipped_count"

print_status $BLUE "📋 Current secrets:"
flyctl secrets list --app postmarkr-server

print_status $YELLOW "💡 Next steps:"
echo "  1. Run: npm run deploy:wasp"
echo "  2. Or run: npm run check:deployment"
