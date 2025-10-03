# WSL2 Deployment Issues - Diagnosis & Solutions

## Problem Summary

Your deployment failures are caused by **two separate issues**:

### 1. WSL2 Network Instability (Primary Issue)
**Symptom:** `read tcp ... read: connection reset by peer`

**Root Cause:** WSL2 uses a virtualized network adapter (NAT) that can experience:
- TCP connection timeouts when talking to external APIs
- Connection resets during long-running operations
- DNS resolution delays

**Evidence from your logs:**
```
Error: failed to list app secrets: Get "https://api.machines.dev/v1/apps/postmarkr-server/secrets": 
read tcp 172.31.115.75:36592->137.66.34.115:443: read: connection reset by peer
```

### 2. Server Binding Configuration (Secondary Issue)
**Symptom:** Warning that app not listening on `0.0.0.0:8080`

**Root Cause:** Wasp's generated server needs to bind to `0.0.0.0` for Fly.io, but defaults to `localhost`

**Evidence from your logs:**
```
WARNING The app is not listening on the expected address and will not be reachable by fly-proxy.
You can fix this by configuring your app to listen on the following addresses:
  - 0.0.0.0:8080
```

## Solutions

### ✅ Solution 1: Fix Server Binding (DONE)

**Status:** Already applied in this session

We added `SERVER_HOST = "0.0.0.0"` to `fly-server.toml`:
```toml
[env]
  PORT = "8080"
  NODE_ENV = "production"
  SERVER_HOST = "0.0.0.0"
```

This ensures your Wasp server binds to all interfaces on Fly.io.

### ✅ Solution 2A: Use Detached Deployment (Recommended)

**Why:** Avoids keeping a long-running connection open through WSL2's network layer.

**How:** Run the new script:
```bash
bash deploy-wsl-fix.sh
```

This script:
- Optimizes TCP keepalive settings for WSL2
- Uses `--detach` flag to avoid timeout issues
- Sets longer API timeouts
- Includes retry logic

### ✅ Solution 2B: Deploy from Windows (Alternative)

If WSL2 issues persist, deploy directly from Windows PowerShell:

1. Install flyctl for Windows: https://fly.io/docs/hands-on/install-flyctl/
2. Run from PowerShell (not WSL):
   ```powershell
   cd "\\wsl.localhost\Ubuntu\home\nathah\Projects\open-saas-postmarkr\template\app"
   wasp build
   cd .wasp\build
   flyctl deploy --config ..\..\fly-server.toml --verbose
   ```

### ✅ Solution 2C: Use GitHub Actions (Best for Production)

You already have `.github/workflows/deploy.yml` configured!

**Advantages:**
- No WSL2 networking issues
- Reliable, repeatable deployments
- No local network dependencies

**To use:**
1. Ensure all secrets are set in GitHub repo settings
2. Push to your deployment branch
3. Let GitHub Actions handle deployment

Check: `docs/GITHUB_ACTIONS_DEPLOYMENT_SETUP.md`

## Immediate Next Steps

### Option 1: Try the WSL2-optimized script (Fastest)
```bash
bash deploy-wsl-fix.sh
```

### Option 2: Use GitHub Actions (Most Reliable)
```bash
git add .
git commit -m "Fix server binding for Fly.io deployment"
git push origin saas-template-nathan-now-postmarkr
```

Then monitor deployment in GitHub Actions tab.

## Verifying the Fix

After deployment, verify your server is accessible:

```bash
# Check if server is responding
curl -f https://postmarkr-server.fly.dev/health/simple

# Check deployment status
flyctl status --app postmarkr-server

# View logs
flyctl logs --app postmarkr-server
```

## Why Your Original Script Failed

Your `deploy-with-network-resilience.sh` script had the right idea but:

1. **Patch timing issue:** Patched `.wasp/build/server/src/server.ts` but Wasp regenerates this file, potentially undoing the patch
2. **WSL2 networking:** Retry logic couldn't overcome fundamental WSL2 network instability
3. **Wasp deploy command:** Used `wasp deploy fly deploy` which doesn't support `--detach` flag

The new approach:
- Fixes binding at the config level (environment variable)
- Uses `flyctl deploy --detach` directly
- Optimizes TCP settings for WSL2

## Additional WSL2 Network Troubleshooting

If issues persist, try these WSL2 network fixes:

### Reset WSL2 Network (Windows PowerShell as Admin)
```powershell
wsl --shutdown
netsh winsock reset
netsh int ip reset
ipconfig /release
ipconfig /renew
ipconfig /flushdns
```

Then restart WSL2.

### Configure WSL2 Network Mode (Advanced)

Create/edit `/etc/wsl.conf` in WSL2:
```ini
[network]
generateHosts = true
generateResolvConf = true
```

Then in Windows PowerShell:
```powershell
wsl --shutdown
wsl
```

## Long-term Recommendation

For production deployments:
1. ✅ Use GitHub Actions (most reliable)
2. ✅ Keep fly-server.toml with SERVER_HOST set
3. ✅ Use `flyctl deploy --detach` from WSL2 for quick tests
4. ❌ Avoid `wasp deploy fly deploy` from WSL2 (known issues)

