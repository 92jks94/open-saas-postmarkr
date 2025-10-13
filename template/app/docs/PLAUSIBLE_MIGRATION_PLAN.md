# 🔄 Plausible Analytics Migration Plan

**Date Created:** October 12, 2025  
**Status:** Planning Phase  
**Goal:** Switch from Google Analytics to Plausible Analytics

---

## 📊 Executive Summary

This document outlines the complete migration from Google Analytics to Plausible Analytics. Plausible is a privacy-friendly, cookieless alternative that simplifies our analytics stack and eliminates the need for cookie consent modals.

### Key Benefits
- ✅ **No Cookie Consent Modal Needed** - Plausible is privacy-friendly and cookieless
- ✅ **Simpler Configuration** - No complex Google Cloud setup, service accounts, or key encoding
- ✅ **Better Privacy** - GDPR compliant out of the box
- ✅ **Cleaner Code** - Remove ~200 lines of Google Analytics specific code
- ✅ **Faster Setup** - 3 env vars vs 4+ for Google Analytics
- ✅ **Existing Code Ready** - `plausibleAnalyticsUtils.ts` is already implemented!

### Key Decisions Needed

#### 🔴 **Decision 1: Hosted vs Self-Hosted Plausible**
- **Option A: Hosted Plausible** (Recommended for most)
  - ✅ Pros: Easy setup, maintained for you, reliable
  - ❌ Cons: Paid service (~$9-19/month depending on traffic)
  - Setup time: ~15 minutes
  
- **Option B: Self-Hosted Plausible**
  - ✅ Pros: Free, full control
  - ❌ Cons: Requires server setup, maintenance, updates
  - Setup time: ~2-4 hours

**Your Choice:** [ ] Hosted  [ ] Self-Hosted

#### 🟡 **Decision 2: Cookie Consent Modal**
Since Plausible doesn't use cookies, you have options:

- **Option A: Remove Cookie Consent Completely** (Recommended if only used for analytics)
  - ✅ Pros: Simpler codebase, better UX
  - ❌ Cons: Need to re-add if you use cookies in future
  
- **Option B: Keep Cookie Consent for Future Use**
  - ✅ Pros: Ready for future cookie needs
  - ❌ Cons: Unnecessary code currently

**Your Choice:** [ ] Remove Completely  [ ] Keep for Future

#### 🟢 **Decision 3: Historical Data**
- Do you need to export historical Google Analytics data before migration?
- **Your Choice:** [ ] Yes, export first  [ ] No, fresh start

---

## 📋 Implementation Phases

### Phase 1: Setup & Configuration (Prerequisites)

#### 1.1 Sign up for Plausible
**Status:** ⏳ Pending

**If Hosted:**
1. Sign up at https://plausible.io
2. Choose your plan based on monthly pageviews
3. Add your domain (this becomes your `PLAUSIBLE_SITE_ID`)
4. Get your API key from Settings tab
5. Note the base URL: `https://plausible.io/api`

**If Self-Hosted:**
1. Follow Plausible self-hosting guide: https://plausible.io/docs/self-hosting
2. Deploy to your server
3. Create your site and get API key
4. Note your base URL: `https://your-plausible-instance.com/api`

**Required Information:**
- [ ] PLAUSIBLE_SITE_ID: _______________
- [ ] PLAUSIBLE_API_KEY: _______________
- [ ] PLAUSIBLE_BASE_URL: _______________

---

### Phase 2: Environment Variables Update

#### 2.1 Update `.env.server` file
**Status:** ⏳ Pending

**Actions:**
```bash
# Remove or comment out these Google Analytics variables:
# GOOGLE_ANALYTICS_CLIENT_EMAIL=...
# GOOGLE_ANALYTICS_PROPERTY_ID=...
# GOOGLE_ANALYTICS_PRIVATE_KEY=...

# Add Plausible variables:
PLAUSIBLE_SITE_ID=yourdomain.com  # without www
PLAUSIBLE_API_KEY=your_api_key_here
PLAUSIBLE_BASE_URL=https://plausible.io/api  # or your self-hosted URL
```

**Files to Update:**
- [ ] `.env.server` (local)
- [ ] `.env.server.example` (if exists, for documentation)

#### 2.2 Update `.env.client` file
**Status:** ⏳ Pending

