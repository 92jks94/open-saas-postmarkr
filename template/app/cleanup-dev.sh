# Nathan created

#!/bin/bash

# Cleanup script to stop all development processes

echo "🧹 Cleaning up development environment..."

# Stop any running Wasp processes
pkill -f "wasp start" 2>/dev/null || true
pkill -f "wasp-bin start" 2>/dev/null || true

# Stop any running database containers
docker stop $(docker ps -q --filter "name=wasp-dev-db") 2>/dev/null || true

# Kill any processes using ports 3000, 3001, 3002
for port in 3000 3001 3002; do
    pid=$(lsof -ti:$port 2>/dev/null || true)
    if [ ! -z "$pid" ]; then
        echo "Stopping process on port $port (PID: $pid)"
        kill -9 $pid 2>/dev/null || true
    fi
done

echo "✅ Cleanup completed!"
