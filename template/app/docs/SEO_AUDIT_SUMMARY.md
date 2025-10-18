# SEO Audit Summary - Quick Reference

## GPT's Analysis: ✅ **ACCURATE**

I've verified all findings against your codebase. The suggested fixes are sound and compatible with your Astro blog setup.

---

## Top 5 Critical Issues

### 1. 🔴 Duplicate Metadata Everywhere
**Problem:** Lines 16-34 of `main.wasp` apply same title/description/canonical to ALL pages  
**Impact:** 92 duplicate meta descriptions, 95 broken canonicals  
**Fix:** Add `react-helmet-async` for per-page SEO metadata

### 2. 🔴 All Canonicals Point to Homepage
**Problem:** `<link rel='canonical' href='https://postmarkr.com' />` in global head  
**Impact:** Sub-pages (`/about`, `/privacy`, `/terms`) incorrectly reference homepage  
**Fix:** Generate per-page canonical from actual request URL

### 3. 🔴 Static Sitemap Missing Pages
**Problem:** `public/sitemap.xml` only has 3 URLs (and `/pricing` doesn't exist!)  
**Impact:** Missing `/about`, `/privacy`, `/terms`  
**Fix:** Generate dynamic sitemap from actual routes

### 4. 🔴 404 Pages Return HTTP 200
**Problem:** NotFoundPage renders but doesn't send 404 status code  
**Impact:** 15,693 "broken links" indexed instead of ignored  
**Fix:** Add `<meta name="robots" content="noindex, nofollow">` to 404 page

### 5. ⚠️ Development URLs in Production Code
**Problem:** 19 instances of `http://localhost` as fallback values  
**Risk:** If `process.env.WASP_WEB_CLIENT_URL` undefined → mixed content errors  
**Fix:** Remove fallbacks; require HTTPS URLs in production

---

## Secondary Issues

- **16,503 redirect chains**: No www/non-www or http→https enforcement
- **No HSTS header**: Security best practice missing
- **Crawl-delay in robots.txt**: Slows indexing unnecessarily
- **228 images missing alt text**: Accessibility issue
- **95 slow page loads**: Performance optimization needed (future work)

---

## Solution: 3-Step Implementation

### Step 1: Add Per-Page SEO (4-6 hours)
```bash
npm install react-helmet-async
```
- Create `src/seo/SeoProvider.tsx` + `src/seo/Seo.tsx`
- Remove global meta tags from `main.wasp`
- Add `<Seo />` component to each marketing page

### Step 2: Enforce Canonical Host (1-2 hours)
- Update `src/server/setup.ts` middleware
- Redirect `www.postmarkr.com` → `postmarkr.com`
- Redirect `http://` → `https://`
- Add HSTS header

### Step 3: Dynamic Sitemap (2-3 hours)
- Rewrite `src/server/sitemap.ts` to generate XML from route list
- Update `public/robots.txt` (remove Crawl-delay)

**Total Phase 1 Effort:** 1-2 days

---

## Astro Blog Compatibility: ✅ NO ISSUES

- Blog stays on `blog.postmarkr.com` with existing SEO (already perfect!)
- Main app gets new SEO layer on `postmarkr.com`
- No shared configs, no deployment coupling
- **Only risk:** If you enable HSTS with `includeSubDomains`, blog must have valid HTTPS cert (currently does)

---

## Decisions Needed

### 1. Implementation Approach
- **Option A** (Recommended): Code-first SEO now, admin UI later
- **Option B**: Build admin SEO settings page first (slower, more maintainable)

### 2. Canonical Host
- **Option A** (Recommended): Force `https://postmarkr.com` (non-www, modern standard)
- **Option B**: Force `https://www.postmarkr.com` (traditional)

### 3. Robots.txt Policy
- **Recommended**: Remove `Crawl-delay: 1`
- **Recommended**: Keep blocking `/admin`, `/account`, `/mail`, `/api` (privacy requirement)
- Accept Semrush "disallowed resources" warnings as expected behavior

---

## What's Already Working Well ✅

Your Astro blog (`blog/src/components/HeadWithOGImage.astro`) is a **perfect SEO model**:
- ✅ Per-page canonicals
- ✅ Dynamic titles/descriptions
- ✅ JSON-LD structured data
- ✅ Proper OpenGraph/Twitter cards

We'll replicate this pattern for the main app using `react-helmet-async`.

---

## Approval Required

**Ready to proceed with Phase 1 if you confirm:**

1. ✅ Use code-first approach (SEO framework now, admin UI later)
2. ✅ Canonical host: `https://postmarkr.com` (non-www)
3. ✅ Remove Crawl-delay, keep auth page blocks

**Say "approved" or specify changes, and I'll implement the fixes.**

---

## File Impact Summary

**Files to Create (3):**
- `src/seo/SeoProvider.tsx`
- `src/seo/Seo.tsx`
- `src/seo/seoConfig.ts`

**Files to Modify (9):**
- `main.wasp` - Remove global meta tags
- `src/client/App.tsx` - Add SeoProvider wrapper
- `src/server/setup.ts` - Add canonical redirect middleware
- `src/server/sitemap.ts` - Generate dynamic sitemap
- `public/robots.txt` - Remove Crawl-delay
- `src/landing-page/LandingPage.tsx` - Add Seo component
- `src/landing-page/components/AboutPage.tsx` - Add Seo component
- `src/legal/PrivacyPolicyPage.tsx` - Add Seo component
- `src/legal/TermsOfServicePage.tsx` - Add Seo component
- `src/client/components/NotFoundPage.tsx` - Add noindex meta

**Files to Leave Unchanged:**
- All blog files (Astro blog SEO is already perfect)
- All authenticated pages (not indexed anyway)

