# Deployment Scripts

This directory contains essential deployment scripts for the Postmarkr application.

## Available Scripts

### `deploy.sh` - Production Deployment
Comprehensive deployment script with health checks and retry logic.

**Usage**:
```bash
./scripts/deploy.sh
```

**Features**:
- ✅ Prerequisites checking (wasp, flyctl, npm)
- ✅ Pre-deployment production checks
- ✅ Automatic retry logic (3 attempts with exponential backoff)
- ✅ Post-deployment health checks
- ✅ Server and client endpoint verification
- ✅ Deployment summary with URLs

### `deploy-quick.sh` - Quick Deployment
Simple deployment script with retry logic for quick updates.

**Usage**:
```bash
./scripts/deploy-quick.sh
```

**Features**:
- ✅ Basic retry logic (3 attempts)
- ✅ Minimal checks for faster deployment
- ✅ No health checks (for quick iterations)

## Other Scripts

### `production-readiness-check.sh`
Validates production requirements before deployment.

**Usage**:
```bash
./scripts/production-readiness-check.sh
```

### `sync-env-secrets.sh`
Synchronizes environment variables with Fly.io secrets.

**Usage**:
```bash
./scripts/sync-env-secrets.sh
```

## Deployment URLs

After successful deployment:
- **Client**: https://postmarkr-client.fly.dev
- **Server**: https://postmarkr-server.fly.dev
- **Health Check**: https://postmarkr-server.fly.dev/health
- **Monitoring**: https://fly.io/apps/postmarkr-server/monitoring