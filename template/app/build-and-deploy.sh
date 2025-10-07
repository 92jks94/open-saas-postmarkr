#!/bin/bash
export PATH=$PATH:/home/nathah/.local/bin

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "🚀 Building Wasp application..."
wasp build

echo "🔧 Applying server binding patch for Fly.io deployment..."
./scripts/patch-server-binding.sh

echo "🚀 Deploying to Fly.io..."
cd .wasp/build
flyctl deploy --config ../../fly-server.toml --app postmarkr-server-server --detach
