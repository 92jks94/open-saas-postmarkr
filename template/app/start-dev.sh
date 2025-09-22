# Nathan created

#!/bin/bash

# Development startup script for Wasp project
# This ensures all paths and environments are properly set

echo "🚀 Starting Wasp development environment..."

# Fix PATH first - ensure basic system commands are available
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Clean up any existing processes first
echo "🧹 Cleaning up existing processes..."
pkill -f "wasp start" 2>/dev/null || true
pkill -f "wasp-bin start" 2>/dev/null || true
docker stop $(docker ps -q --filter "name=wasp-dev-db") 2>/dev/null || true

# Source bashrc to get basic environment
source ~/.bashrc

# Load NVM and set Node.js version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Set Node.js to version 22 for Wasp compatibility
nvm use 22

# Add Wasp to PATH
export PATH="$PATH:/home/nathah/.local/bin"

# Navigate to project directory
cd /home/nathah/Projects/open-saas-postmarkr/template/app

# Check if Wasp is accessible
if ! command -v wasp &> /dev/null; then
    echo "❌ Wasp not found in PATH. Please check installation."
    echo "💡 Try running: ./fix-bashrc.sh"
    exit 1
fi

echo "✅ Wasp found: $(wasp version)"

# Start database
echo "🐘 Starting PostgreSQL database..."
wasp start db &
sleep 15

# Verify database is running
if ! docker ps | grep -q postgres; then
    echo "❌ Failed to start database. Please check Docker."
    exit 1
fi

echo "✅ Database is running"

# Start the application
echo "🚀 Starting Wasp development server..."
echo "📱 Application will be available at: http://localhost:3000"
echo "🛑 Press Ctrl+C to stop the development server"
wasp start
