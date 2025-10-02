# Deployment Quick Start

## Quick Reference

### One-Line Deployment
```bash
npm run deploy:production
```
This runs pre-checks, deploys, and verifies health automatically.

## Step-by-Step Deployment

### 1. Sync Environment Variables to Fly.io
```bash
npm run sync:secrets
```
- Reads `.env.server`
- Sets all variables as Fly.io secrets
- Only needs to be done when environment variables change

### 2. Pre-deployment Check (Optional but Recommended)
```bash
npm run check:production
```
- Validates environment variables
- Checks API key formats
- Verifies service configuration
- **Run this locally before deploying**

### 3. Deploy
```bash
# Option A: Full deployment with checks
npm run deploy:production

# Option B: Just Wasp deploy with checks
npm run deploy:wasp

# Option C: Standard Wasp deploy (no checks)
wasp deploy fly deploy
```

### 4. Verify Deployment
```bash
# Quick health check
npm run check:health

# Detailed health check
curl https://postmarkr-server.fly.dev/health | jq

# Check server logs
flyctl logs --app postmarkr-server

# Check client
curl -I https://postmarkr-client.fly.dev
```

## Environment Variables Required

### Critical (Must be set)
- `NODE_ENV=production`
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Authentication secret
- `WASP_WEB_CLIENT_URL=https://postmarkr-client.fly.dev`
- `WASP_SERVER_URL=https://postmarkr-server.fly.dev`
- `PORT=8080`

### Services (Required for features to work)
- `SENDGRID_API_KEY` - Email sending (Wasp uses this directly)
- `STRIPE_SECRET_KEY` - Payment processing
- `STRIPE_WEBHOOK_SECRET` - Stripe webhooks
- `LOB_TEST_KEY` or `LOB_PROD_KEY` - Mail service
- `AWS_ACCESS_KEY_ID` - File storage
- `AWS_SECRET_ACCESS_KEY` - File storage
- `AWS_S3_FILES_BUCKET` - S3 bucket name
- `AWS_S3_REGION` - S3 region

### Optional
- `SENTRY_DSN` - Error tracking
- `SENTRY_RELEASE` - Release version
- `OPENAI_API_KEY` - AI features
- `GOOGLE_ANALYTICS_CLIENT_EMAIL` - Analytics
- `GOOGLE_ANALYTICS_PRIVATE_KEY` - Analytics

## Common Issues

### Issue: Server not starting after deployment
**Symptoms:** CORS errors, 502 Bad Gateway, connection refused

**Check:**
```bash
# View server logs
flyctl logs --app postmarkr-server

# Common causes:
# - Missing environment variables
# - Database connection issues
# - Port configuration (must be 8080)
```

**Fix:**
```bash
# Verify all secrets are set
flyctl secrets list --app postmarkr-server

# Set missing secrets
flyctl secrets set KEY=value --app postmarkr-server

# Restart server
flyctl machine restart --app postmarkr-server
```

### Issue: Email verification not working
**Symptoms:** Users don't receive verification emails

**Check:**
```bash
# Verify SendGrid configuration
flyctl secrets list --app postmarkr-server | grep SENDGRID

# Check server logs for email sending
flyctl logs --app postmarkr-server | grep -i email
```

**Fix:**
```bash
# Make sure using SendGrid provider in main.wasp
# emailSender: { provider: SendGrid, ... }

# Set SendGrid API key
flyctl secrets set SENDGRID_API_KEY="your-key" --app postmarkr-server

# Verify sender email matches SendGrid verified sender
# Check main.wasp: defaultFrom: { email: "..." }
```

### Issue: Database connection failed
**Symptoms:** Server crashes on startup, database errors in logs

**Check:**
```bash
# Test database connection
flyctl postgres connect -a postmarkr-db

# Check DATABASE_URL secret
flyctl secrets list --app postmarkr-server | grep DATABASE
```

**Fix:**
```bash
# Get correct DATABASE_URL
flyctl postgres info -a postmarkr-db

# Set DATABASE_URL
flyctl secrets set DATABASE_URL="postgres://..." --app postmarkr-server
```

## Deployment Scripts Explained

### `npm run sync:secrets`
**Script:** `scripts/sync-env-secrets.sh`
- Reads `.env.server` line by line
- Sets each variable as a Fly.io secret
- Skips placeholders and test values
- Triggers machine restart automatically

### `npm run deploy:production`
**Script:** `scripts/deploy-with-health-checks.sh`
1. Validates prerequisites (flyctl, wasp)
2. Runs pre-deployment checks
3. Deploys client and server
4. Waits for deployment to stabilize
5. Runs post-deployment health checks
6. Reports final status

### `npm run deploy:wasp`
**Script:** `scripts/wasp-deploy-with-checks.sh`
1. Runs pre-deployment checks
2. Runs `wasp deploy fly deploy`
3. Waits for deployment
4. Verifies server health
5. Reports status

## Health Check Endpoints

### `/health` - Detailed Health Check
```bash
curl https://postmarkr-server.fly.dev/health
```

Returns:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-02T14:00:00.000Z",
  "uptime": 3600,
  "database": "connected",
  "services": {
    "sendgrid": "configured",
    "stripe": "configured",
    "lob": "configured",
    "aws": "configured"
  }
}
```

### Simple Check
```bash
# Just check if server responds
curl -I https://postmarkr-server.fly.dev
```

## Monitoring

### View Logs
```bash
# Server logs
flyctl logs --app postmarkr-server

# Client logs
flyctl logs --app postmarkr-client

# Database logs
flyctl logs --app postmarkr-db

# Follow logs in real-time
flyctl logs --app postmarkr-server -f
```

### Check Machine Status
```bash
# List machines
flyctl machine list --app postmarkr-server

# Machine details
flyctl machine status <machine-id> --app postmarkr-server

# Restart machine
flyctl machine restart <machine-id> --app postmarkr-server
```

### Check Secrets
```bash
# List all secrets
flyctl secrets list --app postmarkr-server

# Unset a secret
flyctl secrets unset KEY --app postmarkr-server

# Set multiple secrets at once
flyctl secrets set KEY1=val1 KEY2=val2 --app postmarkr-server
```

## Best Practices

1. **Always run pre-deployment checks** before deploying
2. **Keep `.env.server` up to date** - it's your source of truth
3. **Use `sync:secrets`** after updating environment variables
4. **Monitor health checks** after deployment
5. **Check logs** if anything goes wrong
6. **Test locally first** with `wasp start`
7. **Keep secrets secure** - never commit `.env.server`

## Emergency Rollback

If deployment fails:

```bash
# Check previous deployments
flyctl releases --app postmarkr-server

# Rollback to previous version
flyctl releases rollback <release-id> --app postmarkr-server

# Or restart current deployment
flyctl machine restart --app postmarkr-server
```

## Support Resources

- Wasp Docs: https://wasp.sh/docs
- Fly.io Docs: https://fly.io/docs
- Project Issues: Check `docs/TODO.md`
- Health Checks: See `docs/DEPLOYMENT_HEALTH_CHECKS.md`

