# Environment Variables Documentation

This document provides comprehensive information about all environment variables used in the Postmarkr application.

## 🔑 Required Environment Variables

### Core Application Variables

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL database connection string | `postgresql://user:pass@host:port/db` | ✅ |
| `JWT_SECRET` | Secret key for JWT token signing (min 32 chars) | `your-super-secret-jwt-key-here` | ✅ |
| `WASP_WEB_CLIENT_URL` | Frontend application URL | `https://postmarkr.com` | ✅ |
| `WASP_SERVER_URL` | Backend API URL | `https://api.postmarkr.com` | ✅ |

### Email Service (SendGrid)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENDGRID_API_KEY` | SendGrid API key for sending emails | `SG.your_sendgrid_api_key_here` | ✅ |
| `SENDGRID_FROM_EMAIL` | Default sender email address | `noreply@postmarkr.com` | ✅ |
| `SENDGRID_FROM_NAME` | Default sender name | `Postmarkr` | ✅ |

### Payment Processing (Stripe)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STRIPE_SECRET_KEY` | Stripe secret API key | `sk_live_your_stripe_secret_key_here` | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable API key | `pk_live_your_stripe_publishable_key_here` | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_your_stripe_webhook_secret_here` | ✅ |
| `STRIPE_CUSTOMER_PORTAL_URL` | Stripe customer portal URL | `https://billing.stripe.com/p/login/...` | ✅ |

### Mail Service (Lob)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `LOB_PROD_KEY` | Lob production API key | `live_your_lob_production_api_key_here` | ✅ |
| `LOB_ENVIRONMENT` | Lob environment setting | `live`, `test`, or `prod` | ✅ |
| `LOB_WEBHOOK_SECRET` | Lob webhook secret for verification | `your_lob_webhook_secret_here` | ✅ |

### File Storage (AWS S3)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AWS_ACCESS_KEY_ID` | AWS access key ID | `AKIAIOSFODNN7EXAMPLE` | ✅ |
| `AWS_SECRET_ACCESS_KEY` | AWS secret access key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` | ✅ |
| `AWS_REGION` | AWS region for S3 bucket | `us-east-1` | ✅ |
| `AWS_S3_BUCKET` | S3 bucket name for file storage | `postmarkr-files` | ✅ |

### Monitoring & Analytics (Sentry)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `SENTRY_DSN` | Sentry DSN for error tracking | `https://your-dsn@sentry.io/project-id` | ✅ |
| `SENTRY_RELEASE` | Application release version | `v1.0.0` | ✅ |
| `SENTRY_SERVER_NAME` | Server identifier for Sentry | `postmarkr-production` | ✅ |

## 🔧 Optional Environment Variables

| Variable | Description | Example | Default |
|----------|-------------|---------|---------|
| `NODE_ENV` | Node.js environment | `production`, `development`, `test` | `development` |
| `PORT` | Server port number | `3000` | `3000` |
| `GOOGLE_ANALYTICS_ID` | Google Analytics tracking ID | `G-XXXXXXXXXX` | - |
| `LOB_TEST_KEY` | Lob test API key (for development) | `test_your_lob_test_api_key_here` | - |

## 🚀 Environment Setup

### Development Environment

For development, create a `.env.server` file in the project root:

```bash
# Core
DATABASE_URL="postgresql://postgres:password@localhost:5432/postmarkr_dev"
JWT_SECRET="your-development-jwt-secret-key-here"
WASP_WEB_CLIENT_URL="http://localhost:3000"
WASP_SERVER_URL="http://localhost:3001"

# Email (optional in dev - uses Dummy provider)
SENDGRID_API_KEY="SG.your_sendgrid_api_key_here"
SENDGRID_FROM_EMAIL="dev@postmarkr.com"
SENDGRID_FROM_NAME="Postmarkr Dev"

# Payment (optional in dev)
STRIPE_SECRET_KEY="sk_test_your_stripe_test_key_here"
STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_test_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret_here"
STRIPE_CUSTOMER_PORTAL_URL="https://billing.stripe.com/p/login/..."

# Mail Service (optional in dev)
LOB_TEST_KEY="test_your_lob_test_api_key_here"
LOB_ENVIRONMENT="test"
LOB_WEBHOOK_SECRET="your_lob_webhook_secret_here"

# File Storage (optional in dev)
AWS_ACCESS_KEY_ID="your_aws_access_key_id"
AWS_SECRET_ACCESS_KEY="your_aws_secret_access_key"
AWS_REGION="us-east-1"
AWS_S3_BUCKET="postmarkr-dev-files"

# Monitoring (optional in dev)
SENTRY_DSN="https://your-dsn@sentry.io/project-id"
SENTRY_RELEASE="dev"
SENTRY_SERVER_NAME="postmarkr-development"

# Optional
NODE_ENV="development"
PORT="3000"
```

### Production Environment

For production, ensure all required variables are set:

```bash
# All variables from the Required section above must be set
# Use production values for all services
# Ensure all API keys are production keys (not test keys)
```

## 🔍 Validation

The application includes comprehensive environment variable validation that:

1. **Validates on startup** - All required variables are checked when the server starts
2. **Type safety** - Variables are validated for correct format and type
3. **Environment-specific** - Different validation rules for development vs production
4. **Clear error messages** - Detailed error messages when validation fails

### Validation Features

- ✅ **Required variable checking** - Ensures all production variables are present
- ✅ **Format validation** - Validates email addresses, URLs, API key formats
- ✅ **Type conversion** - Automatically converts string numbers to numbers
- ✅ **Default values** - Supports default values for optional variables
- ✅ **Environment detection** - Different validation rules per environment

### Error Handling

If validation fails, the server will:
1. Log detailed error messages showing which variables are missing/invalid
2. Exit with code 1 to prevent startup with invalid configuration
3. Provide clear guidance on how to fix the issues

## 🛠️ Troubleshooting

### Common Issues

1. **"Environment variable validation failed"**
   - Check that all required variables are set
   - Verify variable names match exactly (case-sensitive)
   - Ensure values are in the correct format

2. **"Invalid API key format"**
   - Verify API keys start with the correct prefix
   - Check for typos in the key values
   - Ensure you're using the right environment (test vs live)

3. **"Database connection failed"**
   - Verify DATABASE_URL format is correct
   - Check database server is running
   - Ensure database credentials are correct

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=*
```

This will show detailed validation information and service configuration status.

## 📚 Related Documentation

- [Production Environment Setup](PRODUCTION_ENVIRONMENT_SETUP.md)
- [Production Deployment Checklist](PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Lob API Setup](LOB_API_SETUP.md)
- [Wasp Documentation](https://wasp.sh/docs)
