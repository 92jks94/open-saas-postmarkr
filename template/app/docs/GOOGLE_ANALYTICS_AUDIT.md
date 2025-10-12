# 🔍 Google Analytics Full Audit - Root Cause Analysis

**Date**: January 11, 2025  
**Issue**: `VITE_GOOGLE_ANALYTICS_ID` shows as `undefined` in production despite being set as Fly secret

---

## 🎯 Executive Summary

**Problem**: Google Analytics not working in production because `VITE_GOOGLE_ANALYTICS_ID` is not included in the client JavaScript bundle.

**Root Cause**: `VITE_*` environment variables must be **exported during the build process** for Vite to bake them into the bundle. Fly secrets alone are not sufficient.

**Status**: ✅ **FIXED** - Updated `deploy-full.sh` to export VITE vars during build.

---

## 📊 Audit Findings

### 1. Environment Variables ARE Set Correctly ✅

**Fly Secrets Verified**:
```bash
$ fly secrets list --app postmarkr-server-client

NAME                        DIGEST           
VITE_GOOGLE_ANALYTICS_ID    f3a6c89c30f02c47  ✅ PRESENT
VITE_SENTRY_DSN            2bcc760fe30b3f9d  ✅ PRESENT
```

**fly-client.toml Verified**:
```toml
[env]
  VITE_GOOGLE_ANALYTICS_ID = "G-6H2SB3GJDW"  ✅ CORRECT
```

**Conclusion**: Configuration files are correct.

---

### 2. Client Bundle DOES NOT Include VITE Vars ❌

**Production `import.meta.env` Object**:
```javascript
{
  BASE_URL: "/",
  DEV: false,
  MODE: "production",
  PROD: true,
  REACT_APP_API_URL: "https://postmarkr-server-server.fly.dev",
  SSR: false
  // ❌ VITE_GOOGLE_ANALYTICS_ID: MISSING!
  // ❌ VITE_SENTRY_DSN: MISSING!
}
```

**Conclusion**: VITE vars not baked into JavaScript bundle during build.

---

### 3. Build Process Was Missing VITE Exports ❌

**Original `deploy-full.sh` (lines 83-88)**:
```bash
# Export environment variables for the build
export WASP_WEB_CLIENT_URL="${CLIENT_URL}"
export WASP_SERVER_URL="${SERVER_URL}"

# Build the application
wasp build
```

**Problem**: Only exporting server/WASP vars, NOT client VITE vars!

**How Vite Works**:
- Vite reads `process.env.VITE_*` during build time
- Replaces `import.meta.env.VITE_*` with actual values in the bundle
- If not exported during build, defaults to `undefined`

---

### 4. Fly Secrets vs Build-Time Environment Variables

| Type | When Available | Used For | Example |
|------|----------------|----------|---------|
| **Fly Secrets** | Runtime (after deploy) | Server-side code | `DATABASE_URL`, `JWT_SECRET` |
| **`[env]` in toml** | Runtime | Node.js process vars | `PORT`, `NODE_ENV` |
| **Exported during build** | Build time | Vite bundling | `VITE_GOOGLE_ANALYTICS_ID` |

**Key Insight**: 
- ✅ Fly secrets work for runtime (server)
- ❌ Fly secrets DON'T work for Vite build-time (client)
- ✅ Must export VITE vars when running `wasp build`

---

## ✅ The Fix Applied

**Updated `deploy-full.sh` (lines 87-91)**:
```bash
# Export client-side (VITE_) environment variables for build
export VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW"
export VITE_SENTRY_DSN="https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360"

print_status $BLUE "   Building with VITE_GOOGLE_ANALYTICS_ID=${VITE_GOOGLE_ANALYTICS_ID}"

# Build the application
wasp build
```

**What This Does**:
1. ✅ Exports `VITE_GOOGLE_ANALYTICS_ID` to environment
2. ✅ Vite reads it during `wasp build`
3. ✅ Replaces all `import.meta.env.VITE_GOOGLE_ANALYTICS_ID` with `"G-6H2SB3GJDW"` in bundle
4. ✅ Google Analytics works in production!

---

## 🚀 Next Steps

### Run the Fixed Deployment:

```bash
# In WSL terminal
cd ~/Projects/open-saas-postmarkr/template/app

# Run the updated deployment script
bash deploy-full.sh
```

### What Will Happen:
1. ✅ Script exports VITE vars before building
2. ✅ `wasp build` creates bundle with GA ID baked in
3. ✅ Deploys to Fly.io
4. ✅ Google Analytics works!

