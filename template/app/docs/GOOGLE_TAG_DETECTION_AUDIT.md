# Google Tag Detection Audit Report

**Date**: 2025-10-11  
**Issue**: Google Tag is not being detected by Google Tag Assistant and other detection tools

## Executive Summary

The Google Analytics implementation is **not loading properly** because:
1. The Google Tag script is loaded **dynamically via JavaScript** instead of in the HTML `<head>`
2. Google Tag Assistant and similar tools expect the script in the initial HTML, not loaded after page load
3. There's an **inconsistency** between the hardcoded ID in the cookie consent and environment variable usage
4. The blog subdomain has the correct implementation, but the main app does not

## Critical Issues Found

### Issue 1: Dynamic Script Loading (CRITICAL)
**Location**: `src/client/components/cookie-consent/Config.ts` lines 115-141

**Problem**:
```typescript
// Current approach - loads AFTER page loads via JavaScript
const script = document.createElement('script');
script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
document.body.appendChild(script);
```

**Why This Fails**:
- Google Tag Assistant scans the initial HTML DOM
- Dynamically added scripts after page load are often not detected
- Google's own documentation recommends the tag in the `<head>` section
- SEO and tracking tools expect synchronous loading

**Expected Approach**:
```html
<!-- Should be in the HTML <head> BEFORE JavaScript runs -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-6H2SB3GJDW"></script>
```

### Issue 2: Missing Google Tag in HTML Head
**Location**: `main.wasp` lines 8-35

**Problem**: 
The `head` array in `main.wasp` does NOT include the Google Tag script. It should include:

```wasp
head: [
  // ... existing meta tags ...
  
  // Google Analytics - MUST be in head for proper detection
  "<script async src='https://www.googletagmanager.com/gtag/js?id=G-6H2SB3GJDW'></script>",
  
  // ... rest of tags
]
```

### Issue 3: Inconsistent ID Configuration
**Locations**:
- `src/client/components/cookie-consent/Config.ts` line 69: **Hardcoded** `'G-6H2SB3GJDW'`
- `src/client/components/cookie-consent/Banner.tsx` line 45: Tries to use **`import.meta.env.VITE_GOOGLE_ANALYTICS_ID`**
- `blog/astro.config.mjs` line 86: Uses **`process.env.GOOGLE_ANALYTICS_ID`**

**Problem**: 
- Three different approaches to getting the same ID
- No `.env.client` file exists in the project
- The environment variable in Banner.tsx will always be undefined
- Configuration is scattered across multiple files

### Issue 4: Cookie Consent Blocking Initial Load
**Location**: `src/client/components/cookie-consent/Banner.tsx`

**Problem**:
- The script only loads AFTER user accepts cookies
- Google Tag Assistant scans the page immediately on load
- Even if user accepts, the detection window has passed
- No initial pageview is ever recorded by the time Tag Assistant checks

### Issue 5: Fallback Logic Has Critical Bug
**Location**: `src/client/components/cookie-consent/Banner.tsx` line 92

