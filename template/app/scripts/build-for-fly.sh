#!/bin/bash

# Build script for Fly.io deployment
# This script builds the Wasp app and applies the server binding patch

echo "ðŸ”¨ Building Wasp application for Fly.io..."

# Build the application
npx wasp build

echo "ðŸ”§ Applying server binding patch..."

# Apply the server binding patch
SERVER_FILE=".wasp/build/server/src/server.ts"

if [ -f "$SERVER_FILE" ]; then
    # Create backup
    cp "$SERVER_FILE" "$SERVER_FILE.backup"
    
    # Apply the patch
    sed -i "s/server\.listen(port)/server.listen(port, '0.0.0.0')/g" "$SERVER_FILE"
    
    # Verify the changes
    if grep -q "server.listen(port, '0.0.0.0')" "$SERVER_FILE"; then
        echo "âœ… Server binding patch applied successfully"
    else
        echo "âŒ Patch verification failed - reverting changes"
        mv "$SERVER_FILE.backup" "$SERVER_FILE"
        exit 1
    fi
else
    echo "âŒ Server file not found: $SERVER_FILE"
    exit 1
fi

echo "ðŸš€ Build complete - ready for deployment!"
