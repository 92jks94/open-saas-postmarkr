# API Monitoring and Validation System

This document describes the comprehensive API monitoring and validation system implemented for the Postmarkr application.

## 🎯 Overview

The system provides:
- **Environment Variable Validation** with format checking
- **Runtime API Connectivity Tests** for all external services
- **Monitoring Alerts** for missing variables and service issues
- **Comprehensive Health Checks** with detailed status reporting

## 🔧 Components

### 1. Environment Variable Validation (`src/server/envValidation.ts`)

**Enhanced Features:**
- **API Key Format Validation**: Validates that API keys follow correct formats
- **Comprehensive Coverage**: Includes all external services
- **Environment-Specific Rules**: Different validation for development vs production

**Supported Services:**
- **Stripe**: `sk_live_*`, `sk_test_*`, `pk_live_*`, `pk_test_*`, `whsec_*`, `price_*`
- **SendGrid**: `SG.*`
- **Lob**: `live_*`, `test_*`
- **OpenAI**: `sk-*`
- **Google Analytics**: Email format validation
- **AWS S3**: Standard AWS credential validation
- **Sentry**: URL format validation

**Usage:**
```typescript
import { validateEnvironmentOnStartup, getRequiredEnvironmentVariables } from './envValidation';

// Validate on startup
validateEnvironmentOnStartup();

// Get list of required variables
const requiredVars = getRequiredEnvironmentVariables();
```

### 2. Runtime API Connectivity Tests (`src/server/apiConnectivityTests.ts`)

**Features:**
- **Real API Calls**: Tests actual connectivity to external services
- **Response Time Tracking**: Measures API response times
- **Comprehensive Coverage**: Tests all integrated services
- **Graceful Degradation**: Handles missing optional services

**Supported APIs:**
- **Stripe**: Balance retrieval test
- **SendGrid**: Profile API test
- **Lob**: Account API test
- **AWS S3**: List buckets test
- **OpenAI**: Models list test
- **Google Analytics**: Report API test
- **Sentry**: Event capture test

**Usage:**
```typescript
import { runAllConnectivityTests, runCriticalConnectivityTests } from './apiConnectivityTests';

// Run all tests
const results = await runAllConnectivityTests();

// Run only critical tests
const criticalResults = await runCriticalConnectivityTests();
```

### 3. Monitoring Alerts System (`src/server/monitoringAlerts.ts`)

**Features:**
- **Real-time Monitoring**: Continuous monitoring of environment variables and services
- **Alert Levels**: Critical, Warning, and Info levels
- **Multiple Channels**: Console, Webhook, Email, Slack support
- **Cooldown Periods**: Prevents alert spam
- **Alert Management**: Track, resolve, and clear alerts

**Alert Types:**
- **Missing Environment Variables**: Critical alerts for required vars
- **API Connectivity Issues**: Real-time API health monitoring
- **Service Degradation**: Warning alerts for optional services
- **Performance Issues**: Response time monitoring

**Configuration:**
```typescript
const config: AlertConfiguration = {
  enabled: true,
  channels: {
    console: true,
    webhook: process.env.MONITORING_WEBHOOK_URL,
    email: process.env.MONITORING_EMAIL,
    slack: process.env.MONITORING_SLACK_WEBHOOK
  },
  thresholds: {
    critical: 0,
    warning: 1,
    info: 2
  },
  cooldownPeriod: 5 // minutes
};
```

**Usage:**
```typescript
import { alertManager, runMonitoringChecks } from './monitoringAlerts';

// Run comprehensive monitoring
const dashboard = await runMonitoringChecks();

// Get active alerts
const activeAlerts = alertManager.getActiveAlerts();
```

### 4. Enhanced Startup Validation (`src/server/startupValidation.ts`)

**Phases:**
1. **Environment Variable Validation**: Schema-based validation with format checking
2. **Database Connection Validation**: Database connectivity tests
3. **External Service Configuration**: API key format and configuration validation
4. **API Connectivity Tests**: Real API calls (production only)
5. **Monitoring Setup**: Initialize monitoring and run health checks

**Usage:**
```typescript
import { validateServerStartup } from './startupValidation';

// Run comprehensive startup validation
await validateServerStartup();
```

### 5. Enhanced Health Checks (`src/server/healthCheck.ts`)

**Features:**
- **Comprehensive Status**: Environment variables, services, connectivity, monitoring
- **Real-time Data**: Live API connectivity tests
- **Detailed Metrics**: Response times, alert counts, uptime
- **Multiple Endpoints**: Simple and comprehensive health checks

**Response Format:**
```typescript
interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  environment: string;
  version: string;
  services: Record<string, ServiceStatus>;
  environmentVariables: EnvironmentStatus;
  uptime: number;
  connectivity?: ConnectivityStatus;
  monitoring?: MonitoringStatus;
}
```

## 🚀 Implementation

### Environment Variables

