# 🚨 S3 CORS Configuration Fix

## Problem Identified

Your S3 bucket CORS configuration is **missing POST and PUT methods**, which prevents client-side file uploads from working.

## Current CORS Configuration (❌ BROKEN)

```json
{
  "AllowedHeaders": ["*"],
  "AllowedMethods": ["GET", "HEAD"],  // ❌ Missing POST and PUT!
  "AllowedOrigins": [
    "https://postmarkr-server-client.fly.dev",
    "https://postmarkr.com",
    "https://www.postmarkr.com",
    "http://localhost:3000",
    "http://localhost:3001",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:3001"
  ],
  "ExposeHeaders": ["ETag", "Content-Type", "Content-Length"],
  "MaxAgeSeconds": 3600
}
```

## Fixed CORS Configuration (✅ WORKING)

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

## How to Fix

### Option 1: AWS Console (Easiest)

1. **Open your S3 bucket**:
   ```
   https://s3.console.aws.amazon.com/s3/buckets/myawspostmarrbucket?region=us-east-2&tab=permissions
   ```

2. **Click the "Permissions" tab**

3. **Scroll down to "Cross-origin resource sharing (CORS)"**

4. **Click "Edit"**

5. **Replace the entire configuration with**:
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

6. **Click "Save changes"**

### Option 2: AWS CLI

```bash
# Create a file named cors-config.json with the fixed configuration
cat > cors-config.json << 'EOF'
{
  "CORSRules": [
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
}
EOF

# Apply the CORS configuration
aws s3api put-bucket-cors \
  --bucket myawspostmarrbucket \
  --cors-configuration file://cors-config.json \
  --region us-east-2

# Verify the configuration was applied
aws s3api get-bucket-cors \
  --bucket myawspostmarrbucket \
  --region us-east-2
```

## Verification

After fixing the CORS configuration:

1. **Clear your browser cache** or open an incognito window

2. **Try uploading a file** in the Postmarkr app

3. **Check browser console** - you should NO LONGER see CORS errors

4. **Check the Network tab** - the S3 POST request should succeed (status 204)

5. **File should show as "valid"** with a green badge

## Why This Happened

The CORS configuration likely came from an S3 bucket template or wizard that only configured read operations (GET, HEAD), but didn't include write operations (POST, PUT) needed for file uploads.

Presigned POST URLs (used by this app) require POST method to be allowed in CORS.

## Additional Notes

- **POST method**: Used by presigned POST URLs for browser-based uploads
- **PUT method**: Alternative upload method, good to include for compatibility
- **ExposeHeaders**: Allows JavaScript to read response headers from S3
- **MaxAgeSeconds**: Browser caches CORS preflight response for 1 hour

## Security Notes

This CORS configuration is secure because:
- ✅ Only allows specific origins (your domains)
- ✅ Only allows necessary HTTP methods
- ✅ Does not expose bucket to public uploads (presigned URLs are still required)
- ✅ IAM permissions still control who can create presigned URLs

## After Fixing

Once CORS is fixed, file uploads should work immediately without needing to restart your application.

If uploads still fail after fixing CORS:
1. Check IAM permissions (script test passed, so this is OK)
2. Check browser console for other errors
3. Check Wasp server logs for any errors
4. Run the S3 connection test again: `npx tsx scripts/test-s3-connection.ts`

