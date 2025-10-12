# File Upload Feature TODOs

## Cost Calculator Widget

**Status**: Temporarily Hidden  
**File**: `src/file-upload/CostCalculatorWidget.tsx`  
**Last Modified**: October 11, 2025

### Description
The Cost Calculator Widget is a standalone component that provides real-time pricing estimates based on page count. It's been temporarily hidden from users but the code is preserved for future use.

### Features
- Interactive page count input (1-50 pages)
- Real-time cost calculation using `estimateCostFromPages()`
- Displays:
  - Pricing tier (Tier 1/2/3)
  - Envelope type (Standard #10 / Flat 9x12)
  - Total cost breakdown
  - Benefits list (tracking, first-class mail, etc.)
  - Reference pricing table

### To Re-enable
1. Uncomment the import in `src/file-upload/FileUploadPage.tsx` (Line 24-25)
2. Restore grid layout to `lg:grid-cols-3` (Line 450)
3. Restore upload area to `lg:col-span-2` (Line 452)
4. Uncomment the widget render (Lines 714-716)

### Current Implementation Location
- **Component**: `src/file-upload/CostCalculatorWidget.tsx` (preserved, fully functional)
- **Previously Rendered**: Right sidebar (1/3 width on large screens)
- **Layout**: Previously part of Phase 4 grid layout

### Considerations for Re-enabling
- Evaluate if sidebar placement is optimal for user flow
- Consider if cost preview in file preview card (lines 526-528) makes this redundant
- May want to integrate into upload flow rather than separate widget
- Could be useful for users planning mail campaigns before uploading files

### Related Code
- Cost estimation logic: `src/file-upload/pdfThumbnail.ts` → `estimateCostFromPages()`
- Preview card cost display: `src/file-upload/FileUploadPage.tsx` (Lines 526-528)
- Page selector cost display: `src/file-upload/PageRangeSelector.tsx` (Lines 101-122)

---

## Upload Flow Improvements

**Status**: ✅ Completed (October 11, 2025)  
**Implementation**: Option 4 - Preview First Page Only (Recommended)

### What Was Changed
Previously, the upload flow had inconsistent behavior:
- **Single PDFs**: Required manual "Upload & Continue" click after preview
- **Multiple files**: Uploaded immediately without preview
- **Non-PDFs**: Uploaded immediately without preview

This inconsistency was confusing for users.

### New Behavior
**Single PDF files now:**
1. Show preview card with thumbnail, page count, and cost estimate
2. Auto-upload after 3-second countdown
3. User can click "⚡ Upload Now" to skip countdown
4. User can click "✗ Cancel" to abort upload

**Benefits:**
- ✅ Non-blocking flow - users see useful info without waiting
- ✅ Still provides preview information for cost estimation
- ✅ Consistent behavior - all uploads start automatically
- ✅ Users retain control with cancel option
- ✅ Option to skip countdown with "Upload Now" button

### Implementation Details
- Added countdown timer state and cleanup logic
- Timer automatically triggers upload after 3 seconds
- Preview card shows animated countdown indicator
- Cleanup timer on component unmount to prevent memory leaks
- Files: `src/file-upload/FileUploadPage.tsx` (lines 70-226, 601-653)

---

## Other TODOs

_Add additional file upload feature TODOs here as needed_

