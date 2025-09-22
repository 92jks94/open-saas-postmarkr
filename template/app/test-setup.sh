# Nathan created

#!/bin/bash

# Test script to verify the development environment is working

echo "🧪 Testing development environment setup..."

# Fix PATH first
export PATH="/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:$PATH"

# Source bashrc
source ~/.bashrc

echo "✅ Testing basic commands:"
echo "  - Node.js: $(node --version 2>/dev/null || echo 'NOT FOUND')"
echo "  - NPM: $(npm --version 2>/dev/null || echo 'NOT FOUND')"
echo "  - Wasp: $(wasp version 2>/dev/null | head -1 || echo 'NOT FOUND')"
echo "  - Docker: $(docker --version 2>/dev/null | head -1 || echo 'NOT FOUND')"

echo ""
echo "✅ Testing project compilation:"
cd /home/nathah/Projects/open-saas-postmarkr/template/app

# Test if we can compile the project
if wasp compile > /dev/null 2>&1; then
    echo "  - Project compiles successfully ✅"
else
    echo "  - Project compilation failed ❌"
fi

echo ""
echo "🎉 Environment test complete!"
echo "💡 If all tests pass, you can run './start-dev.sh' to start development"
