# Production Deployment Health Checks

This system leverages Wasp's built-in health check and validation functionality to ensure safe production deployments.

## Overview

The health check system uses Wasp's existing validation infrastructure:

1. **Pre-deployment checks** (`check:production`) - Uses `productionReadinessCheck.ts`
2. **Post-deployment checks** (`check:health`) - Uses Wasp's built-in `/health` endpoint
3. **Deployment scripts** - Orchestrate checks around `wasp deploy fly deploy`

## Components

### 1. Pre-deployment Checks (Built into Wasp)

**Location:** `src/server/productionReadinessCheck.ts`

Validates environment before deployment:

- ✅ Environment variables validation
- ✅ API key format validation  
- ✅ Security configuration checks
- ✅ Service configuration validation

**Usage:**
```bash
npm run check:production
```

### 2. Runtime Health Checks (Built into Wasp)

**Locations:** 
- `src/server/healthCheck.ts` - Detailed health check logic
- `src/server/healthCheckEndpoint.ts` - Health endpoint handler
- `src/server/startupValidation.ts` - Startup validation

Tests the deployed application:

- ✅ Database connectivity
- ✅ External service configuration
- ✅ Server responsiveness
- ✅ Response time monitoring

**Usage:**
```bash
# Check deployed server health
npm run check:health

# Or directly
curl https://postmarkr-server.fly.dev/health
```

### 3. Automated Deployment (`scripts/deploy-with-health-checks.sh`)

Complete deployment pipeline with integrated health checks:

- ✅ Prerequisites validation
- ✅ Pre-deployment checks
- ✅ Application deployment
- ✅ Post-deployment health checks
- ✅ Deployment status reporting

**Usage:**
```bash
npm run deploy:production
```

## Health Check Categories

### Environment Variables
- Core application variables (NODE_ENV, DATABASE_URL, JWT_SECRET)
- Service URLs (WASP_WEB_CLIENT_URL, WASP_SERVER_URL)
- Port configuration (PORT=8080 for Fly.io)

### Database Connectivity
- Connection establishment
- Query execution tests
- Schema validation
- Response time monitoring

### External Services
- **SendGrid**: Email service API connectivity
- **Stripe**: Payment processing API connectivity  
- **Lob**: Mail service API connectivity
- **AWS S3**: File storage connectivity

### Internal APIs
- Health check endpoints (`/health`, `/health/simple`)
- Address validation API (`/api/validate-address`)
- Webhook health check (`/api/webhooks/health`)

### CORS Configuration
- Preflight request testing
- Header validation
- Cross-origin request verification

## Output Format

The health checks provide detailed output with:

- **Status indicators**: ✅ Pass, ❌ Fail, ⚠️ Warning
- **Response times**: For performance monitoring
- **Critical vs non-critical**: Issues are categorized by severity
- **Detailed error messages**: For debugging failed checks

### Example Output (Pre-deployment)

```
🚀 Production Readiness Check
========================================

✅ Core Environment: All critical variables set
✅ Database: DATABASE_URL configured
✅ Authentication: JWT_SECRET configured
✅ Email Service: SENDGRID_API_KEY configured
✅ Payment Service: Stripe keys configured
⚠️ Optional Service: OpenAI key not set (optional)

Summary:
  ✓ Passed: 18
  ✗ Failed: 0 (0 critical)
  ⚠ Warnings: 2

✅ Production environment is ready for deployment!
```

### Example Output (Post-deployment)

```bash
$ npm run check:health
✅ Server health check passed

$ curl https://postmarkr-server.fly.dev/health
{
  "status": "healthy",
  "timestamp": "2025-10-02T14:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "services": {
    "sendgrid": "configured",
    "stripe": "configured",
    "lob": "configured"
  }
}
```

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Deploy with Health Checks
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm install
      
      - name: Run pre-deployment checks
        run: npm run check:production
        env:
          NODE_ENV: production
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          JWT_SECRET: ${{ secrets.JWT_SECRET }}
          # ... other environment variables
      
      - name: Deploy with health checks
        run: npm run deploy:production
        env:
          # ... all environment variables
```

## Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL format
   - Verify database is accessible from Fly.io
   - Check firewall/security group settings

2. **External Service API Failures**
   - Verify API keys are correct
   - Check API key permissions
   - Verify service status

3. **CORS Configuration Issues**
   - Check WASP_WEB_CLIENT_URL and WASP_SERVER_URL
   - Verify CORS middleware configuration
   - Test preflight requests manually

4. **Internal API Failures**
   - Check server is running on correct port (8080)
   - Verify health check endpoints are accessible
   - Check server logs for startup errors

### Debug Mode

Run health checks with verbose output:

```bash
# Enable debug logging
DEBUG=* npm run check:deployment

# Check specific service
curl -v https://postmarkr-server.fly.dev/health
```

## Monitoring Integration

The health checks integrate with existing monitoring systems:

- **Sentry**: Error tracking and performance monitoring
- **Fly.io Monitoring**: Built-in application monitoring
- **Custom Health Endpoints**: `/health` and `/health/simple`

## Best Practices

1. **Run checks after every deployment**
2. **Set up monitoring alerts** for failed health checks
3. **Monitor response times** for performance degradation
4. **Keep environment variables** in sync between checks and deployment
5. **Test external service connectivity** regularly
6. **Validate CORS configuration** after any URL changes

## Security Considerations

- Health check endpoints may expose system information
- Use authentication for sensitive health check endpoints
- Limit health check frequency to prevent abuse
- Monitor health check access logs

## Future Enhancements

- [ ] Automated rollback on health check failures
- [ ] Performance benchmarking and alerting
- [ ] Integration with more monitoring services
- [ ] Custom health check plugins
- [ ] Health check scheduling and automation