### Expected Result:
After deployment completes and you visit your site:

```javascript
🔍 DEBUG: All import.meta.env: {
  BASE_URL: "/",
  MODE: "production", 
  PROD: true,
  VITE_GOOGLE_ANALYTICS_ID: "G-6H2SB3GJDW",  ✅ PRESENT!
  VITE_SENTRY_DSN: "https://...",  ✅ PRESENT!
  // ... other vars
}
🔍 DEBUG: GA_ANALYTICS_ID value: G-6H2SB3GJDW  ✅ SUCCESS!
✅ Initializing Google Analytics with ID: G-6H2SB3GJDW
✅ Google Analytics script loaded successfully
```

---

## 📚 Lessons Learned

### 1. Vite Environment Variables Are Special

**Unlike server vars**, Vite client vars:
- ❌ Cannot be changed at runtime
- ✅ Must be available during build
- ✅ Get replaced with literal values in the bundle
- ❌ Fly secrets alone don't work

### 2. Two Types of Deployment

| Method | Works for VITE vars? | Why? |
|--------|---------------------|------|
| `fly deploy` | ❌ NO | Deploys existing build, doesn't rebuild |
| `wasp build` + `fly deploy` | ✅ YES (if exported) | Rebuilds with env vars |
| GitHub Actions | ✅ YES (if in workflow env) | Builds with secrets as env vars |

### 3. README Documentation Was Correct

From your README.md (lines 1600-1604):
```markdown
:::caution[Setting Environment Variables]
Remember, because we've set certain client-side env variables, 
make sure to pass them to the `wasp deploy` commands:

REACT_APP_CLIENT_ENV_VAR_1=<...> wasp deploy 
:::
```

**This applies to VITE vars too!** The principle is the same:
```bash
VITE_GOOGLE_ANALYTICS_ID="G-6H2SB3GJDW" wasp build
```

---

## 🔍 Why This Wasn't Obvious

1. **Fly secrets showed as set** ✅ - Led us to believe config was correct
2. **fly-client.toml had the value** ✅ - But `[env]` is runtime, not build-time
3. **Server secrets work differently** - Made assumptions about client vars
4. **No build errors** - Vite silently defaults to `undefined`

---

## ✅ Verification Checklist

After running `bash deploy-full.sh`:

- [ ] Script shows: `Building with VITE_GOOGLE_ANALYTICS_ID=G-6H2SB3GJDW`
- [ ] Build completes successfully
- [ ] Deployment completes
- [ ] Visit production site
- [ ] Open DevTools console
- [ ] Accept cookies
- [ ] See: `🔍 DEBUG: GA_ANALYTICS_ID value: G-6H2SB3GJDW`
- [ ] See: `✅ Google Analytics script loaded successfully`
- [ ] Network tab shows requests to `googletagmanager.com`
- [ ] Google Analytics Realtime shows active users

---

## 🎓 Technical Deep Dive

### How Vite Processes Environment Variables

**At Build Time**:
```typescript
// Your source code:
const gaId = import.meta.env.VITE_GOOGLE_ANALYTICS_ID;

// If exported during build:
const gaId = "G-6H2SB3GJDW";  // ✅ Literal value

// If NOT exported during build:
const gaId = undefined;  // ❌ Default
```

**Why Fly Secrets Don't Work**:
1. Fly secrets → Available in container at runtime
2. But Vite build happens in CI/local machine
3. Build machine doesn't have access to Fly runtime secrets
4. Must be provided explicitly during build

**Solution Approaches**:
1. ✅ Export during build (our fix)
2. ✅ GitHub Actions with secrets as env vars
3. ✅ Local .env file for local builds
4. ❌ Fly secrets alone - doesn't work

---

## 📝 Summary

| Item | Status | Notes |
|------|--------|-------|
| **Fly Secrets** | ✅ Set | But not enough |
| **fly-client.toml** | ✅ Correct | But `[env]` is runtime |
| **Build Process** | ❌ → ✅ Fixed | Now exports VITE vars |
| **Production Bundle** | ❌ → ✅ Will fix | After redeploy |
| **Google Analytics** | ❌ → ✅ Will work | After redeploy |

**Root Cause**: Build process wasn't exporting VITE environment variables.  
**Solution**: Updated `deploy-full.sh` to export VITE vars before building.  
**Action Required**: Run `bash deploy-full.sh` to rebuild and redeploy.

---

**Status**: Ready to deploy! 🚀

