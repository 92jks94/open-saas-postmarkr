# 🔍 Google Analytics Debug Logging Guide

## Overview

Comprehensive logging has been added throughout the Google Analytics implementation to help diagnose issues. This guide explains what logs are available and how to interpret them.

---

## 📊 Client-Side Logs (Browser Console)

### Cookie Consent Banner Initialization

When the page loads, you'll see:

```
🍪 Cookie Consent Banner - Initialization
⏱️  Timestamp: 2025-10-11T...
📍 Location: https://your-app.com
🔍 Environment: production
📋 Cookie consent config generated
🔍 Config mode: opt-in
🔍 Auto show? true
✅ Cookie consent library initialized successfully
```

**What to check:**
- ✅ Cookie consent library initializes successfully
- ❌ If it fails, fallback mode will activate automatically

---

### Google Analytics Initialization (Normal Mode)

When a user accepts analytics cookies:

```
🔵 Google Analytics - Cookie Consent Accepted
⏱️  Timestamp: 2025-10-11T...
📍 Location: https://your-app.com
🔍 All environment variables: { MODE: "production", ... }
🔍 GA_ANALYTICS_ID value: G-XXXXXXXXXX
🔍 GA_ANALYTICS_ID type: string
🔍 GA_ANALYTICS_ID is empty? false
✅ Google Analytics ID found: G-XXXXXXXXXX
🚀 Initializing Google Analytics...
📊 window.dataLayer exists? false
📝 Calling gtag('js', Date)...
📝 Calling gtag('config', 'G-XXXXXXXXXX')...
📊 dataLayer after init: [...]
📜 Creating script tag with URL: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
📜 Script will be appended to document.body
✅ Script tag appended to body
✅ Google Analytics script loaded successfully
⏱️  Load time: 234.56ms
📊 Final dataLayer: [...]
🔍 gtag function available? true
```

**What to check:**
- ✅ `GA_ANALYTICS_ID` should be your actual Google Analytics ID (e.g., `G-XXXXXXXXXX`)
- ❌ If `undefined` → Environment variable not set properly during build
- ❌ If script fails to load → Check Network tab for 404 or CORS errors
- ✅ Script should load in < 500ms typically

---

### Google Analytics Initialization (Fallback Mode)

If cookie consent library fails:

```
🟡 Google Analytics - Fallback Mode Initiated
⏱️  Timestamp: 2025-10-11T...
📍 Location: https://your-app.com
🍪 Cookie consent cookie found? true
🍪 Raw cookie value: %7B%22categories%22%3A...
🍪 Parsed cookie data: { categories: [...], ... }
🍪 Analytics accepted from cookie? true
✅ Analytics consent status: ACCEPTED
🔍 GA_ANALYTICS_ID: G-XXXXXXXXXX
🔍 Type: string
🚀 Fallback: Initializing Google Analytics with ID: G-XXXXXXXXXX
...
✅ Fallback: Google Analytics script loaded successfully
```

**What to check:**
- ✅ Fallback should respect previous cookie consent
- ❌ If consent rejected → Script won't load (expected behavior)

---

### Common Client-Side Issues

#### Issue: `GA_ANALYTICS_ID: undefined`

**Logs you'll see:**
```
⚠️  Google Analytics ID not provided, skipping initialization
💡 Expected: VITE_GOOGLE_ANALYTICS_ID in .env.client or build environment
```

**Solution:**
1. Check `.env.client` file has: `VITE_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX`
2. For production, ensure environment variable is exported during build:
   ```bash
   export VITE_GOOGLE_ANALYTICS_ID="G-XXXXXXXXXX"
   wasp build
   ```
3. Check `fly-client.toml` has the correct value in `[env]` section

---

#### Issue: Script fails to load

**Logs you'll see:**
```
❌ Failed to load Google Analytics script
⏱️  Time until error: 5000.00ms
🌐 Network issue? Check console Network tab for failed request to: https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX
```

**Solution:**
1. Open browser DevTools → Network tab
2. Look for failed request to `googletagmanager.com`
3. Common causes:
   - Ad blocker blocking the script
   - Network/firewall issues
   - CORS misconfiguration (rare)
   - Invalid GA ID

