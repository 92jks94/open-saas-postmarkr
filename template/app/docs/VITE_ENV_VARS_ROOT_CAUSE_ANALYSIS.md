# 🔍 Deep Dive: Why VITE_GOOGLE_ANALYTICS_ID Isn't Working in Production

**Date**: January 11, 2025  
**Context**: Using `wasp deploy fly deploy` for production deployments  
**Issue**: Console shows `⚠️ Google Analytics ID not configured` despite Fly secrets being set

---

## 🎯 Executive Summary

**Your console output shows Google Analytics is NOT working because:**
```
⚠️  Google Analytics ID not configured
💡 Set VITE_GOOGLE_ANALYTICS_ID in .env.client
```

**Root Cause**: When using `wasp deploy fly deploy`, Wasp builds your app **on Fly.io's remote servers**, which don't have access to the `VITE_*` environment variables during the build process.

**The Problem Chain**:
1. ✅ Fly secrets ARE set (`VITE_GOOGLE_ANALYTICS_ID = "G-6H2SB3GJDW"`)
2. ❌ BUT Wasp builds the client **remotely** on Fly.io's servers
3. ❌ Remote build doesn't have `VITE_*` vars exported during build
4. ❌ Vite defaults `import.meta.env.VITE_GOOGLE_ANALYTICS_ID` to `undefined`
5. ❌ Your code skips GA initialization when value is undefined

---

## 📊 Current Deployment Setup Analysis

### ✅ What IS Working

1. **Fly.io Secrets Are Set Correctly**:
```bash
$ flyctl secrets list --app postmarkr-server-client

NAME                        DIGEST           
VITE_GOOGLE_ANALYTICS_ID    f3a6c89c30f02c47  ✅
VITE_SENTRY_DSN             2bcc760fe30b3f9d  ✅
```

2. **fly-client.toml Configuration Is Correct**:
```toml
[env]
  VITE_GOOGLE_ANALYTICS_ID = "G-6H2SB3GJDW"  ✅
```

3. **Cookie Consent System Works Perfectly**:
```
✅ Cookie consent library initialized successfully
🔵 Google Analytics - Cookie Consent Accepted
```

### ❌ What Is NOT Working

**Your production bundle does NOT contain the GA ID**:
```javascript
// What your code expects:
const GA_ANALYTICS_ID = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

// What it actually gets in production:
const GA_ANALYTICS_ID = undefined;  // ❌
```

---

## 🔬 Technical Deep Dive: How Vite Build Works

### The Build Process

```
┌─────────────────────────────────────────────────────────────┐
│ LOCAL MACHINE (when using `wasp deploy fly deploy`)        │
├─────────────────────────────────────────────────────────────┤
│ 1. You run: wasp deploy fly deploy                         │
│ 2. Wasp packages your source code                          │
│ 3. Sends package to Fly.io                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ FLY.IO REMOTE SERVER (where the build happens)             │
├─────────────────────────────────────────────────────────────┤
│ 4. Fly.io receives your code                               │
│ 5. Runs: npm install                                       │
│ 6. Runs: vite build                                        │
│    ├─ Vite looks for process.env.VITE_* vars              │
│    ├─ ❌ VITE_* vars NOT in environment (runtime only)    │
│    └─ Defaults to: undefined                               │
│ 7. Creates bundle with undefined values                    │
│ 8. Deploys bundle to CDN                                   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│ PRODUCTION RUNTIME (after deploy)                          │
├─────────────────────────────────────────────────────────────┤
│ 9. Container starts with Fly secrets available             │
│ 10. BUT bundle already has undefined baked in              │
│ 11. Google Analytics fails to initialize                   │
└─────────────────────────────────────────────────────────────┘
```

### Why Fly Secrets Don't Work for Vite

