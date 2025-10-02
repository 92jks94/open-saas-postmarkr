# S3 CORS Configuration Fix

## Problem
The production client is getting CORS errors when trying to upload files to S3:
```
Access to XMLHttpRequest at 'https://myawspostmarrbucket.s3.us-east-2.amazonaws.com/' from origin 'https://postmarkr-client.fly.dev' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solution

### Option 1: Use the Automated Script (Recommended)

1. **Install dependencies** (if not already installed):
   ```bash
   npm install @aws-sdk/client-s3 dotenv
   ```

2. **Run the CORS configuration script**:
   ```bash
   node scripts/configure-s3-cors.js
   ```

3. **Verify the configuration** by testing file uploads in production.

### Option 2: Manual AWS Console Configuration

1. **Go to AWS S3 Console**:
   - Navigate to your S3 bucket: `myawspostmarrbucket`
   - Go to the "Permissions" tab
   - Scroll down to "Cross-origin resource sharing (CORS)"

2. **Add the following CORS configuration**:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
       "AllowedOrigins": [
         "https://postmarkr-client.fly.dev",
         "https://postmarkr-server.fly.dev", 
         "https://postmarkr.com",
         "https://www.postmarkr.com",
         "http://localhost:3000",
         "http://localhost:3001"
       ],
       "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
       "MaxAgeSeconds": 3000
     }
   ]
   ```

3. **Save the configuration**

### Option 3: AWS CLI Configuration

```bash
# Create a CORS configuration file
cat > cors-config.json << EOF
{
  "CORSRules": [
    {
      "AllowedHeaders": ["*"],
      "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
      "AllowedOrigins": [
        "https://postmarkr-client.fly.dev",
        "https://postmarkr-server.fly.dev",
        "https://postmarkr.com", 
        "https://www.postmarkr.com",
        "http://localhost:3000",
        "http://localhost:3001"
      ],
      "ExposeHeaders": ["ETag", "x-amz-meta-custom-header"],
      "MaxAgeSeconds": 3000
    }
  ]
}
EOF

# Apply the CORS configuration
aws s3api put-bucket-cors --bucket myawspostmarrbucket --cors-configuration file://cors-config.json

# Verify the configuration
aws s3api get-bucket-cors --bucket myawspostmarrbucket
```

## Required Environment Variables

Make sure these environment variables are set in your `.env.server` file:

```bash
AWS_S3_REGION=us-east-2
AWS_S3_IAM_ACCESS_KEY=your_access_key_here
AWS_S3_IAM_SECRET_KEY=your_secret_key_here
AWS_S3_FILES_BUCKET=myawspostmarrbucket
```

## Testing

After applying the CORS configuration:

1. **Test file upload** in production
2. **Check browser console** for CORS errors
3. **Verify** that files are uploaded successfully

## Troubleshooting

### Common Issues:

1. **"NoSuchBucket" error**: 
   - Verify the bucket name is correct
   - Check that the bucket exists in the specified region

2. **"AccessDenied" error**:
   - Verify AWS credentials have S3 permissions
   - Check that the IAM user has `s3:PutBucketCors` permission

3. **CORS still not working**:
   - Clear browser cache
   - Check that the origin URL matches exactly (including https/http)
   - Verify the bucket region is correct

### Required IAM Permissions:

The AWS user/role needs these permissions:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutBucketCors",
        "s3:GetBucketCors",
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": [
        "arn:aws:s3:::myawspostmarrbucket",
        "arn:aws:s3:::myawspostmarrbucket/*"
      ]
    }
  ]
}
```