---

## 🖥️ Server-Side Logs (Wasp Server Console)

### Google Analytics Module Loading

When the server starts, you'll see from `googleAnalyticsUtils.ts`:

```
📊 Google Analytics Utils - Module Loading
⏱️  Timestamp: 2025-10-11T...
🔍 Environment variables check:
   CLIENT_EMAIL present? true
   CLIENT_EMAIL value: your-service-account@...
   PRIVATE_KEY_RAW present? true
   PRIVATE_KEY_RAW length: 1234
   PROPERTY_ID present? true
   PROPERTY_ID value: 123456789
🔐 Decoding base64 private key...
✅ Private key decoded successfully
   Decoded key length: 1704
   Key starts with: -----BEGIN PRIVATE KEY-----
   Key ends with: -----END PRIVATE KEY-----
🚀 Initializing Google Analytics Data Client...
✅ Google Analytics Data Client initialized successfully
```

**What to check:**
- ✅ All three env vars should be present
- ✅ Private key should decode successfully
- ✅ Decoded key should have proper PEM format headers/footers
- ❌ If any missing → API features will be disabled

---

### Server Startup Validation

From `startupValidation.ts`:

```
📊 Validating Google Analytics configuration...
🔍 Environment variables:
   GOOGLE_ANALYTICS_CLIENT_EMAIL: your-service-account@...
   GOOGLE_ANALYTICS_PRIVATE_KEY: SET (1234 chars)
   GOOGLE_ANALYTICS_PROPERTY_ID: 123456789
   ✓ Email format valid
   ✓ Private key is valid base64
   ✓ Decoded key length: 1704
   ✓ Private key format valid (PEM)
   ✓ Property ID format valid (numeric)
✅ Google Analytics configuration validated successfully
💡 Note: This validates configuration format only, not API connectivity
   Check googleAnalyticsUtils.ts module logs for actual API initialization status
```

**What to check:**
- ✅ All validation checkmarks should pass
- ❌ If email format invalid → Check service account email
- ❌ If private key invalid → Re-encode using: `echo -n "YOUR_KEY" | base64`
- ❌ If property ID invalid → Must be 9-digit numeric ID (not GA-XXXXXXXXXX)

---

### Google Analytics API Calls

When fetching analytics data:

```
📊 GA API: getSources() called
⏱️  Timestamp: 2025-10-11T...
🔍 GA API: Requesting sources data...
   Property: properties/123456789
   Date range: 2020-01-01 to today
✅ GA API: Response received (456ms)
   Row count: 15
   Response metadata: {...}
✅ GA API: Processed sources: 15
```

**What to check:**
- ✅ API should respond in < 2 seconds typically
- ✅ Row count indicates data is being retrieved
- ❌ If timeout → Check network connectivity
- ❌ If permission error → Verify service account has "Viewer" role in GA

---

### Common Server-Side Issues

#### Issue: Private key decoding fails

**Logs you'll see:**
```
❌ Failed to decode private key from base64
🔍 Error: Invalid character...
⚠️  PRIVATE_KEY_RAW not set
```

**Solution:**
1. The private key must be base64-encoded before adding to `.env.server`
2. Encode it correctly:
   ```bash
   echo -n "-----BEGIN PRIVATE KEY-----
   MIIEvQI...your_key_here...A++eK
   -----END PRIVATE KEY-----" | base64
   ```
3. Add the output to `.env.server`:
   ```
   GOOGLE_ANALYTICS_PRIVATE_KEY=LS0tLS1CRUdJT...
   ```

---

#### Issue: API calls fail with authentication error

**Logs you'll see:**
```
❌ GA API: getSources() failed
🔍 Error: Error: 7 PERMISSION_DENIED: User does not have sufficient permissions...
🔍 Error code: 7
🔍 Error details: PERMISSION_DENIED
```

**Solution:**
1. Go to Google Analytics → Admin → Property Access Management
2. Add your service account email (ends with `@your-project.iam.gserviceaccount.com`)
3. Grant "Viewer" role
4. Wait 5-10 minutes for permissions to propagate

