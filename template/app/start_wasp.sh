#!/bin/bash
cd /home/nathah/Projects/open-saas-postmarkr/template/app

# Load nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Use Node.js v22.19.0
nvm use v22.19.0

# Check Node version
echo "Node version: $(node --version)"

# Start Wasp
~/.local/share/wasp-lang/*/wasp-bin start
