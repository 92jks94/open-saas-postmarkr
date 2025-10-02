# GitHub Actions Deployment Setup Guide

This guide will walk you through setting up automated deployment to Fly.io using GitHub Actions.

## Prerequisites

1. **GitHub Repository**: Your code should be in a GitHub repository
2. **Fly.io Account**: You need a Fly.io account with your apps already created
3. **Fly.io API Token**: You'll need to generate an API token from Fly.io

## Step 1: Generate Fly.io API Token

1. Go to [Fly.io Dashboard](https://fly.io/dashboard)
2. Click on your profile picture in the top right
3. Select "Access Tokens"
4. Click "Create Token"
5. Give it a name like "GitHub Actions Deployment"
6. Copy the token (you won't see it again!)

## Step 2: Configure GitHub Repository Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions

### Required Secrets

Add these secrets to your GitHub repository:

#### Fly.io Configuration
- `FLY_API_TOKEN`: Your Fly.io API token from Step 1
- `FLY_SERVER_APP_NAME`: Your server app name (e.g., `postmarkr-server`)
- `FLY_CLIENT_APP_NAME`: Your client app name (e.g., `postmarkr-client`)

#### Database
- `DATABASE_URL`: Your PostgreSQL connection string

#### Authentication
- `JWT_SECRET`: Your JWT secret (at least 32 characters)

#### Server Configuration
- `PORT`: Server port (usually `8080`)
- `WASP_SERVER_URL`: Your server URL (e.g., `https://postmarkr-server.fly.dev`)
- `WASP_WEB_CLIENT_URL`: Your client URL (e.g., `https://postmarkr-client.fly.dev`)
- `NODE_ENV`: Environment (`production` or `staging`)

#### Email Configuration
- `SMTP_HOST`: Your SMTP host
- `SMTP_PASSWORD`: SMTP password
- `SMTP_PORT`: SMTP port
- `SMTP_USERNAME`: SMTP username
- `SENDGRID_API_KEY`: SendGrid API key
- `SENDGRID_FROM_EMAIL`: From email address
- `SENDGRID_FROM_NAME`: From name
- `ADMIN_EMAILS`: Comma-separated admin email addresses

#### AWS S3 Configuration
- `AWS_S3_FILES_BUCKET`: S3 bucket name
- `AWS_S3_IAM_ACCESS_KEY`: AWS access key
- `AWS_S3_IAM_SECRET_KEY`: AWS secret key
- `AWS_S3_REGION`: AWS region

#### Lob Configuration
- `LOB_ENVIRONMENT`: `production` or `test`
- `LOB_PROD_KEY`: Lob production API key
- `LOB_TEST_KEY`: Lob test API key
- `LOB_WEBHOOK_SECRET`: Lob webhook secret

#### Payment Configuration
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_PUBLISHABLE_KEY`: Stripe publishable key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook secret
- `STRIPE_CUSTOMER_PORTAL_URL`: Stripe customer portal URL
- `PAYMENTS_LARGE_BATCH_PLAN_ID`: Stripe plan ID for large batches
- `PAYMENTS_MEDIUM_BATCH_PLAN_ID`: Stripe plan ID for medium batches
- `PAYMENTS_SMALL_BATCH_PLAN_ID`: Stripe plan ID for small batches

#### Analytics Configuration
- `GOOGLE_ANALYTICS_CLIENT_EMAIL`: Google Analytics service account email
- `GOOGLE_ANALYTICS_ID`: Google Analytics tracking ID
- `GOOGLE_ANALYTICS_PRIVATE_KEY`: Google Analytics private key
- `GOOGLE_ANALYTICS_PROPERTY_ID`: Google Analytics property ID

#### Monitoring Configuration
- `SENTRY_DSN`: Sentry DSN for error tracking
- `SENTRY_SERVER_NAME`: Sentry server name
- `OPENAI_API_KEY`: OpenAI API key (if using AI features)

## Step 3: Environment Protection Rules (Optional but Recommended)

1. Go to Settings → Environments
2. Create environments:
   - `production` (for main branch)
   - `staging` (for develop branch)
3. Add protection rules:
   - Required reviewers (optional)
   - Wait timer (optional)
   - Restrict to specific branches

## Step 4: Test the Deployment

### Automatic Deployment
- Push to `main` branch → deploys to production
- Push to `develop` branch → deploys to staging

### Manual Deployment
1. Go to Actions tab in your GitHub repository
2. Select "Deploy to Fly.io" workflow
3. Click "Run workflow"
4. Choose environment and options
5. Click "Run workflow"

## Step 5: Monitor Deployments

### GitHub Actions
- Go to Actions tab to see deployment status
- Click on individual runs to see detailed logs
- Check the "Deployment Summary" for quick status

### Fly.io Dashboard
- Monitor your apps in the Fly.io dashboard
- Check logs: `flyctl logs --app your-app-name`
- Check status: `flyctl status --app your-app-name`

## Troubleshooting

### Common Issues

1. **Authentication Failed**
   - Verify `FLY_API_TOKEN` is correct
   - Check token hasn't expired

2. **App Not Found**
   - Verify `FLY_SERVER_APP_NAME` and `FLY_CLIENT_APP_NAME` are correct
   - Ensure apps exist in Fly.io

3. **Environment Variables Missing**
   - Check all required secrets are set
   - Verify secret names match exactly

4. **Build Failures**
   - Check GitHub Actions logs for specific errors
   - Ensure all dependencies are in package.json

### Getting Help

1. Check GitHub Actions logs for detailed error messages
2. Review Fly.io deployment logs
3. Test locally with `wasp deploy fly deploy` to isolate issues

## Benefits of GitHub Actions Deployment

✅ **Eliminates Local Network Issues**: No more WSL2 connectivity problems
✅ **Consistent Environment**: Same build environment every time
✅ **Automated Testing**: Runs tests before deployment
✅ **Rollback Capability**: Easy to revert to previous versions
✅ **Audit Trail**: Complete history of deployments
✅ **Parallel Deployments**: Can deploy multiple environments simultaneously
✅ **Manual Override**: Can force deployment even if tests fail
✅ **Health Checks**: Verifies deployment success automatically

## Next Steps

1. Set up the secrets as described above
2. Push a change to trigger your first automated deployment
3. Monitor the deployment in GitHub Actions
4. Celebrate! 🎉