---

#### Issue: Wrong property ID

**Logs you'll see:**
```
❌ GA API: getSources() failed
🔍 Error: Error: 5 NOT_FOUND: Property not found
```

**Solution:**
1. Go to Google Analytics → Admin → Property → Property Settings
2. Find "Property ID" (9-digit number, e.g., `123456789`)
3. **Do NOT use** the Measurement ID (starts with `G-`)
4. Update `GOOGLE_ANALYTICS_PROPERTY_ID` in `.env.server`

---

## 🔧 Debugging Workflow

### Step 1: Check Client-Side (Browser)

1. Open your app in browser
2. Open DevTools → Console
3. Accept analytics cookies (if prompted)
4. Look for Google Analytics initialization logs
5. Verify:
   - ✅ `VITE_GOOGLE_ANALYTICS_ID` is defined
   - ✅ Script loads successfully
   - ✅ `window.dataLayer` is populated

### Step 2: Check Server-Side (Terminal)

1. Run `wasp start` or check production logs
2. Look for Google Analytics module loading logs
3. Verify:
   - ✅ All 3 env vars are present
   - ✅ Private key decodes successfully
   - ✅ Client initializes successfully

### Step 3: Test API Functionality

1. Visit your admin dashboard (if applicable)
2. Check server logs for GA API call logs
3. Verify:
   - ✅ API calls complete successfully
   - ✅ Data is retrieved (row count > 0)
   - ✅ Response time is reasonable

---

## 📝 Quick Reference

### Client-Side Environment Variable

- **Variable:** `VITE_GOOGLE_ANALYTICS_ID`
- **Format:** `G-XXXXXXXXXX` (starts with `G-`)
- **Location (dev):** `.env.client`
- **Location (prod):** Exported during build or in `fly-client.toml`
- **Used for:** Browser tracking script initialization

### Server-Side Environment Variables

- **Variable 1:** `GOOGLE_ANALYTICS_CLIENT_EMAIL`
  - **Format:** `your-service-account@project.iam.gserviceaccount.com`
  - **Location:** `.env.server`
  
- **Variable 2:** `GOOGLE_ANALYTICS_PRIVATE_KEY`
  - **Format:** Base64-encoded PEM private key
  - **Location:** `.env.server`
  
- **Variable 3:** `GOOGLE_ANALYTICS_PROPERTY_ID`
  - **Format:** 9-digit number (e.g., `123456789`)
  - **Location:** `.env.server`
  - **Used for:** Server-side Analytics Data API calls

---

## 🎯 Success Indicators

### Client-Side Success
```
✅ Google Analytics script loaded successfully
⏱️  Load time: 234.56ms
📊 Final dataLayer: [...]
🔍 gtag function available? true
```

### Server-Side Success
```
✅ Google Analytics Data Client initialized successfully
✅ Google Analytics configuration validated successfully
✅ GA API: Response received (456ms)
✅ GA API: Processed sources: 15
```

When you see these logs, Google Analytics is working correctly! 🎉

---

## 🆘 Still Having Issues?

If Google Analytics still isn't working after checking all the above:

1. **Verify in Google Analytics directly:**
   - Go to Google Analytics → Realtime
   - Visit your site
   - You should see yourself in the realtime view within 30 seconds

2. **Check browser console for ALL errors:**
   - Sometimes errors outside GA can prevent script loading
   - Check for CSP (Content Security Policy) violations

3. **Test in incognito mode:**
   - Eliminates browser extensions (ad blockers) as the cause
   - Clears cache and cookies

4. **Check the logs provided above:**
   - Client-side logs tell you about browser tracking
   - Server-side logs tell you about API access for admin features
   - Both can work independently (browser tracking doesn't require server API)

---

## 📚 Related Documentation

- [Google Analytics Setup Guide](../README.md#google-analytics)
- [Cookie Consent Configuration](../README.md#cookie-consent)
- [Google Analytics Audit](./GOOGLE_ANALYTICS_AUDIT.md)