**Critical Bug**:
```typescript
// Line 92 - Missing the GA_ANALYTICS_ID in the URL!
const scriptUrl = `https://www.googletagmanager.com/gtag/js?id=`;  // ❌ MISSING ID
script.src = scriptUrl;
```

The fallback function creates a script tag but **forgets to append the Analytics ID** to the URL!

Should be:
```typescript
const scriptUrl = `https://www.googletagmanager.com/gtag/js?id=${GA_ANALYTICS_ID}`;
```

## Architecture Analysis

### Current Flow (BROKEN)
```
1. Page loads with main.wasp head tags
2. React app mounts
3. CookieConsentBanner component mounts
4. Cookie consent modal shows
5. User accepts (or has prior consent)
6. onAccept() callback fires
7. JavaScript creates script tag
8. Script tag appends to body
9. Google Tag loads (too late for Tag Assistant)
```

### Recommended Flow (FIXED)
```
1. Page loads with Google Tag script IN <head>
2. Script is blocked from executing by data-consent attribute
3. React app mounts
4. CookieConsentBanner component mounts
5. Cookie consent modal shows
6. User accepts (or has prior consent)
7. onAccept() removes blocking attribute
8. Google Tag initializes
9. gtag('config') called with proper settings
```

## Comparison with Blog Implementation

The **blog subdomain works correctly** because:

```javascript
// blog/astro.config.mjs lines 82-98
head: [
  {
    tag: 'script',
    attrs: {
      src: `https://www.googletagmanager.com/gtag/js?id=${process.env.GOOGLE_ANALYTICS_ID}`,
    },
  },
  {
    tag: 'script',
    content: `
      window.dataLayer = window.dataLayer || [];
      function gtag(){dataLayer.push(arguments);}
      gtag('js', new Date());
      gtag('config', '${process.env.GOOGLE_ANALYTICS_ID}');
    `,
  },
]
```

This loads the script in the **initial HTML render**, making it detectable by Google Tag Assistant.

## Environment Variable Issues

**No .env files found in project root**:
```
$ find . -name ".env*"
(no results)
```

**Expected files**:
- `.env.client` - For `VITE_GOOGLE_ANALYTICS_ID` (client-side vars)
- `.env.server` - For server-side Google Analytics API credentials (already documented in README)

**Current situation**:
- ID is hardcoded in `Config.ts`
- No way to change it per environment
- Deployment scripts need to be updated to set these

## Detection Tools Analysis

Why Tag Assistant doesn't detect the current implementation:

1. **Tag Assistant Chrome Extension**: Scans DOM on initial page load only
2. **Google Tag Assistant Legacy**: Checks `<head>` for gtag.js script
3. **Google Analytics Debugger**: Looks for dataLayer before user interaction
4. **View Page Source**: Shows static HTML - dynamic scripts won't appear

All these tools expect the **script in the initial HTML**, not dynamically added.

## Recommendations

### Priority 1: Fix Script Loading (CRITICAL)
Add Google Tag script to `main.wasp` head section immediately:

```wasp
head: [
  // Existing tags...
  
  // Google Analytics - Load early but don't initialize until consent
  "<script async src='https://www.googletagmanager.com/gtag/js?id=G-6H2SB3GJDW'></script>",
]
```

### Priority 2: Fix Cookie Consent Integration
Modify cookie consent to work with pre-loaded script:

1. Script loads in head but doesn't auto-initialize
2. Cookie consent controls when gtag('config') is called
3. Use `data-consent` attributes or similar to block execution

### Priority 3: Fix Configuration Management
Create proper environment variable setup:

1. Create `.env.client` with:
   ```
   VITE_GOOGLE_ANALYTICS_ID=G-6H2SB3GJDW
   ```

2. Update all references to use the same variable

3. Update deployment scripts to set this variable

### Priority 4: Fix Fallback Bug
Fix line 92 in Banner.tsx to include the Analytics ID in the script URL.

### Priority 5: Add Verification Tools
Add inline script to verify tag loading:

```html
<script>
  // Debug helper - logs when GA loads
  window.addEventListener('load', () => {
    console.log('Google Tag loaded:', !!window.gtag);
    console.log('DataLayer:', window.dataLayer);
  });
</script>
```

## Implementation Plan

### Step 1: Immediate Fix (< 1 hour)
1. Add Google Tag script to `main.wasp` head array
2. Fix the bug on line 92 in Banner.tsx
3. Remove dynamic script creation (keep config calls only)
4. Test with Tag Assistant

### Step 2: Environment Setup (< 30 min)
1. Create `.env.client` file with `VITE_GOOGLE_ANALYTICS_ID`
2. Update Config.ts to use environment variable
3. Update deployment documentation

### Step 3: Cookie Consent Refinement (1-2 hours)
1. Research best practices for GDPR-compliant Google Tag loading
2. Implement script blocking until consent
3. Test consent flow thoroughly
4. Verify Tag Assistant detection

### Step 4: Documentation (30 min)
1. Update README with correct setup instructions
2. Document environment variables needed
3. Add troubleshooting guide for Tag Assistant

## Testing Checklist

After implementing fixes:

- [ ] View page source - see Google Tag script in `<head>`
- [ ] Google Tag Assistant shows tag detected
- [ ] Network tab shows gtag/js request
- [ ] Console shows dataLayer initialization
- [ ] Cookie consent still blocks tracking until accepted
- [ ] After accepting, events appear in GA4 debug view
- [ ] Hard refresh still shows tag detected
- [ ] Incognito mode shows tag detected before consent

## Related Files to Update

1. `main.wasp` - Add script to head array
2. `src/client/components/cookie-consent/Config.ts` - Remove dynamic script creation
3. `src/client/components/cookie-consent/Banner.tsx` - Fix bug, simplify logic
4. `.env.client` (create new) - Add VITE_GOOGLE_ANALYTICS_ID
5. `README.md` - Update analytics setup instructions
6. `.gitignore` - Ensure .env files are ignored

## Compliance Note

⚠️ **Important**: Even with the script in the `<head>`, you must ensure:
- No data is sent to Google until user consents
- Cookie consent modal shows before any tracking
- Users can opt-out and have GA cookies cleared
- Privacy policy accurately describes data collection

The script can be present in HTML, but `gtag('config')` should only be called after consent.

## Conclusion

The Google Tag is not being detected because:
1. ❌ Script is loaded dynamically after page load
2. ❌ Script is not in the HTML `<head>` section  
3. ❌ Cookie consent blocks script loading, not just initialization
4. ❌ Fallback code has a critical bug

The fix is straightforward:
1. ✅ Add script to `main.wasp` head section
2. ✅ Let cookie consent control when gtag('config') is called
3. ✅ Fix the fallback bug
4. ✅ Use environment variables consistently

**Estimated fix time**: 2-3 hours including testing
**Impact**: HIGH - Google Analytics will be properly detected and functional