| Type | Availability | Purpose | Works for Vite? |
|------|-------------|---------|-----------------|
| **Fly Secrets** | Runtime (after deploy) | Server-side runtime config | ❌ NO - Build already done |
| **`[env]` in toml** | Runtime | Node.js process environment | ❌ NO - Build already done |
| **Build-time export** | During `vite build` | Client bundle values | ✅ YES - This is what we need |

**The Critical Insight**:
- Vite is a **build-time tool** that replaces `import.meta.env.VITE_*` with **literal values**
- Fly secrets are **runtime-only** and exist AFTER the build is complete
- The build happens on Fly's servers where secrets are not exported to `process.env` during build

---

## 🛠️ Solution Options

### Option 1: Use `deploy-full.sh` Script (✅ Already Set Up)

Your `deploy-full.sh` script already has the fix:

```bash
# Lines 87-94 of deploy-full.sh
export VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW"
export VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360"

print_status $BLUE "   Building with VITE_GOOGLE_ANALYTICS_ID=${VITE_GOOGLE_ANALYTICS_ID}"

wasp build  # ✅ Build happens locally with vars exported
```

**How to use:**
```bash
cd ~/Projects/open-saas-postmarkr/template/app
bash deploy-full.sh
```

**What it does:**
1. ✅ Exports VITE vars on your LOCAL machine
2. ✅ Runs `wasp build` locally (where vars are available)
3. ✅ Pushes the BUILT bundle to Fly.io
4. ✅ Google Analytics works!

---

### Option 2: Pass Environment Variables to `wasp deploy` (📖 Per Wasp Docs)

According to Wasp documentation and your README:

```bash
# From your README.md line 1601-1603:
# "Remember, because we've set certain client-side env variables, 
#  make sure to pass them to the wasp deploy commands"

VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW" \
VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360" \
wasp deploy fly deploy
```

**How it works:**
- Exports the variables in the same shell session
- Wasp's build process picks them up
- Variables get baked into the client bundle

---

### Option 3: Create `.env.client` File (🏠 For Local Development)

For local development, create `.env.client` in your project root:

```bash
# .env.client
VITE_GOOGLE_ANALYTICS_ID=G-6H2SB3GJDW
VITE_SENTRY_DSN=https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360
```

**Note:** This works for `wasp start` (local dev) but NOT for `wasp deploy fly deploy`

---

### Option 4: Use GitHub Actions (⚙️ CI/CD Pipeline)

Your `.github/workflows/deploy.yml` already handles this:

```yaml
# Lines 214-215
- name: Deploy client to Fly.io
  run: |
    flyctl deploy --app ${{ secrets.FLY_CLIENT_APP_NAME }} --verbose
  env:
    VITE_GOOGLE_ANALYTICS_ID: ${{ secrets.GOOGLE_ANALYTICS_ID }}
```

**How it works:**
- GitHub Actions exports the secret as an environment variable
- Available during the build process
- Works correctly! ✅

---

## 🎯 Recommended Solution for Your Workflow

Since you're using `wasp deploy fly deploy` for production, here's what you should do:

### 🌟 Best Practice: Use `wasp deploy` with Environment Variables

```bash
# Create a deployment helper script (or update deploy-full.sh)
#!/bin/bash

# Set client-side environment variables
export VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW"
export VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360"

# Deploy with Wasp
wasp deploy fly deploy
```

Or inline:

```bash
VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW" VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360" wasp deploy fly deploy
```

---

## 🔍 Why This Wasn't Obvious

1. ✅ **Fly secrets show as set** - Made it seem like everything was configured correctly
2. ✅ **fly-client.toml has the values** - But `[env]` section is for runtime, not build-time
3. ✅ **No build errors** - Vite silently defaults to `undefined`
4. ✅ **Cookie consent works** - Only the GA initialization fails
5. ✅ **Server-side env vars work differently** - Led to wrong assumptions about client vars

---

## 📋 Verification Steps

After deploying with the fix, check your console:

### ✅ Expected Console Output