**Required Variables:**
```bash
# Core
DATABASE_URL="postgresql://user:pass@host:port/db"
JWT_SECRET="your-super-secret-jwt-key-here"
WASP_WEB_CLIENT_URL="https://postmarkr.com"
WASP_SERVER_URL="https://api.postmarkr.com"

# Email (SendGrid)
SENDGRID_API_KEY="SG.your_sendgrid_api_key_here"
SENDGRID_FROM_EMAIL="noreply@postmarkr.com"
SENDGRID_FROM_NAME="Postmarkr"

# Payment (Stripe)
STRIPE_SECRET_KEY="sk_live_your_stripe_secret_key_here"
STRIPE_PUBLISHABLE_KEY="pk_live_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_stripe_webhook_secret_here"
STRIPE_CUSTOMER_PORTAL_URL="https://billing.stripe.com/p/login/..."

# Page-Based Pricing Plans (Stripe)
PAYMENTS_SMALL_BATCH_PLAN_ID="price_1234567890"
PAYMENTS_MEDIUM_BATCH_PLAN_ID="price_1234567891"
PAYMENTS_LARGE_BATCH_PLAN_ID="price_1234567892"

# Mail (Lob)
LOB_PROD_KEY="live_your_lob_production_api_key_here"
LOB_ENVIRONMENT="live"
LOB_WEBHOOK_SECRET="your_lob_webhook_secret_here"

# File Storage (AWS S3)
AWS_S3_REGION="us-east-1"
AWS_S3_IAM_ACCESS_KEY="your_aws_access_key_id"
AWS_S3_IAM_SECRET_KEY="your_aws_secret_access_key"
AWS_S3_FILES_BUCKET="your-s3-bucket-name"

# Monitoring (Sentry)
SENTRY_DSN="https://your-sentry-dsn@sentry.io/project-id"
SENTRY_RELEASE="v1.0.0"
SENTRY_SERVER_NAME="postmarkr-production"
```

**Optional Variables:**
```bash
# AI Service (OpenAI)
OPENAI_API_KEY="sk-your_openai_api_key_here"

# Analytics (Google Analytics)
GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
GOOGLE_ANALYTICS_CLIENT_EMAIL="analytics@your-domain.com"
GOOGLE_ANALYTICS_PRIVATE_KEY="your_base64_encoded_private_key"
GOOGLE_ANALYTICS_PROPERTY_ID="123456789"


# Monitoring Configuration
MONITORING_WEBHOOK_URL="https://your-webhook-url.com/alerts"
MONITORING_EMAIL="alerts@your-domain.com"
MONITORING_SLACK_WEBHOOK="https://hooks.slack.com/services/..."
```

### Integration Points

**Server Startup:**
```typescript
// In your server setup file
import { validateServerStartup } from './server/startupValidation';

// Call during server initialization
await validateServerStartup();
```

**Health Check Endpoints:**
```typescript
// In your API routes
import { healthCheckEndpoint, simpleHealthCheck } from './server/healthCheck';

// Comprehensive health check
app.get('/health', healthCheckEndpoint);

// Simple health check
app.get('/health/simple', (req, res) => {
  const result = simpleHealthCheck();
  res.json(result);
});
```

**Monitoring Integration:**
```typescript
// In your application code
import { alertManager } from './server/monitoringAlerts';

// Check for alerts
const alerts = alertManager.getActiveAlerts();
if (alerts.length > 0) {
  console.log('Active alerts:', alerts);
}
```

## 📊 Monitoring Dashboard

The system provides a comprehensive monitoring dashboard accessible via the health check endpoints:

**Simple Health Check** (`/health/simple`):
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

**Comprehensive Health Check** (`/health`):
```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "environment": "production",
  "version": "v1.0.0",
  "services": {
    "stripe": { "status": "healthy" },
    "sendgrid": { "status": "healthy" },
    "lob": { "status": "healthy" },
    "aws": { "status": "healthy" },
    "sentry": { "status": "healthy" },
    "openai": { "status": "healthy" },
    "googleAnalytics": { "status": "unknown" }
  },
  "environmentVariables": {
    "required": {
      "DATABASE_URL": { "configured": true },
      "JWT_SECRET": { "configured": true }
    },
    "optional": {
      "OPENAI_API_KEY": { "configured": true, "value": "sk-****" }
    }
  },
  "uptime": 3600,
  "connectivity": {
    "overall": "healthy",
    "tests": [
      {
        "service": "stripe",
        "status": "healthy",
        "responseTime": 150
      }
    ]
  },
  "monitoring": {
    "alerts": 0,
    "criticalAlerts": 0,
    "lastCheck": "2024-01-15T10:30:00.000Z"
  }
}
```

## 🔍 Troubleshooting

### Common Issues

**1. API Key Format Errors:**
```
Error: Stripe secret key must start with sk_live_ or sk_test_
```
**Solution:** Ensure your Stripe keys follow the correct format.

**2. Missing Environment Variables:**
```
Error: Environment variable validation failed:
DATABASE_URL: DATABASE_URL is required
```
**Solution:** Set all required environment variables in your `.env.server` file.

**3. API Connectivity Failures:**
```
Error: Stripe API test failed: Invalid API key
```
**Solution:** Verify your API keys are correct and have proper permissions.

**4. Monitoring Alerts:**
```
🚨 [CRITICAL] Missing Required Environment Variable: STRIPE_SECRET_KEY
```
**Solution:** Configure the missing environment variable or disable the service if optional.

### Debug Mode

Enable debug logging by setting:
```bash
NODE_ENV=development
DEBUG=monitoring:*
```

This will provide detailed logging of all validation and monitoring activities.

## 🎯 Best Practices

1. **Environment-Specific Configuration**: Use different validation rules for development vs production
2. **Graceful Degradation**: Handle missing optional services gracefully
3. **Alert Management**: Set up proper alert channels and cooldown periods
4. **Regular Health Checks**: Monitor your application's health regularly
5. **API Key Security**: Never log or expose API keys in error messages
6. **Monitoring Integration**: Integrate with your existing monitoring infrastructure

## 🔄 Maintenance

**Regular Tasks:**
- Review and update API key formats as services change
- Monitor alert patterns and adjust thresholds
- Clean up old resolved alerts
- Update service configurations as needed

**Monitoring:**
- Set up automated health checks
- Configure alert notifications
- Monitor response times and error rates
- Review and update environment variable requirements

This comprehensive system ensures your application has robust monitoring, validation, and alerting capabilities for all external API integrations.
