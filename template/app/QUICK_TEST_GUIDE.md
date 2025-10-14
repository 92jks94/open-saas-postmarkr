# Quick Testing Guide - TanStack Implementation

## 🎯 What Was Implemented

All three major pages now use TanStack Table with server-side pagination:

1. **MailHistoryPage** (`/mail/history`) - ✅ Complete
2. **AddressManagementPage** (`/address-management`) - ✅ Complete  
3. **FileUploadPage** (`/file-upload`) - ✅ Complete

## 🚀 Testing Priority Order

### 1. FileUploadPage (`/file-upload`) - TEST FIRST
**Why:** Most complex with upload queue + table

**Test Checklist:**
- [ ] Upload queue still works (drag/drop files)
- [ ] Progress bars show correctly
- [ ] Files appear in table after upload
- [ ] Table/Card view toggle works
- [ ] Column visibility toggle works
- [ ] Download file works
- [ ] Delete file works
- [ ] Pagination works (if you have 20+ files)
- [ ] Processing status updates automatically

**Upload a file to test:**
- Drag/drop a PDF or image
- Watch progress bar
- Verify it appears in the table below
- Try toggling to card view
- Try downloading it
- Try deleting it

---

### 2. MailHistoryPage (`/mail/history`) - TEST SECOND
**Why:** Server-side sorting is new

**Test Checklist:**
- [ ] Table loads with mail pieces
- [ ] Click column headers to sort (Description, Status, Type, Cost, Date)
- [ ] Sorting changes order correctly
- [ ] Default sort is newest first (createdAt desc)
- [ ] Table/Card view toggle works
- [ ] Column visibility works
- [ ] Pagination works (if you have 20+ items)
- [ ] Click mail piece to view details
- [ ] Delete draft works (if you have drafts)

**How to test sorting:**
- Click "Description" header - should sort A-Z
- Click again - should sort Z-A
- Click "Created At" - should sort oldest/newest
- Verify page resets to 1 when sorting changes

---

### 3. AddressManagementPage (`/address-management`) - TEST THIRD
**Why:** Complete UI refactor with modals

**Test Checklist:**
- [ ] Addresses display in table
- [ ] Click "+ New Address" opens modal
- [ ] Create new address works
- [ ] LOB validation runs on create
- [ ] Edit address (pencil icon) opens modal
- [ ] Edit saves correctly
- [ ] Delete address works (trash icon)
- [ ] Confirmation dialog shows before delete
- [ ] Table/Card view toggle works
- [ ] Search works (type contact name or company)
- [ ] Filter by type works (dropdown: Sender/Recipient/Both)
- [ ] Pagination works (if you have 20+ addresses)

**How to test create:**
1. Click "+ New Address"
2. Fill in form (required fields marked with *)
3. Submit
4. Should see validation spinner
5. Should appear in table

---

## 🐛 Common Issues to Watch For

### Build Errors
- ✅ Already fixed - should have none

### UI Issues
- [ ] Cards not responsive on mobile
- [ ] Table doesn't scroll on mobile
- [ ] Modals cut off on small screens
- [ ] Icons not displaying correctly

### Functionality Issues
- [ ] Sorting doesn't work or sorts wrong
- [ ] Pagination shows wrong page numbers
- [ ] Delete doesn't remove items
- [ ] Create/Edit doesn't save
- [ ] Upload queue doesn't show progress

### Performance Issues
- [ ] Slow loading (should be fast with pagination)
- [ ] Laggy sorting/filtering
- [ ] Upload progress stutters
- [ ] Memory leaks (check browser DevTools)

---

## 📱 Responsive Testing

Test each page at these breakpoints:

1. **Mobile (375px)** - iPhone SE
   - Cards should stack vertically
   - Table should scroll horizontally
   - Modals should fit screen

2. **Tablet (768px)** - iPad
   - 2-column card grid
   - Table readable
   - Modals sized well

3. **Desktop (1440px)** - Standard laptop
   - 3-column card grid (where applicable)
   - Full table visible
   - All controls accessible

---

## ✅ Success Indicators

You'll know it's working when:

1. **FileUploadPage:**
   - Upload works smoothly
   - Table shows files correctly
   - Both views (table/card) display all data
   - Actions (download/delete) work

2. **MailHistoryPage:**
   - Sorting changes order correctly
   - Pagination shows correct pages
   - View toggle switches correctly
   - Can delete drafts

3. **AddressManagementPage:**
   - CRUD operations work (Create, Edit, Delete)
   - Search finds addresses
   - Modals open/close smoothly
   - Validation indicators show

---

## 🔍 Browser Console

Keep DevTools open and watch for:

- ❌ Red errors (report immediately)
- ⚠️ Yellow warnings (note but usually OK)
- 🔵 Info logs (expected)

### Expected Logs:
- "Wasp: useQuery - fetching..."
- "Upload progress: XX%"
- "File uploaded successfully"

### Unexpected Errors:
- "Cannot read property of undefined"
- "Network error"
- "404 Not Found"
- "500 Server Error"

---

## 📊 Test Data

For thorough testing, you'll need:

- [ ] At least 25 mail pieces (to test pagination)
- [ ] At least 25 addresses (to test pagination)
- [ ] At least 25 files (to test pagination)
- [ ] Mix of drafts and sent mail
- [ ] Mix of validated/invalid addresses
- [ ] Mix of processing/validated/failed files

**Quick way to create test data:**
1. Upload 5 files
2. Create 5 addresses
3. Create 5 mail pieces
4. Repeat until you have 20+ of each

---

## 🚨 Report Issues

If you find a bug, note:

1. **Which page** - MailHistory / AddressManagement / FileUpload
2. **What action** - Sorting / Pagination / Delete / etc.
3. **What happened** - Error message / Wrong behavior
4. **What you expected** - Correct behavior
5. **Browser console** - Any error messages

Example:
> **Page:** FileUploadPage  
> **Action:** Delete file  
> **Issue:** File doesn't disappear from table  
> **Expected:** File should be removed immediately  
> **Console:** Error: "Cannot refetch query"

---

## 🎉 When Testing is Complete

Once all features work:

1. ✅ Check off all items in `docs/TESTING_CHECKLIST.md`
2. ✅ Document any issues found
3. ✅ Mark todos as complete
4. ✅ Ready for production!

---

## 🔗 Related Documentation

- Full test plan: `docs/TESTING_CHECKLIST.md`
- Implementation summary: `docs/TANSTACK_IMPLEMENTATION_FINAL.md`
- Usage guide: `docs/DATA_TABLE_USAGE_GUIDE.md`

---

**Ready to test! Sign in and start with FileUploadPage.** 🚀

