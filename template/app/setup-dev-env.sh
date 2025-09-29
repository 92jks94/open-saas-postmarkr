#!/bin/bash

# Development Environment Setup Script for Postmarkr
# This script creates the necessary environment files to fix signup issues

echo "🚀 Setting up development environment for Postmarkr..."

# Create .env.server file
echo "📝 Creating .env.server file..."
cat > .env.server << 'EOF'
# Node Environment
NODE_ENV=development

# Email Verification Settings (Development Only)
SKIP_EMAIL_VERIFICATION=true

# Database (update with your actual database URL)
DATABASE_URL="postgresql://username:password@localhost:5432/postmarkr_dev"

# JWT Secret (generate a secure random string for production)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long-development-only"

# Wasp URLs
WASP_WEB_CLIENT_URL="http://localhost:3000"
WASP_SERVER_URL="http://localhost:3001"

# Admin Emails (comma-separated list)
ADMIN_EMAILS="nathan@postmarkr.com"

# Beta Access Code
BETA_ACCESS_CODE="312"
EOF

# Create .env.client file
echo "📝 Creating .env.client file..."
cat > .env.client << 'EOF'
# Node Environment
REACT_APP_NODE_ENV=development
EOF

echo "✅ Environment files created successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update the DATABASE_URL in .env.server with your actual database connection"
echo "2. Generate a secure JWT_SECRET for production use"
echo "3. Restart your Wasp development server: wasp start"
echo ""
echo "🔧 Signup should now work without 422 validation errors!"
echo "📧 Verification emails will be printed to your server console"
echo ""
echo "📖 For more details, see docs/ENVIRONMENT_SETUP.md"
