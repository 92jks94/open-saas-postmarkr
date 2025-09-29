# Environment Setup for Development

This document explains how to set up your environment variables to fix signup issues in development.

## Quick Fix for Signup Issues

The 422 validation errors during signup are caused by missing environment variables. Here's how to fix them:

### Step 1: Create Environment Files

Create a `.env.server` file in the root directory with these contents:

```bash
# Node Environment
NODE_ENV=development

# Email Verification Settings (Development Only)
SKIP_EMAIL_VERIFICATION=true

# Database (update with your actual database URL)
DATABASE_URL="postgresql://username:password@localhost:5432/postmarkr_dev"

# JWT Secret (generate a secure random string)
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"

# Wasp URLs
WASP_WEB_CLIENT_URL="http://localhost:3000"
WASP_SERVER_URL="http://localhost:3001"

# Admin Emails (comma-separated list)
ADMIN_EMAILS="nathan@postmarkr.com"

# Beta Access Code
BETA_ACCESS_CODE="312"
```

### Step 2: Create Client Environment File

Create a `.env.client` file in the root directory with these contents:

```bash
# Node Environment
REACT_APP_NODE_ENV=development
```

### Step 3: Restart Wasp Server

After creating these files, restart your Wasp development server:

```bash
wasp start
```

## What This Fixes

1. **422 Validation Errors**: The environment variables ensure proper validation handling
2. **Email Verification**: Uses Dummy email provider in development (prints to console)
3. **Development Mode**: Configures the app to run properly in development

## Email Verification in Development

With the Dummy email provider configured, verification emails will be printed to your server console instead of being sent via SendGrid. Look for output like:

```
📧 Email sent to: user@example.com
Subject: Verify your email
Content: Click the link below to verify your email: http://localhost:3000/email-verification?token=...
```

## Optional Configuration

You can add these optional environment variables as needed:

### SendGrid (for actual email sending)
```bash
SENDGRID_API_KEY="SG.your-sendgrid-api-key"
SENDGRID_FROM_EMAIL="nathan@postmarkr.com"
SENDGRID_FROM_NAME="Postmarkr"
```

### Stripe (for payments)
```bash
STRIPE_SECRET_KEY="sk_test_your-stripe-secret-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-publishable-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"
```

### Other Services
See the full list of optional environment variables in the original template documentation.

## Security Note

- Never commit `.env.server` or `.env.client` files to version control
- Use strong, unique values for JWT_SECRET in production
- Keep API keys and secrets secure

## Troubleshooting

If you're still experiencing issues:

1. Make sure the `.env.server` file is in the root directory (same level as `main.wasp`)
2. Restart the Wasp development server completely
3. Check the server console for any error messages
4. Verify that `NODE_ENV=development` is set correctly

## Production Deployment

When deploying to production:

1. Set `NODE_ENV=production`
2. Remove or set `SKIP_EMAIL_VERIFICATION=false`
3. Configure proper SendGrid credentials
4. Use strong, unique values for all secrets
5. Update database URL to production database