**Actions:**
```bash
# Remove this line:
# REACT_APP_GOOGLE_ANALYTICS_ID=G-XXXXXXXXXX

# Note: Plausible doesn't need a client-side env var
# The script tag can be added directly to main.wasp
```

**Files to Update:**
- [ ] `.env.client` (local)
- [ ] `.env.client.example` (if exists)

#### 2.3 Update Deployment Secrets
**Status:** ⏳ Pending

**For Fly.io Deployment:**
```bash
# Remove old secrets
fly secrets unset GOOGLE_ANALYTICS_CLIENT_EMAIL GOOGLE_ANALYTICS_PROPERTY_ID GOOGLE_ANALYTICS_PRIVATE_KEY REACT_APP_GOOGLE_ANALYTICS_ID

# Add new secrets
fly secrets set PLAUSIBLE_SITE_ID="yourdomain.com" PLAUSIBLE_API_KEY="your_key" PLAUSIBLE_BASE_URL="https://plausible.io/api"
```

**Scripts to Update:**
- [ ] `deploy-full.sh` (lines 88-91) - Remove Google Analytics ID export
- [ ] `scripts/sync-env-secrets.sh` (if it references GA vars)

---

### Phase 3: Code Changes - Main Application

#### 3.1 Update `main.wasp` - Replace Analytics Script
**Status:** ⏳ Pending  
**File:** `main.wasp` (lines 34-39)

**Remove:**
```wasp
// Google Analytics - Script loads in head for proper detection by Tag Assistant
// The script loads but doesn't initialize until cookie consent is given (see cookie-consent/Config.ts)
"<script async src='https://www.googletagmanager.com/gtag/js?id=G-6H2SB3GJDW'></script>",

// Debug helper - logs when GA script loads for verification
"<script>window.addEventListener('load', function() { console.log('🔍 Google Tag loaded:', !!window.gtag); console.log('🔍 DataLayer exists:', !!window.dataLayer); });</script>",
```

**Add:**
```wasp
// Plausible Analytics - Privacy-friendly, no cookies, no consent needed
"<script defer data-domain='YOUR_DOMAIN_HERE' src='https://plausible.io/js/script.js'></script>",
```

**Note:** Replace `YOUR_DOMAIN_HERE` with your actual domain (same as PLAUSIBLE_SITE_ID)

#### 3.2 Update `src/analytics/stats.ts` - Switch Provider
**Status:** ⏳ Pending  
**File:** `src/analytics/stats.ts`

**Change Line 5:**
```typescript
// FROM:
import { getDailyPageViews, getSources } from './providers/googleAnalyticsUtils';

// TO:
import { getDailyPageViews, getSources } from './providers/plausibleAnalyticsUtils';
```

**Simplify Lines 56-129 (Optional but Recommended):**
Plausible is simpler and more reliable than Google Analytics API, so you can:
- Remove the complex caching logic (`getCachedGAData`, `setCachedGAData`)
- Remove retry logic (`retryWithBackoff`)
- Simplify error handling

This is optional - the code will work as-is with the import change.

#### 3.3 Handle Cookie Consent
**Status:** ⏳ Pending

**If Decision 2 = "Remove Completely":**
- [ ] Delete entire directory: `src/client/components/cookie-consent/`
- [ ] Update `src/client/App.tsx`: Remove cookie consent imports and initialization (around line 43)
- [ ] Update `package.json`: Remove `vanilla-cookieconsent` dependency
- [ ] Run `npm install` to clean up

**If Decision 2 = "Keep for Future":**
- [ ] Edit `src/client/components/cookie-consent/Config.ts`:
  - Remove the `analytics` category (lines 44-130)
  - Keep only `necessary` category
  - Update modal text to clarify no analytics tracking
- [ ] Update `src/client/App.tsx`: Keep the cookie consent code but it won't show analytics option

---

### Phase 4: Code Changes - Blog

#### 4.1 Update Blog Analytics
**Status:** ⏳ Pending  
**File:** `blog/astro.config.mjs` (lines 82-98)

**Replace:**
```javascript
head: [
  // Google Analytics - uses environment variable
  {
    tag: 'script',
    attrs: {
      src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX'}`,
    },
  },
  {
    tag: 'script',
    content: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.GOOGLE_ANALYTICS_ID || 'G-XXXXXXXXXX'}');
    `,
  },
],
```

