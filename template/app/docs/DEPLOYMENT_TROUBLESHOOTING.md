# Deployment Troubleshooting Guide

This guide helps resolve common deployment issues with Postmarkr on Fly.io.

## 🚨 **Common Issues and Solutions**

### **Server Not Accessible (Connection Reset)**

**Symptoms**:
```
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:8080
```

**Root Cause**: Server is binding to `localhost` instead of `0.0.0.0`

**Solution**:
```bash
# Use the fixed deployment script
npm run deploy:fixed

# Or manually apply the patch
./scripts/patch-server-binding.sh
wasp deploy fly
```

### **Deployment Command Errors**

**Symptoms**:
```
Error: unknown command "fly deploy" for "wasp deploy"
```

**Root Cause**: Using incorrect deployment command

**Solution**:
```bash
# Correct command
wasp deploy fly deploy

# NOT
wasp deploy fly
```

### **Network Connection Issues During Deployment**

**Symptoms**:
```
✖ [1/2] failed to update VM: read tcp: connection reset by peer
```

**Root Cause**: Transient network issues during Docker build/push

**Solution**:
```bash
# Use retry script
npm run deploy:retry

# Or wait and retry manually
sleep 30
wasp deploy fly
```

### **Health Check Failures**

**Symptoms**:
```
❌ Server health check failed
❌ Client health check failed
```

**Root Cause**: Services still starting up or configuration issues

**Solution**:
```bash
# Wait for services to stabilize
sleep 60

# Check manually
curl https://postmarkr-server.fly.dev/health/simple
curl https://postmarkr-client.fly.dev/

# Check Fly.io logs
flyctl logs -a postmarkr-server
flyctl logs -a postmarkr-client
```

## 🔧 **Deployment Scripts Reference**

### **Available Scripts**:

1. **`npm run deploy:fixed`** - Recommended for production
   - Applies server binding fix
   - Uses correct Wasp commands
   - Includes retry logic and health checks

2. **`npm run deploy:retry`** - For network issues
   - Automatic retry on failure
   - Good for unstable connections

3. **`npm run deploy:production`** - Standard deployment
   - Basic health checks
   - Good for stable environments

4. **`npm run deploy:simple`** - Minimal deployment
   - No retry logic
   - Fastest option

### **Manual Commands**:

```bash
# Build and deploy
wasp build
wasp deploy fly deploy

# Apply server fix manually
./scripts/patch-server-binding.sh

# Check deployment status
flyctl status -a postmarkr-server
flyctl status -a postmarkr-client
```

## 📊 **Monitoring and Debugging**

### **Check Deployment Status**:
```bash
# Server status
flyctl status -a postmarkr-server

# Client status  
flyctl status -a postmarkr-client

# View logs
flyctl logs -a postmarkr-server
flyctl logs -a postmarkr-client
```

### **Health Check Endpoints**:
```bash
# Server health
curl https://postmarkr-server.fly.dev/health/simple

# Client accessibility
curl https://postmarkr-client.fly.dev/

# Detailed health check
curl https://postmarkr-server.fly.dev/health
```

### **Environment Variables**:
```bash
# Check server secrets
flyctl secrets list -a postmarkr-server

# Check client secrets
flyctl secrets list -a postmarkr-client
```

## 🚀 **Best Practices**

1. **Always use `npm run deploy:fixed`** for production deployments
2. **Test locally first** with `wasp start` before deploying
3. **Check environment variables** are set correctly
4. **Monitor logs** during and after deployment
5. **Run health checks** after deployment
6. **Have a rollback plan** ready

## 🆘 **Getting Help**

If you're still experiencing issues:

1. **Check the logs**: `flyctl logs -a postmarkr-server`
2. **Verify environment**: `flyctl secrets list -a postmarkr-server`
3. **Test locally**: `wasp start` and verify everything works
4. **Check Fly.io status**: Visit [status.fly.io](https://status.fly.io)
5. **Review this guide**: Look for similar symptoms above

---

**Last Updated**: October 2, 2025