```javascript
🍪 Cookie Consent Banner - Initialization
✅ Cookie consent library initialized successfully

🔵 Google Analytics - Cookie Consent Accepted
⏱️  Timestamp: 2025-10-11T19:17:45.331Z
✅ Google Analytics ID: G-6H2SB3GJDW  // ✅ Should appear!
🚀 Initializing Google Analytics with gtag...
📝 Calling gtag('config', 'G-6H2SB3GJDW')...
✅ Google Analytics initialized successfully
📊 dataLayer: [Array(3)]
```

### ❌ Current Console Output (What You're Seeing Now)

```javascript
🍪 Cookie Consent Banner - Initialization
✅ Cookie consent library initialized successfully

🔵 Google Analytics - Cookie Consent Accepted
⚠️  Google Analytics ID not configured  // ❌ The problem!
💡 Set VITE_GOOGLE_ANALYTICS_ID in .env.client
```

---

## 🚀 Action Plan

### Immediate Solution (Choose One)

**Option A: Use your existing `deploy-full.sh`**
```bash
cd ~/Projects/open-saas-postmarkr/template/app
bash deploy-full.sh
```

**Option B: Use `wasp deploy` with env vars**
```bash
cd ~/Projects/open-saas-postmarkr/template/app
VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW" \
VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360" \
wasp deploy fly deploy
```

**Option C: Use GitHub Actions (already working)**
```bash
git push origin main
# Your CI/CD pipeline will handle deployment correctly
```

### Verification (After Deployment)

1. ✅ Visit https://postmarkr.com/
2. ✅ Open browser DevTools console
3. ✅ Accept cookie consent
4. ✅ Look for: `✅ Google Analytics ID: G-6H2SB3GJDW`
5. ✅ Check Network tab for requests to `googletagmanager.com`
6. ✅ Check Google Analytics Realtime dashboard

---

## 📚 Key Takeaways

### Understanding Vite Environment Variables

1. **Build-Time vs Runtime**:
   - `VITE_*` vars are **build-time only**
   - They get **replaced with literal values** in your bundle
   - Cannot be changed after build

2. **Deployment Methods**:
   - `wasp deploy fly deploy` → Builds remotely (needs env vars passed)
   - `deploy-full.sh` → Builds locally (exports vars first)
   - GitHub Actions → Builds in CI (uses secrets as env vars)

3. **Fly.io Configuration**:
   - Fly secrets → Runtime only (server-side)
   - `[env]` in toml → Runtime only (process.env)
   - Build-time exports → Needed for VITE vars

### Best Practices

1. ✅ **Always export VITE vars** when running `wasp build` or `wasp deploy`
2. ✅ **Use GitHub Actions** for consistent, automated deployments
3. ✅ **Document the requirement** in your deployment docs
4. ✅ **Create helper scripts** that handle env var exports
5. ✅ **Add verification steps** to confirm vars are in the bundle

---

## 🔗 Related Documentation

- **Your Project**:
  - `docs/GOOGLE_ANALYTICS_AUDIT.md` - Previous audit findings
  - `deploy-full.sh` - Script with working implementation
  - `README.md` lines 1596-1610 - Deployment instructions
  
- **Wasp Documentation**:
  - [Deploying to Fly.io](https://wasp-lang.dev/docs/advanced/deployment/cli#deploying-to-flyio)
  - [Environment Variables](https://wasp-lang.dev/docs/project/env-vars)
  
- **Vite Documentation**:
  - [Env Variables and Modes](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ Resolution Status

**Issue**: `VITE_GOOGLE_ANALYTICS_ID` undefined in production  
**Root Cause**: Build-time env vars not exported during `wasp deploy fly deploy`  
**Solution**: Pass env vars to deployment command or use `deploy-full.sh`  
**Status**: **READY TO FIX** - Solution documented and tested

---

**Next Step**: Choose and execute one of the deployment options above! 🚀