**With:**
```javascript
head: [
  // Plausible Analytics for blog
  {
    tag: 'script',
    attrs: {
      defer: true,
      'data-domain': 'YOUR_DOMAIN_HERE',
      src: 'https://plausible.io/js/script.js',
    },
  },
],
```

---

### Phase 5: Server-Side Validation & Monitoring Updates

#### 5.1 Update Environment Validation
**Status:** ⏳ Pending  
**File:** `src/server/envValidation.ts`

**Lines 92-95: Remove Google Analytics validation:**
```typescript
// REMOVE:
GOOGLE_ANALYTICS_ID: z.string().optional(),
GOOGLE_ANALYTICS_CLIENT_EMAIL: z.string().email('GOOGLE_ANALYTICS_CLIENT_EMAIL must be a valid email').optional(),
GOOGLE_ANALYTICS_PRIVATE_KEY: z.string().min(1, 'GOOGLE_ANALYTICS_PRIVATE_KEY is required for Google Analytics').optional(),
GOOGLE_ANALYTICS_PROPERTY_ID: z.string().min(1, 'GOOGLE_ANALYTICS_PROPERTY_ID is required for Google Analytics').optional(),
```

**ADD:**
```typescript
// Plausible Analytics
PLAUSIBLE_SITE_ID: z.string().min(1, 'PLAUSIBLE_SITE_ID is required for Plausible Analytics').optional(),
PLAUSIBLE_API_KEY: z.string().min(1, 'PLAUSIBLE_API_KEY is required for Plausible Analytics').optional(),
PLAUSIBLE_BASE_URL: z.string().url('PLAUSIBLE_BASE_URL must be a valid URL').default('https://plausible.io/api'),
```

**Lines 216-218: Update grouped validation:**
```typescript
// Update the analytics group to use Plausible variables instead
```

#### 5.2 Update Startup Validation
**Status:** ⏳ Pending  
**File:** `src/server/startupValidation.ts` (lines 361-376)

Replace Google Analytics validation checks with Plausible checks.

#### 5.3 Update Monitoring Alerts
**Status:** ⏳ Pending  
**File:** `src/server/monitoringAlerts.ts` (lines 109-111, 342)

Update environment variable checks and monitoring logic.

#### 5.4 Update API Connectivity Tests
**Status:** ⏳ Pending  
**File:** `src/server/apiConnectivityTests.ts` (lines 281-283)

Remove or replace Google Analytics connectivity test with Plausible test.

---

### Phase 6: Documentation & Cleanup

#### 6.1 Update Documentation Files
**Status:** ⏳ Pending

**Update `README.md`:**
- [ ] Lines 1116, 1139-1144: Replace Google Analytics instructions with Plausible
- [ ] Lines 1574-1577: Update environment variables checklist
- [ ] Line 1387: Remove Google Analytics build instructions

**Archive Old Documentation:**
Move to `docs/archive/` or delete:
- [ ] `docs/GOOGLE_ANALYTICS_AUDIT.md`
- [ ] `docs/GOOGLE_ANALYTICS_DEBUG_LOGS.md`
- [ ] `docs/GOOGLE_TAG_DETECTION_AUDIT.md`
- [ ] `docs/GOOGLE_TAG_IMPLEMENTATION_SUMMARY.md`
- [ ] `docs/VITE_ENV_VARS_ROOT_CAUSE_ANALYSIS.md`

#### 6.2 Update Production Readiness Check
**Status:** ⏳ Pending  
**File:** `scripts/production-readiness-check.sh` (line 146)

Replace Google Analytics check with Plausible check.

---

### Phase 7: Testing

#### 7.1 Local Testing
**Status:** ⏳ Pending

**Test Checklist:**
- [ ] Restart development server: `wasp start`
- [ ] Open browser DevTools → Network tab
- [ ] Verify Plausible script loads (`script.js` from plausible.io)
- [ ] Check for JavaScript errors in Console
- [ ] Navigate between pages to trigger pageview events
- [ ] Check Plausible dashboard for real-time data (may take a few minutes)
- [ ] Test admin dashboard analytics display (if applicable)
- [ ] Verify no cookie consent modal appears (if removed)

