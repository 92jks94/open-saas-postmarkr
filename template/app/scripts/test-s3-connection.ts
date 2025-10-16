#!/usr/bin/env ts-node
/**
 * S3 Connection Test Script
 * Tests AWS S3 credentials, bucket access, and CORS configuration
 */

import { S3Client, HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, GetBucketCorsCommand } from '@aws-sdk/client-s3';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env.server') });

const testS3Configuration = async () => {
  console.log('\n🔍 Testing S3 Configuration...\n');
  
  // Check environment variables
  const requiredEnvVars = ['AWS_S3_IAM_ACCESS_KEY', 'AWS_S3_IAM_SECRET_KEY', 'AWS_S3_FILES_BUCKET', 'AWS_S3_REGION'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing environment variables:', missingVars.join(', '));
    console.log('\nPlease add these to your .env.server file');
    process.exit(1);
  }
  
  console.log('✅ All required environment variables are set');
  console.log(`   Bucket: ${process.env.AWS_S3_FILES_BUCKET}`);
  console.log(`   Region: ${process.env.AWS_S3_REGION}`);
  console.log(`   Access Key: ${process.env.AWS_S3_IAM_ACCESS_KEY?.substring(0, 8)}...`);
  
  // Initialize S3 client
  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION!,
    credentials: {
      accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
    },
  });
  
  console.log('\n✅ S3 Client initialized\n');
  
  try {
    // Test 1: Check bucket existence
    console.log('Test 1: Checking bucket existence...');
    const headBucketCommand = new HeadBucketCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
    });
    await s3Client.send(headBucketCommand);
    console.log('✅ Bucket exists and is accessible\n');
  } catch (error: any) {
    console.error('❌ Bucket check failed:', error.message);
    if (error.name === 'NoSuchBucket') {
      console.error('\n💡 Solution: Create the bucket in AWS S3:');
      console.error(`   1. Go to https://s3.console.aws.amazon.com/s3/bucket/create`);
      console.error(`   2. Create bucket named: ${process.env.AWS_S3_FILES_BUCKET}`);
      console.error(`   3. In region: ${process.env.AWS_S3_REGION}`);
    } else if (error.name === 'Forbidden' || error.$metadata?.httpStatusCode === 403) {
      console.error('\n💡 Solution: Check IAM permissions. Your IAM user needs:');
      console.error(`   - s3:ListBucket for bucket: ${process.env.AWS_S3_FILES_BUCKET}`);
      console.error(`   - s3:HeadBucket`);
    }
    process.exit(1);
  }
  
  try {
    // Test 2: Check CORS configuration
    console.log('Test 2: Checking CORS configuration...');
    const getCorsCommand = new GetBucketCorsCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
    });
    const corsResponse = await s3Client.send(getCorsCommand);
    
    if (corsResponse.CORSRules && corsResponse.CORSRules.length > 0) {
      console.log('✅ CORS is configured');
      console.log('   Rules:', JSON.stringify(corsResponse.CORSRules, null, 2));
    } else {
      console.log('⚠️  No CORS rules found\n');
    }
  } catch (error: any) {
    console.log('❌ CORS check failed:', error.message);
    console.log('\n💡 Solution: Add CORS configuration to your S3 bucket:');
    console.log('   1. Go to: https://s3.console.aws.amazon.com/s3/buckets/' + process.env.AWS_S3_FILES_BUCKET);
    console.log('   2. Click "Permissions" tab');
    console.log('   3. Scroll to "Cross-origin resource sharing (CORS)"');
    console.log('   4. Add this configuration:');
    console.log(`
[
    {
        "AllowedHeaders": ["*"],
        "AllowedMethods": ["GET", "POST", "PUT"],
        "AllowedOrigins": ["*"],
        "ExposeHeaders": ["ETag"]
    }
]
    `);
  }
  
  try {
    // Test 3: Try to upload a test file
    console.log('\nTest 3: Testing file upload...');
    const testKey = `test-${Date.now()}.txt`;
    const testContent = 'This is a test file from Postmarkr S3 connection test';
    
    const putCommand = new PutObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
      Key: testKey,
      Body: Buffer.from(testContent),
      ContentType: 'text/plain',
    });
    
    await s3Client.send(putCommand);
    console.log('✅ Test file uploaded successfully');
    
    // Test 4: Try to read the file
    console.log('\nTest 4: Testing file download...');
    const getCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
      Key: testKey,
    });
    
    const getResponse = await s3Client.send(getCommand);
    const downloadedContent = await getResponse.Body?.transformToString();
    
    if (downloadedContent === testContent) {
      console.log('✅ Test file downloaded and verified successfully');
    } else {
      console.log('⚠️  Downloaded content does not match uploaded content');
    }
    
    // Test 5: Clean up test file
    console.log('\nTest 5: Testing file deletion...');
    const deleteCommand = new DeleteObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
      Key: testKey,
    });
    
    await s3Client.send(deleteCommand);
    console.log('✅ Test file deleted successfully');
    
  } catch (error: any) {
    console.error('❌ File operation failed:', error.message);
    console.error('\n💡 Solution: Check IAM permissions. Your IAM user needs:');
    console.error(`   - s3:PutObject`);
    console.error(`   - s3:GetObject`);
    console.error(`   - s3:DeleteObject`);
    console.error(`   for resource: arn:aws:s3:::${process.env.AWS_S3_FILES_BUCKET}/*`);
    
    console.error('\nExample IAM policy:');
    console.error(`
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
            "Resource": "arn:aws:s3:::${process.env.AWS_S3_FILES_BUCKET}/*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "s3:ListBucket",
                "s3:HeadBucket",
                "s3:GetBucketCors"
            ],
            "Resource": "arn:aws:s3:::${process.env.AWS_S3_FILES_BUCKET}"
        }
    ]
}
    `);
    process.exit(1);
  }
  
  console.log('\n✅ All S3 tests passed! Your configuration is correct.\n');
  console.log('💡 If file uploads are still failing in your app, check:');
  console.log('   1. Browser console for CORS errors');
  console.log('   2. Network tab to see the S3 POST request status');
  console.log('   3. Wasp server logs for any S3-related errors\n');
};

testS3Configuration().catch((error) => {
  console.error('\n❌ Unexpected error:', error);
  process.exit(1);
});

