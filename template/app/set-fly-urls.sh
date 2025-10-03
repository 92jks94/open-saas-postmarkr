#!/bin/bash
# Script to configure Fly.io environment variables for client-server communication
# This tells the client where to find the server and vice versa

set -e

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${BLUE}🔧 Configuring Fly.io URLs${NC}"
echo -e "${BLUE}==========================${NC}"

# Define the URLs
SERVER_URL="https://postmarkr-server.fly.dev"
CLIENT_URL="https://postmarkr-client.fly.dev"

echo -e "${YELLOW}Setting server URL: ${SERVER_URL}${NC}"
echo -e "${YELLOW}Setting client URL: ${CLIENT_URL}${NC}"
echo ""

# Set secrets for the server app
echo -e "${BLUE}📡 Configuring server app (postmarkr-server)...${NC}"
flyctl secrets set \
  WASP_WEB_CLIENT_URL="${CLIENT_URL}" \
  WASP_SERVER_URL="${SERVER_URL}" \
  --app postmarkr-server

echo ""

# Set secrets for the client app
echo -e "${BLUE}🌐 Configuring client app (postmarkr-client)...${NC}"
flyctl secrets set \
  WASP_WEB_CLIENT_URL="${CLIENT_URL}" \
  WASP_SERVER_URL="${SERVER_URL}" \
  --app postmarkr-client

echo ""
echo -e "${GREEN}✅ URLs configured successfully!${NC}"
echo ""
echo -e "${YELLOW}⚠️  IMPORTANT: After setting these secrets, you MUST redeploy both apps:${NC}"
echo -e "   1. The client needs to be rebuilt with the new WASP_SERVER_URL"
echo -e "   2. The server needs to restart with the new WASP_WEB_CLIENT_URL for CORS"
echo ""
echo -e "${BLUE}To redeploy:${NC}"
echo -e "   bash deploy-wsl-fix.sh"
echo ""

