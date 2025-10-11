# Cookie Consent Library Fix

## Problem Summary

You were seeing these console errors:
```
Cookie consent library not loaded, running fallback
Fallback: Google Analytics ID not provided, skipping initialization
```

This was caused by **TWO bugs** in the implementation:

### Bug #1: Invalid Window Check ❌
**File**: `src/client/components/cookie-consent/Banner.tsx` (line 91)

```typescript
// WRONG - vanilla-cookieconsent v3 doesn't expose window.CookieConsent
if (typeof window.CookieConsent === 'undefined') {
  console.log('Cookie consent library not loaded, running fallback');
  initializeGoogleAnalyticsFallback();
}
```

**Why this is wrong:**
- `vanilla-cookieconsent` v3 is an ES module import (`import * as CookieConsent`)
- It does NOT create a global `window.CookieConsent` object
- This check **always failed** after 1 second, unnecessarily triggering the fallback

### Bug #2: Missing Local Environment Variable ❌
**What happened:**
- The fallback ran and tried to load GA
- But `import.meta.env.VITE_GOOGLE_ANALYTICS_ID` was **undefined** locally
- You had `G-6H2SB3GJDW` in `fly-client.toml` (for Fly.io deployment)
- But you were missing `.env.client` for local development

---

## What Was Fixed ✅

### Fix #1: Removed Invalid Window Check
```typescript
// FIXED - No timeout check needed
const CookieConsentBanner = () => {
  useEffect(() => {
    try {
      CookieConsent.run(getConfig());
      console.log('Cookie consent library initialized successfully'); // ✅ New log
    } catch (error) {
      console.error('Cookie consent library failed to load:', error);
      initializeGoogleAnalyticsFallback(); // Only runs if try{} actually fails
    }
  }, []);

  return <div id='cookieconsent'></div>;
};
```

**Why this is better:**
- The `try/catch` block is sufficient
- If `CookieConsent.run()` succeeds, the modal shows up
- If it fails, the fallback runs
- No unnecessary timeout checks

### Fix #2: Created `.env.client` File ✅
```bash
# .env.client (created in project root)
VITE_GOOGLE_ANALYTICS_ID=G-6H2SB3GJDW
```

**Why this is needed:**
- Vite only exposes env vars that start with `VITE_` to the browser
- `fly-client.toml` only affects **production** deployment on Fly.io
- For **local development**, you need `.env.client`

---

## How to Test the Fix

### Step 1: Restart Your Dev Server
```bash
# Stop the current server (Ctrl+C)
wasp start
```

**Important:** Vite only reads `.env.client` on startup!

### Step 2: Open Your App in Browser
1. Open http://localhost:3000 (or your local URL)
2. Open DevTools (F12) → Console tab

### Step 3: Verify You See These Logs
```
✅ Cookie consent library initialized successfully
✅ (After accepting cookies) Initializing Google Analytics with ID: G-6H2SB3GJDW
✅ (After accepting cookies) Google Analytics script loaded successfully
```

### Step 4: Verify Cookie Banner Appears
- You should see the cookie consent modal in the bottom right
- Click "Accept all"
- The modal should disappear

### Step 5: Verify GA is Loaded
1. Go to **Network tab** in DevTools
2. Filter by "google"
3. You should see requests to:
   - `googletagmanager.com/gtag/js?id=G-6H2SB3GJDW`
   - `google-analytics.com/g/collect`

---

## What You Should NO LONGER See ✅

These errors should be **gone**:
- ❌ "Cookie consent library not loaded, running fallback"
- ❌ "Fallback: Google Analytics ID not provided, skipping initialization"
- ❌ "Google Analytics ID not provided, skipping initialization"

---

## Environment Variables Reference

| File | Purpose | Variables |
|------|---------|-----------|
| `.env.client` | **Local development** (your computer) | `VITE_GOOGLE_ANALYTICS_ID` |
| `fly-client.toml` | **Fly.io deployment** (production) | `VITE_GOOGLE_ANALYTICS_ID` |
| `.github/workflows/deploy.yml` | **GitHub Actions** (CI/CD) | Uses `secrets.GOOGLE_ANALYTICS_ID` |

All three should have the **same value**: `G-6H2SB3GJDW`

---

## Optional: Sentry Setup

You also saw this warning (optional):
```
Sentry DSN not provided, skipping initialization
```

If you want to enable Sentry error tracking, add to `.env.client`:
```bash
VITE_SENTRY_DSN=https://ea1a698c4ecd0ccd0859b624c70f55550@o4510025126051840.ingest.us.sentry.io/4510077051535360
```

**But this is optional!** The app works fine without Sentry.

---

## Why This Matters for Production

### Before Fix:
- ❌ Cookie consent loaded but was flagged as "not loaded" after 1 second
- ❌ Fallback ran unnecessarily
- ❌ Could cause duplicate GA initialization attempts
- ❌ Confusing console errors for debugging

### After Fix:
- ✅ Cookie consent loads cleanly
- ✅ No unnecessary fallback calls
- ✅ Clean console logs
- ✅ GA only initializes after user accepts cookies (GDPR/CCPA compliant!)

---

## Files Changed

1. ✅ `src/client/components/cookie-consent/Banner.tsx` - Removed invalid window check
2. ✅ `.env.client` - Created with `VITE_GOOGLE_ANALYTICS_ID`

---

**Last Updated**: January 11, 2025  
**Status**: ✅ Fixed - Restart dev server to test

