# Deployment and Utility Scripts

This directory contains scripts for deploying and managing the Postmarkr application.

## Production Readiness Check

### `production-readiness-check.sh`

Validates that all production requirements are met before deployment.

**Usage**:
```bash
# Basic check (loads .env.server if present)
./scripts/production-readiness-check.sh

# Check with custom API URLs
API_URL=https://your-api.com CLIENT_URL=https://your-client.com ./scripts/production-readiness-check.sh
```

**What it checks**:
- ✅ Required tools (curl, jq, flyctl)
- ✅ Environment variables (all required and optional)
- ✅ API key format validation
- ✅ Fly.io configuration files
- ✅ Health check endpoints (if deployed)
- ✅ Webhook monitoring endpoints
- ✅ Database configuration
- ✅ Fly.io app status

**Exit codes**:
- `0`: All checks passed (or only warnings)
- `1`: One or more checks failed

**Example output**:
```
================================================
  Production Readiness Check for Postmarkr
================================================

Checking Required Tools...
✓ curl is installed
✓ jq is installed
✓ flyctl is installed

Checking Environment Variables...
✓ DATABASE_URL is set (post...)
✓ JWT_SECRET is set (your...)
✓ WASP_SERVER_URL is set: https://api.postmarkr.com
...

================================================
  Summary
================================================
Passed:   42
Failed:   0
Warnings: 3

✓ All checks passed! Ready for production deployment.
```

## Deployment Scripts

### `deploy-with-health-checks.sh`

Deploys the application with automated health check verification.

**Usage**:
```bash
./scripts/deploy-with-health-checks.sh
```

### `deploy-with-server-fix.sh`

Deploys the application with automatic server binding fix for Fly.io compatibility.

**Usage**:
```bash
./scripts/deploy-with-server-fix.sh
# or
npm run deploy:fixed
```

**What it does**:
- ✅ Applies server binding patch (0.0.0.0:8080) for Fly.io compatibility
- ✅ Deploys using correct `wasp deploy fly deploy` command
- ✅ Includes retry logic for network issues
- ✅ Runs comprehensive health checks
- ✅ Provides detailed status reporting

**When to use**:
- Production deployments to Fly.io
- When experiencing server binding issues
- For reliable, automated deployments

### `deploy-with-retry.sh`

Deploys with automatic retry on failure.

**Usage**:
```bash
./scripts/deploy-with-retry.sh
```

### `wasp-deploy-with-checks.sh`

Wasp-specific deployment with comprehensive checks.

**Usage**:
```bash
./scripts/wasp-deploy-with-checks.sh
```

## Utility Scripts

### `configure-s3-cors.js`

Configures CORS policy for AWS S3 bucket.

**Usage**:
```bash
node scripts/configure-s3-cors.js
```

### `sync-env-secrets.sh`

Syncs environment variables to Fly.io secrets.

**Usage**:
```bash
./scripts/sync-env-secrets.sh
```

## Monitoring Scripts

### `monitor-health.sh` (Example)

Continuously monitors health check endpoints.

**Usage**:
```bash
./scripts/monitor-health.sh
```

**Example implementation**:
```bash
#!/bin/bash
API_URL="https://api.postmarkr.com"
SLACK_WEBHOOK="$MONITORING_SLACK_WEBHOOK"

while true; do
  response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health/simple")
  
  if [ "$response" != "200" ]; then
    curl -X POST "$SLACK_WEBHOOK" \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"🚨 API Health Check Failed: HTTP $response\"}"
  fi
  
  sleep 300 # Check every 5 minutes
done
```

### `webhook-report.sh` (Example)

Generates webhook metrics report.

**Usage**:
```bash
./scripts/webhook-report.sh
```

**Example implementation**:
```bash
#!/bin/bash
API_URL="https://api.postmarkr.com"

echo "Webhook Metrics Report"
echo "====================="
curl -s "$API_URL/api/webhooks/metrics" | jq '.metrics'
```

## Pre-Deployment Workflow

1. **Validate Environment**:
   ```bash
   ./scripts/production-readiness-check.sh
   ```

2. **Review Checklist**:
   - See [docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md](../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)

3. **Deploy**:
   ```bash
   ./scripts/deploy-with-health-checks.sh
   ```

4. **Verify**:
   ```bash
   # Check health
   curl https://api.postmarkr.com/health/simple
   
   # Check webhooks
   curl https://api.postmarkr.com/api/webhooks/health | jq
   ```

## Troubleshooting

### Script Permission Denied

```bash
chmod +x scripts/*.sh
```

### Environment Variables Not Loading

Ensure `.env.server` exists in project root:
```bash
cp .env.server.example .env.server
# Edit .env.server with your values
```

### jq Not Found

Install jq:
```bash
# Ubuntu/Debian
sudo apt-get install jq

# macOS
brew install jq

# Windows (WSL)
sudo apt-get install jq
```

### flyctl Not Found

Install Fly.io CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

## Best Practices

1. **Always run production readiness check before deployment**
2. **Test scripts in staging environment first**
3. **Keep backup of environment variables secure**
4. **Monitor logs during and after deployment**
5. **Have rollback plan ready**
6. **Document any script modifications**

## Adding New Scripts

When adding new scripts:

1. Place in `scripts/` directory
2. Make executable: `chmod +x scripts/your-script.sh`
3. Add documentation to this README
4. Include error handling and logging
5. Test thoroughly in staging

## Related Documentation

- [Production Deployment Summary](../docs/PRODUCTION_DEPLOYMENT_SUMMARY.md)
- [Production Deployment Checklist](../docs/PRODUCTION_DEPLOYMENT_CHECKLIST.md)
- [Monitoring and Alerting Setup](../docs/MONITORING_AND_ALERTING_SETUP.md)

---

**Last Updated**: October 2, 2025

