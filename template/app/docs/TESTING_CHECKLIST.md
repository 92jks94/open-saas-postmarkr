# TanStack Table Implementation - Testing Checklist

## Overview
This checklist covers all functional, UI, and integration tests for the TanStack Table implementation across the application.

## Build Status
✅ All TypeScript compilation errors resolved
✅ No linter errors found
✅ All imports and dependencies correct

---

## 1. MailHistoryPage (`/mail/history`)

### Server-Side Pagination
- [ ] Navigate to first page
- [ ] Navigate to last page  
- [ ] Navigate to next/previous page
- [ ] Verify correct page numbers displayed
- [ ] Verify total count displayed correctly
- [ ] Pagination controls disabled appropriately (first/last page)

### Server-Side Sorting
- [ ] Sort by Description (asc/desc)
- [ ] Sort by Status (asc/desc)
- [ ] Sort by Mail Type (asc/desc)
- [ ] Sort by Cost (asc/desc)
- [ ] Sort by Created At (asc/desc)
- [ ] Default sort is createdAt desc (newest first)
- [ ] Sorting resets to page 1

### View Modes
- [ ] Toggle to Table view
- [ ] Toggle to Card view
- [ ] View mode persists on page refresh (localStorage)
- [ ] All data visible in both views
- [ ] Cards display correctly on mobile

### Column Visibility (Table View)
- [ ] Hide/show individual columns
- [ ] Column visibility persists on page refresh
- [ ] Actions column always visible (not hideable)

### Actions
- [ ] Click to view mail piece details
- [ ] Delete draft mail piece (confirmation dialog)
- [ ] Delete action refetches data correctly
- [ ] Cannot delete non-draft items

### Data Integrity
- [ ] All mail pieces display correct data
- [ ] Status badges show correct colors/states
- [ ] Cost formatting correct ($X.XX)
- [ ] Dates formatted correctly
- [ ] Thumbnail images load (if available)

---

## 2. AddressManagementPage (`/address-management`)

### Server-Side Pagination
- [ ] Navigate through pages
- [ ] Correct page indicators
- [ ] Total count accurate

### Search & Filters
- [ ] Search by contact name
- [ ] Search by company name
- [ ] Search by address line 1
- [ ] Search by label
- [ ] Filter by address type (sender/recipient/both)
- [ ] Search is case-insensitive
- [ ] Clear search resets results

### View Modes
- [ ] Table view displays all columns
- [ ] Card view shows address cards
- [ ] Toggle persists on refresh
- [ ] Responsive layout (1 col mobile, 2 col tablet, 3 col desktop)

### CRUD Operations
- [ ] Create new address (opens modal)
- [ ] Form validation works (required fields)
- [ ] LOB validation on create
- [ ] Edit existing address (modal)
- [ ] Edit saves changes correctly
- [ ] Delete address (confirmation)
- [ ] Delete refetches data
- [ ] Set default address works

### Validation Indicators
- [ ] Green checkmark for validated addresses
- [ ] Red X for invalid addresses (with error tooltip)
- [ ] Yellow alert for not validated
- [ ] Validation status updates after LOB check

### Data Display
- [ ] Full address formatted correctly
- [ ] Company name shown when present
- [ ] Label displayed (or "None")
- [ ] Address type badge (Sender/Recipient)
- [ ] Created date formatted

---

## 3. FileUploadPage (`/file-upload`)

### Upload Queue (Preserved Functionality)
- [ ] Drag and drop files
- [ ] Click to select files
- [ ] Multiple file upload queue
- [ ] Upload progress shows percentage
- [ ] Upload speed displayed
- [ ] Time remaining calculated
- [ ] Success/error status icons
- [ ] Remove completed uploads from queue
- [ ] PDF thumbnail generation works
- [ ] File validation (size, type) before upload

### Server-Side Pagination (New)
- [ ] Uploaded files table paginated
- [ ] Navigate through file pages
- [ ] Correct page indicators
- [ ] Total file count accurate

### View Modes (New)
- [ ] Table view with all columns
- [ ] Card view with FilePreviewCard
- [ ] Toggle between views
- [ ] Both views show all file data

### Column Visibility (Table View)
- [ ] Hide/show columns
- [ ] Actions column always visible

### File Actions
- [ ] Download file (opens in new tab)
- [ ] Delete file (confirmation)
- [ ] Delete refetches list
- [ ] Download loading state shows

### File Status & Metadata
- [ ] File type icon (PDF red, Image blue)
- [ ] File size formatted correctly
- [ ] Page count displayed for PDFs
- [ ] Validation status badge:
  - [ ] Green "Validated" for valid files
  - [ ] Red "Failed" for failed validation
  - [ ] Yellow "Processing" with spinner
  - [ ] Gray "Pending" for not processed
- [ ] Upload date formatted

