# File Upload Troubleshooting Guide

## 🔍 Common Issues

### Issue 1: Files Showing "File failed validation"

**Symptoms:**
- Files appear in the "Invalid Files" section
- Error message: "File failed validation" or "File not found in S3 storage. Upload may have failed."
- Files cannot be selected for mail pieces
- No thumbnail/preview shown

**Root Cause:**
Files were uploaded but never made it to S3 storage, usually because:
1. AWS S3 environment variables weren't configured
2. S3 credentials were incorrect
3. S3 bucket doesn't exist or has wrong permissions
4. Network error during upload

**Solution:**

#### Step 1: Configure AWS S3

Ensure these environment variables are set in `.env.server`:

```bash
AWS_S3_IAM_ACCESS_KEY=your_access_key_here
AWS_S3_IAM_SECRET_KEY=your_secret_key_here
AWS_S3_FILES_BUCKET=your_bucket_name
AWS_S3_REGION=us-east-2
```

#### Step 2: Verify S3 Bucket Configuration

Your S3 bucket needs:

**CORS Configuration:**
```json
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
```

**IAM Policy:**
```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:DeleteObject",
                "s3:HeadObject"
            ],
            "Resource": "arn:aws:s3:::your-bucket-name/*"
        }
    ]
}
```

#### Step 3: Clean Up Invalid Files

**Option A: Delete individual files**
- Go to File Upload page
- Click the delete (trash) icon next to invalid files

**Option B: Bulk delete via operation**
```typescript
import { deleteInvalidFiles } from 'wasp/client/operations';

// Delete all invalid files
await deleteInvalidFiles({});

// Or delete only files older than 7 days
await deleteInvalidFiles({ olderThanDays: 7 });
```

**Option C: Database script**
```bash
npx tsx scripts/cleanup-invalid-files.ts
```

#### Step 4: Re-upload Files
After S3 is properly configured, re-upload your files. They should now:
- ✅ Upload successfully to S3
- ✅ Show "Valid" status with green badge
- ✅ Display thumbnail previews
- ✅ Be selectable for mail pieces

---

### Issue 2: PDF Previews Not Showing in Order Summary

**Symptoms:**
- No PDF preview in Order Summary card
- Shows loading spinner indefinitely
- Shows "Failed to load PDF" error

**Root Cause:**
The `CompactPDFViewer` component can't fetch the PDF from S3 because:
1. File doesn't exist in S3 (see Issue 1)
2. Signed URL expired (rare, auto-retries)
3. S3 credentials are incorrect

**Solution:**
1. Verify the file is valid (green badge in file selector)
2. If file is invalid, delete and re-upload after configuring S3
3. Check browser console for specific error messages
4. Ensure `getDownloadFileSignedURL` operation can access S3

---

### Issue 3: Upload Progress Shows 100% But File Fails

**Symptoms:**
- Upload progress bar reaches 100%
- File appears briefly as valid
- Then changes to "invalid" status

**Root Cause:**
The client-side upload to S3 completes, but:
1. File verification fails (file not actually in S3)
2. Wrong bucket or region configured
3. S3 bucket not accessible

**Solution:**
1. Check S3 bucket name matches exactly
2. Verify bucket region matches `AWS_S3_REGION`
3. Test S3 access with AWS CLI:
   ```bash
   aws s3 ls s3://your-bucket-name --region us-east-2
   ```

---

## 🎯 Quick Fixes

### For Development

If you just want to test locally without S3:
```bash
# Use a local S3-compatible service like MinIO
docker run -p 9000:9000 -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# Update .env.server
AWS_S3_IAM_ACCESS_KEY=minioadmin
AWS_S3_IAM_SECRET_KEY=minioadmin
AWS_S3_FILES_BUCKET=postmarkr-files
AWS_S3_REGION=us-east-1
AWS_S3_ENDPOINT=http://localhost:9000  # Add this to s3Utils.ts
```

### For Production

Deploy to Fly.io with secrets:
```bash
flyctl secrets set \
  AWS_S3_IAM_ACCESS_KEY="your_key" \
  AWS_S3_IAM_SECRET_KEY="your_secret" \
  AWS_S3_FILES_BUCKET="your_bucket" \
  AWS_S3_REGION="us-east-2"
```

---

## 🔧 Validation Status Reference

| Status | Meaning | User Action |
|--------|---------|-------------|
| `null` or `pending` | File just uploaded, processing | Wait for validation |
| `processing` | PDF metadata being extracted | Wait (usually < 10 seconds) |
| `valid` | File ready to use | Can be selected for mail |
| `invalid` | File failed validation or not in S3 | Delete and re-upload |

---

## 📊 Debugging Checklist

When files fail validation, check:

- [ ] AWS S3 credentials are set in `.env.server`
- [ ] S3 bucket exists and is accessible
- [ ] S3 bucket has correct CORS configuration
- [ ] IAM user has required S3 permissions
- [ ] Bucket region matches `AWS_S3_REGION`
- [ ] No typos in bucket name
- [ ] Server logs show no S3 connection errors
- [ ] Browser network tab shows successful upload (204 status)

---

## 🆘 Still Having Issues?

### Check Server Logs
```bash
wasp start  # Look for S3-related errors
```

Look for errors containing:
- `NoSuchBucket` - Bucket doesn't exist
- `InvalidAccessKeyId` - Wrong credentials
- `SignatureDoesNotMatch` - Wrong secret key
- `AccessDenied` - Insufficient permissions

### Test S3 Access Manually

Create `scripts/test-s3-access.ts`:
```typescript
import { S3Client, HeadBucketCommand } from '@aws-sdk/client-s3';

const client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
  },
});

async function testAccess() {
  try {
    await client.send(new HeadBucketCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
    }));
    console.log('✅ S3 access successful!');
  } catch (error) {
    console.error('❌ S3 access failed:', error);
  }
}

testAccess();
```

Run with:
```bash
npx tsx scripts/test-s3-access.ts
```

---

## 📝 Summary

**The most common issue** is missing or incorrect AWS S3 configuration. Files appear to upload but aren't actually stored in S3, causing them to be marked as invalid.

**Quick fix:**
1. Configure AWS S3 properly
2. Delete invalid files
3. Re-upload files
4. Everything should work! ✨

