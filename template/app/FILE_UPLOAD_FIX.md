# 🚨 File Upload Issue - QUICK FIX

## What's Wrong?

Your file uploads are failing because **S3 CORS is missing POST/PUT methods**.

## The Problem

```
Current CORS: ["GET", "HEAD"]        ❌ Missing POST!
Required CORS: ["GET", "HEAD", "POST", "PUT"]  ✅
```

## Quick Fix (5 minutes)

### Step 1: Open AWS S3 Console
```
https://s3.console.aws.amazon.com/s3/buckets/myawspostmarrbucket?region=us-east-2&tab=permissions
```

### Step 2: Edit CORS Configuration

1. Click "Permissions" tab
2. Scroll to "Cross-origin resource sharing (CORS)"
3. Click "Edit"
4. **Replace** with this:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "HEAD", "POST", "PUT"],
    "AllowedOrigins": [
      "https://postmarkr-server-client.fly.dev",
      "https://postmarkr.com",
      "https://www.postmarkr.com",
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:3001"
    ],
    "ExposeHeaders": [
      "ETag",
      "Content-Type",
      "Content-Length",
      "x-amz-server-side-encryption",
      "x-amz-request-id",
      "x-amz-id-2"
    ],
    "MaxAgeSeconds": 3600
  }
]
```

5. Click "Save changes"

### Step 3: Test Upload

1. Refresh your app
2. Upload a PDF file
3. File should now show as **VALID** ✅

## What I Did

✅ Created diagnostic script: `scripts/test-s3-connection.ts`
✅ Tested S3 connection - credentials work perfectly
✅ Identified CORS misconfiguration
✅ Created detailed fix guide: `docs/S3_CORS_FIX.md`

## Verify the Fix

After updating CORS, check:
- ✅ Browser console has NO CORS errors
- ✅ Network tab shows S3 POST succeeds (204 status)
- ✅ Files show "valid" status with green badge
- ✅ Files have thumbnails and are selectable

## Why This Happened

Your S3 bucket CORS was configured for **reading files** (GET) but not for **uploading files** (POST). The app creates presigned POST URLs for direct browser-to-S3 uploads, which requires POST to be allowed in CORS.

## After the Fix

Once CORS is updated:
- ✅ New uploads will work immediately
- ✅ Old invalid files need to be deleted and re-uploaded
- ✅ No app restart needed

Need more details? See `docs/S3_CORS_FIX.md`

