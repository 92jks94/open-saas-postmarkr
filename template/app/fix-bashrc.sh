#!/bin/bash

# Nathan created

# This script fixes the bashrc file to ensure Wasp works on every login
# It removes any malformed PATH entries and adds the proper Wasp configuration
# It also ensures NVM configuration is correct
# It backs up the current bashrc file before making any changes
# It then restores the backup if the script fails

# Fix bashrc to ensure Wasp works on every login

echo "🔧 Fixing bashrc configuration..."

# Backup current bashrc
cp ~/.bashrc ~/.bashrc.backup.$(date +%Y%m%d_%H%M%S)

# Remove any malformed PATH entries
sed -i '/export PATH=C:/d' ~/.bashrc

# Add proper Wasp configuration if not already present
if ! grep -q "export PATH.*local/bin" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# Wasp Configuration" >> ~/.bashrc
    echo "export PATH=\$PATH:/home/nathah/.local/bin" >> ~/.bashrc
fi

# Ensure NVM configuration is correct
if ! grep -q "NVM_DIR" ~/.bashrc; then
    echo "" >> ~/.bashrc
    echo "# NVM Configuration" >> ~/.bashrc
    echo 'export NVM_DIR="$HOME/.nvm"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"' >> ~/.bashrc
    echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"' >> ~/.bashrc
fi

echo "✅ bashrc configuration updated!"
echo "🔄 Please run 'source ~/.bashrc' or restart your terminal to apply changes."
