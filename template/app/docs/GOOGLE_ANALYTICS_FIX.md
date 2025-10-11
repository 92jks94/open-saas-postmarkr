# Google Analytics Fix Guide

## Problem Summary

Your Google Analytics implementation was not working because of **incorrect or placeholder GA ID** being used across your configuration files.

### Root Causes Identified:

1. **Wrong GA ID**: Using `G-6H2SB3GJDW` everywhere (likely a placeholder or test ID)
2. **Inconsistent IDs**: Different GA IDs in different environments:
   - Fly.io deployment: `G-6H2SB3GJDW`
   - E2E tests: `G-H3LSJCK95H`
   - GitHub deployment: Uses `secrets.GOOGLE_ANALYTICS_ID`
3. **Hardcoded Fallback**: The fallback mechanism defaulted to `G-6H2SB3GJDW`, masking the real issue

## What Was Fixed

### ✅ Changes Made:

1. **`fly-client.toml`** - Updated GA ID placeholder with clear comment
2. **`Banner.tsx`** - Removed hardcoded fallback, now properly exits if no GA ID is configured

## Complete Fix Instructions

### Step 1: Get Your Real Google Analytics Measurement ID

1. Go to [Google Analytics](https://analytics.google.com)
2. Click **Admin** (gear icon in bottom left)
3. Under **Property** → Select your property
4. Click **Data Streams**
5. Click your website data stream
6. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`)

### Step 2: Update Configuration Files

#### Local Development (if you have `.env.client` file):
```bash
# Create or update .env.client
VITE_GOOGLE_ANALYTICS_ID=G-YOUR-REAL-ID-HERE
```

#### Fly.io Deployment:
Update `fly-client.toml`:
```toml
[env]
  VITE_GOOGLE_ANALYTICS_ID = "G-YOUR-REAL-ID-HERE"
```

#### GitHub Secrets (for CI/CD):
1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add or update: `GOOGLE_ANALYTICS_ID` = `G-YOUR-REAL-ID-HERE`

### Step 3: Set Server-Side GA API Credentials

For the Admin Dashboard analytics, you need the Google Analytics API credentials.

#### You already have these in `google-analytics-env.txt`:
```bash
# Add to .env.server
GOOGLE_ANALYTICS_CLIENT_EMAIL=id-postmarkr-analytics-service@postmarkr-analytics.iam.gserviceaccount.com
GOOGLE_ANALYTICS_PROPERTY_ID=YOUR-PROPERTY-ID  # Get from Google Analytics Admin → Property Settings
GOOGLE_ANALYTICS_PRIVATE_KEY='<already in google-analytics-env.txt>'
```

**To get the Property ID:**
1. Go to Google Analytics → Admin
2. Under **Property**, note the Property ID (usually a number like `123456789`)
3. Add it to your `.env.server`

### Step 4: Deploy Secrets to Fly.io

```bash
# Set client-side GA ID
fly secrets set VITE_GOOGLE_ANALYTICS_ID="G-YOUR-REAL-ID-HERE" --app postmarkr-server-client

# Set server-side GA API credentials
fly secrets set GOOGLE_ANALYTICS_CLIENT_EMAIL="id-postmarkr-analytics-service@postmarkr-analytics.iam.gserviceaccount.com" --app postmarkr-server
fly secrets set GOOGLE_ANALYTICS_PROPERTY_ID="YOUR-PROPERTY-ID" --app postmarkr-server
fly secrets set GOOGLE_ANALYTICS_PRIVATE_KEY='<paste from google-analytics-env.txt>' --app postmarkr-server
```

### Step 5: Verify It Works

#### After Local Development Server Restart:
1. Open your browser DevTools → Console
2. Visit your app
3. Accept cookies on the consent banner
4. Look for console logs:
   - ✅ "Initializing Google Analytics with ID: G-YOUR-ID"
   - ✅ "Google Analytics script loaded successfully"
5. Check Network tab for requests to `googletagmanager.com`

#### In Google Analytics:
1. Go to Google Analytics → Reports → Realtime
2. Visit your site
3. You should see yourself as an active user within ~10 seconds

## Why OpenSaaS Worked But Yours Didn't

| OpenSaaS Template | Your Implementation |
|-------------------|---------------------|
| ✅ Uses valid GA property ID | ❌ Used placeholder ID `G-6H2SB3GJDW` |
| ✅ Consistent ID across all configs | ❌ Multiple different IDs in different places |
| ✅ No hardcoded fallback (or uses correct ID) | ❌ Hardcoded fallback masked the problem |

## Testing Checklist

- [ ] Updated `fly-client.toml` with real GA ID
- [ ] Updated `.env.client` (if exists) with real GA ID
- [ ] Updated GitHub Secrets with real GA ID
- [ ] Added `GOOGLE_ANALYTICS_PROPERTY_ID` to `.env.server`
- [ ] Deployed secrets to Fly.io
- [ ] Restarted development server: `wasp start`
- [ ] Accepted cookies in browser
- [ ] Verified console logs show successful GA initialization
- [ ] Verified Realtime data in Google Analytics dashboard
- [ ] Checked Admin Dashboard displays GA metrics

## Common Issues After Fix

### Issue: Still not seeing data in Google Analytics

**Possible Causes:**
1. **Ad blockers**: Disable ad blockers while testing
2. **Browser privacy extensions**: Try in incognito mode
3. **GA property setup**: Verify your GA property is correctly set up for GA4 (not Universal Analytics)
4. **Wrong property ID**: Double-check you're using the Measurement ID (G-XXXXXXXX), not the Property ID (12345)

### Issue: Admin Dashboard not showing GA data

**Possible Causes:**
1. **Server-side credentials not set**: Verify `GOOGLE_ANALYTICS_CLIENT_EMAIL`, `GOOGLE_ANALYTICS_PRIVATE_KEY`, and `GOOGLE_ANALYTICS_PROPERTY_ID` are all set
2. **Wrong property ID**: The Property ID for the API is different from the Measurement ID
3. **API not enabled**: Enable "Google Analytics Data API" in Google Cloud Console
4. **Service account permissions**: Ensure the service account has "Viewer" permissions on your GA property

**How to add service account to GA:**
1. Google Analytics → Admin → Property Access Management
2. Click the ➕ button
3. Add the email from `GOOGLE_ANALYTICS_CLIENT_EMAIL`
4. Assign "Viewer" role
5. Click "Add"

## Environment Variables Quick Reference

### Client-Side (Vite/Browser)
```bash
VITE_GOOGLE_ANALYTICS_ID=G-YOUR-MEASUREMENT-ID  # For gtag.js tracking
```

### Server-Side (Node.js)
```bash
GOOGLE_ANALYTICS_CLIENT_EMAIL=analytics@your-project.iam.gserviceaccount.com
GOOGLE_ANALYTICS_PRIVATE_KEY='<base64-encoded-json-key>'
GOOGLE_ANALYTICS_PROPERTY_ID=123456789  # Numeric property ID, not measurement ID
```

## Additional Resources

- [Google Analytics Setup Guide](https://support.google.com/analytics/answer/9304153)
- [Google Analytics Data API Setup](https://developers.google.com/analytics/devguides/reporting/data/v1/quickstart-client-libraries)
- [Wasp Environment Variables](https://wasp-lang.dev/docs/project/env-vars)
- OpenSaaS Analytics Guide: `docs/ANALYTICS_SENTRY_TROUBLESHOOTING.md`

---

**Last Updated**: January 11, 2025
**Status**: ✅ Fixed - Awaiting user to add real GA ID

