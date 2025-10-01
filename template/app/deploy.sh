#!/bin/bash

# Add flyctl to PATH
export PATH="/home/nathah/.fly/bin:$PATH"

echo "Fly.io CLI version:"
flyctl version

echo ""
echo "Checking authentication status:"
flyctl auth status

echo ""
echo "If not authenticated, run: flyctl auth login"
echo "Then run: wasp deploy fly launch postmarkr-production mia"
