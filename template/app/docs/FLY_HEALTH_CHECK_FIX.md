# Fly.io Health Check Fix

## Problem
The Fly.io health check was failing on port 3001 because the server startup validation was blocking the server from responding to health check requests. The validation process (which includes API connectivity tests, database checks, and monitoring setup) was taking longer than the 30-second grace period, causing Fly.io to mark the deployment as unhealthy.

## Root Cause
In `src/server/setup.ts`, the `setupServer()` function was calling `await validateServerStartup()`, which meant:
1. Server initialization was blocked until ALL validation completed
2. Health check endpoints couldn't respond during validation
3. Fly.io health checks timed out before the server was ready

## Solution

### 1. Non-Blocking Startup Validation
Modified `src/server/setup.ts` to run validation asynchronously using `setImmediate()`:
- Server now starts immediately and can respond to health checks
- Validation runs in the background without blocking
- Critical errors are logged but don't crash the running server

```typescript
// Run comprehensive startup validation asynchronously
// This prevents blocking the server from responding to health checks
setImmediate(async () => {
  try {
    await validateServerStartup();
    console.log('✅ Server startup validation completed successfully');
  } catch (error) {
    console.error('❌ Startup validation failed:', error);
    // Don't throw error - server is already running
  }
});

console.log('🚀 Server is ready to accept requests');
```

### 2. Increased Grace Periods
Updated `fly-server.toml` health check configuration:
- Simple health check: 30s → 60s grace period
- Comprehensive health check: 60s → 90s grace period
- This provides extra buffer for slower startup scenarios

## Deployment Instructions

### Step 1: Rebuild and Deploy
```bash
# Build the Wasp app
wasp build

# Deploy the server
cd .wasp/build
flyctl deploy --config ../../fly-server.toml --app postmarkr-server-server

# Deploy the client
flyctl deploy --config ../../fly-client.toml --app postmarkr-server-client
```

### Step 2: Monitor Deployment
```bash
# Watch the logs for the server
flyctl logs --app postmarkr-server-server

# Check health status
flyctl status --app postmarkr-server-server
```

### Step 3: Verify Health Checks
You should see:
1. "🚀 Server is ready to accept requests" appears immediately
2. Validation phases complete in the background
3. Health checks pass successfully
4. No more "health check failed" errors

### Expected Log Output
```
🚀 Server is ready to accept requests
📋 Phase 1: Environment variable validation...
🗄️ Phase 2: Database connection validation...
🔗 Phase 3: External service configuration validation...
🧪 Phase 4: API connectivity tests...
📊 Phase 5: Monitoring setup and health check...
🎨 Phase 6: Displaying startup information...
✅ Server startup validation completed successfully
```

## Testing Locally

Before deploying, test locally:
```bash
# Start the development server
wasp start

# In another terminal, test the health endpoint
curl http://localhost:3001/health/simple

# Expected response:
# {"status":"ok","timestamp":"2025-10-07T..."}
```

## Troubleshooting

### If health checks still fail:
1. **Check server logs**: `flyctl logs --app postmarkr-server-server`
2. **Verify environment variables**: Especially `DATABASE_URL` and `JWT_SECRET`
3. **Check database connectivity**: Ensure your Fly Postgres is running
4. **Increase grace period further**: Edit `fly-server.toml` if needed

### If validation fails in background:
- Check the server logs for specific error messages
- Validation failures won't crash the server, but may indicate configuration issues
- Address issues one by one based on log output

## Additional Improvements

### Optional: Add a startup ready flag
If you want to distinguish between "server started" and "validation complete", you can add a flag:

```typescript
// In src/server/setup.ts
let isValidationComplete = false;

export function isServerFullyReady(): boolean {
  return isValidationComplete;
}
```

### Optional: Skip certain checks in production
If some validation steps are too slow, you can skip them in production:

```typescript
// In src/server/startupValidation.ts
if (!process.env.SKIP_CONNECTIVITY_TESTS) {
  await validateApiConnectivity();
}
```

## Related Files
- `src/server/setup.ts` - Server initialization
- `src/server/startupValidation.ts` - Validation logic
- `src/server/healthCheckEndpoint.ts` - Health check handlers
- `src/server/healthCheck.ts` - Health check implementation
- `fly-server.toml` - Fly.io server configuration
- `fly-client.toml` - Fly.io client configuration

## References
- [Fly.io Health Checks Documentation](https://fly.io/docs/reference/configuration/#services-http_checks)
- [Wasp Server Setup Documentation](https://wasp.sh/docs)

