#!/bin/bash

# Server binding patch for Fly.io deployment
# This script patches the generated server.ts file to bind to 0.0.0.0 in production

echo "🔧 Applying server binding patch for Fly.io deployment..."

# Path to the generated server file
SERVER_FILE=".wasp/build/server/src/server.ts"

# Check if the server file exists
if [ ! -f "$SERVER_FILE" ]; then
    echo "❌ Server file not found: $SERVER_FILE"
    echo "   Make sure to run 'wasp build' first"
    exit 1
fi

# Create backup
cp "$SERVER_FILE" "$SERVER_FILE.backup"

# Apply the patch
echo "📝 Patching server binding..."

# Replace server.listen(port) with server.listen(port, '0.0.0.0')
# Use a more precise pattern that matches the exact format without parentheses issues
sed -i "s/server\.listen(port)/server.listen(port, '0.0.0.0')/g" "$SERVER_FILE"

# Update the listening message to show the correct binding
sed -i "s/'port ' + addr\.port/'0.0.0.0:' + addr.port/g" "$SERVER_FILE"

echo "✅ Server binding patch applied successfully"
echo "   Server will now bind to 0.0.0.0:8080 for Fly.io compatibility"

# Verify the changes
if grep -q "server.listen(port, '0.0.0.0')" "$SERVER_FILE"; then
    echo "✅ Patch verification successful"
else
    echo "❌ Patch verification failed - reverting changes"
    mv "$SERVER_FILE.backup" "$SERVER_FILE"
    exit 1
fi

echo "🚀 Ready for deployment!"