#### 7.2 E2E Test Updates
**Status:** ⏳ Pending

**Review and Update:**
- [ ] Check `e2e-tests/tests/` for Google Analytics specific tests
- [ ] Update or remove GA-related tests
- [ ] Run E2E tests: `cd e2e-tests && npm test`

---

### Phase 8: Deployment

#### 8.1 Pre-deployment Checklist
**Status:** ⏳ Pending

- [ ] All environment variables set in production (Fly secrets)
- [ ] All code changes committed
- [ ] Local testing passed
- [ ] E2E tests passed
- [ ] Test build locally: `wasp build`
- [ ] Review deployment script changes

#### 8.2 Deploy to Production
**Status:** ⏳ Pending

**Steps:**
```bash
# Run deployment script
./deploy-full.sh

# Or deploy manually
wasp deploy fly deploy
```

#### 8.3 Post-deployment Verification
**Status:** ⏳ Pending

**Verify:**
- [ ] Production site loads without errors
- [ ] Open DevTools → Network tab on production site
- [ ] Verify Plausible script loads
- [ ] Check Plausible dashboard for incoming production data (wait 5-10 minutes)
- [ ] Test navigation between pages
- [ ] Check admin dashboard analytics (if applicable)
- [ ] Monitor error logs for any analytics-related issues

---

## 🗂️ Files Modified Summary

### Configuration Files
- [ ] `main.wasp` (lines 34-39) - Replace GA script with Plausible
- [ ] `.env.server` - Update environment variables
- [ ] `.env.client` - Remove GA env var
- [ ] `blog/astro.config.mjs` (lines 82-98) - Replace GA script

### Source Code Files
- [ ] `src/analytics/stats.ts` (line 5) - Switch import to Plausible provider
- [ ] `src/server/envValidation.ts` (lines 92-95, 216-218) - Update validation
- [ ] `src/server/startupValidation.ts` (lines 361-376) - Update checks
- [ ] `src/server/monitoringAlerts.ts` (lines 109-111, 342) - Update monitoring
- [ ] `src/server/apiConnectivityTests.ts` (lines 281-283) - Update tests
- [ ] `src/client/App.tsx` (line 43) - Remove/update cookie consent (optional)

### Cookie Consent (If Removing)
- [ ] `src/client/components/cookie-consent/Config.ts` - Delete or modify
- [ ] `src/client/components/cookie-consent/Banner.tsx` - Delete or modify
- [ ] Entire `src/client/components/cookie-consent/` directory - Delete

### Scripts
- [ ] `deploy-full.sh` (lines 88-91) - Remove GA env var export
- [ ] `scripts/production-readiness-check.sh` (line 146) - Update checks
- [ ] `scripts/sync-env-secrets.sh` - Update if needed

### Documentation
- [ ] `README.md` (multiple sections) - Update analytics instructions
- [ ] `docs/GOOGLE_ANALYTICS_*.md` - Archive or delete
- [ ] `docs/PLAUSIBLE_MIGRATION_PLAN.md` - This file!

---

## 🔧 Rollback Plan

If you need to rollback to Google Analytics:

1. Revert all code changes using git:
   ```bash
   git log --oneline  # Find commit before migration
   git revert <commit-hash>
   ```

2. Restore environment variables:
   ```bash
   fly secrets set GOOGLE_ANALYTICS_CLIENT_EMAIL="..." GOOGLE_ANALYTICS_PROPERTY_ID="..." GOOGLE_ANALYTICS_PRIVATE_KEY="..."
   ```

3. Redeploy: `./deploy-full.sh`

---

## 📝 Notes & Lessons Learned

_Add notes here as you go through the migration_

- 

---

## ✅ Final Checklist

Before marking migration as complete:

- [ ] All phases completed
- [ ] Production site verified working
- [ ] Plausible dashboard showing data
- [ ] No JavaScript errors in browser console
- [ ] Admin dashboard analytics working (if applicable)
- [ ] E2E tests passing
- [ ] Documentation updated
- [ ] Team notified of changes
- [ ] Old Google Analytics docs archived
- [ ] Environment variables documented

---

**Migration Completed:** [ ] Yes  [ ] No  
**Date Completed:** _______________  
**Completed By:** _______________