### Processing Status Polling
- [ ] Conditional polling only when files are processing
- [ ] Polling stops when no processing files
- [ ] Status updates automatically in table
- [ ] No unnecessary database queries

### Responsive Design
- [ ] Card grid: 1 column on mobile, 2 on tablet
- [ ] Table scrolls horizontally on mobile
- [ ] Upload dropzone works on mobile
- [ ] Actions accessible on all screen sizes

---

## 4. Cross-Component Consistency

### DataTable Component
- [ ] Same component used for all tables
- [ ] Column visibility toggle works consistently
- [ ] Search functionality consistent (where enabled)
- [ ] Pagination UI consistent
- [ ] Loading states consistent
- [ ] Empty states consistent

### Column Definitions
- [ ] All use ColumnDef pattern
- [ ] Consistent use of accessorKey
- [ ] Consistent cell renderer patterns
- [ ] Actions column pattern consistent
- [ ] Sorting headers consistent (ArrowUpDown icon)

### Server Operations
- [ ] All paginated queries follow same pattern
- [ ] Consistent input validation (page, limit)
- [ ] Consistent return type (items, total, page, totalPages)
- [ ] Error handling consistent
- [ ] Authorization checks consistent

### Styling & UX
- [ ] Consistent card styles
- [ ] Consistent button variants
- [ ] Consistent badge styles
- [ ] Consistent empty states
- [ ] Consistent loading spinners
- [ ] Dark mode compatible (if enabled)

---

## 5. Performance Testing

### Database Queries
- [ ] No N+1 query issues
- [ ] Pagination reduces query load
- [ ] Includes/relations optimized
- [ ] Conditional polling in FileUploadPage works

### Client Performance
- [ ] No unnecessary re-renders
- [ ] Memoization where appropriate
- [ ] Large datasets (100+ items) paginate correctly
- [ ] Table/card view toggle is instant
- [ ] Column visibility toggle is instant

### Network
- [ ] Refetches only when necessary
- [ ] Polling interval appropriate
- [ ] File downloads don't block UI
- [ ] Upload progress updates smoothly

---

## 6. Error Handling

### User Errors
- [ ] Invalid file upload shows error
- [ ] Validation errors display clearly
- [ ] Form validation errors show in modals
- [ ] Delete confirmations prevent accidents

### Server Errors
- [ ] 401 Unauthorized redirects to login
- [ ] 404 Not Found shows appropriate message
- [ ] 500 Server Error shows user-friendly message
- [ ] Network errors retry or show error state

### Edge Cases
- [ ] Empty states display when no data
- [ ] Last item deleted refetches correctly
- [ ] Page number adjusts if current page becomes invalid
- [ ] Search with no results shows empty state

---

## 7. Responsive Design

### Mobile (< 640px)
- [ ] Cards stack vertically
- [ ] Table scrolls horizontally
- [ ] Touch targets large enough
- [ ] Modals fit screen
- [ ] Upload dropzone accessible

### Tablet (640px - 1024px)
- [ ] 2-column card grid
- [ ] Table readable or switches to cards
- [ ] Filters accessible
- [ ] Modals sized appropriately

### Desktop (> 1024px)
- [ ] 3-column card grid (where applicable)
- [ ] Full table visible
- [ ] All controls accessible
- [ ] Modals centered and sized well

---

## Testing Instructions

### Setup
1. Start the Wasp dev server: `wasp start`
2. Ensure database is running
3. Log in as a test user
4. Create test data if needed

### Testing Flow
1. Start with MailHistoryPage - test all features
2. Move to AddressManagementPage - test CRUD operations
3. Test FileUploadPage - upload files, test views
4. Check cross-page consistency
5. Test responsive design at different breakpoints
6. Test error scenarios (network issues, invalid data)

### Test Data Requirements
- At least 25 mail pieces (to test pagination)
- At least 25 addresses (to test pagination)
- At least 25 files (to test pagination)
- Mix of validated/invalid addresses
- Mix of validated/processing/failed files
- Draft and sent mail pieces

---

## Success Criteria

✅ All functional tests pass
✅ All view modes work correctly
✅ Server-side pagination works on all pages
✅ No console errors
✅ No linter errors
✅ Responsive design works on all breakpoints
✅ Performance is acceptable (no lag, smooth interactions)
✅ Error handling graceful and user-friendly
✅ Data integrity maintained across operations

---

## Known Issues / Future Enhancements

- [ ] Add localStorage persistence for column visibility (optional)
- [ ] Add export functionality (CSV/PDF)
- [ ] Add bulk operations (select multiple, delete multiple)
- [ ] Add advanced filters (date range, multi-select)
- [ ] Add sorting to AddressManagementPage and FileUploadPage

---

## Sign-Off

Tested by: ________________
Date: ________________
Build Version: ________________
All tests passing: ☐ Yes ☐ No (see notes)

Notes:
_______________________________________________________________________________
_______________________________________________________________________________
_______________________________________________________________________________

