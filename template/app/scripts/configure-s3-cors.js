#!/usr/bin/env node

/**
 * S3 CORS Configuration Script
 * 
 * This script configures the CORS policy for the S3 bucket to allow requests
 * from the Postmarkr client application.
 * 
 * Usage:
 *   node scripts/configure-s3-cors.js
 * 
 * Environment Variables Required:
 *   AWS_S3_REGION - The AWS region where the bucket is located
 *   AWS_S3_IAM_ACCESS_KEY - AWS access key ID
 *   AWS_S3_IAM_SECRET_KEY - AWS secret access key
 *   AWS_S3_FILES_BUCKET - The name of the S3 bucket
 */

import { S3Client, PutBucketCorsCommand } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.server' });

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY,
  },
});

const bucketName = process.env.AWS_S3_FILES_BUCKET;

if (!bucketName) {
  console.error('❌ AWS_S3_FILES_BUCKET environment variable is required');
  process.exit(1);
}

const corsConfiguration = {
  CORSRules: [
    {
      AllowedHeaders: ['*'],
      AllowedMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
      AllowedOrigins: [
        'https://postmarkr-client.fly.dev',
        'https://postmarkr-server.fly.dev',
        'https://postmarkr.com',
        'https://www.postmarkr.com',
        'http://localhost:3000', // Development
        'http://localhost:3001', // Development server
      ],
      ExposeHeaders: ['ETag', 'x-amz-meta-custom-header'],
      MaxAgeSeconds: 3000,
    },
  ],
};

async function configureCors() {
  try {
    console.log(`🔧 Configuring CORS for S3 bucket: ${bucketName}`);
    console.log(`📍 Region: ${process.env.AWS_S3_REGION || 'us-east-2'}`);
    
    const command = new PutBucketCorsCommand({
      Bucket: bucketName,
      CORSConfiguration: corsConfiguration,
    });

    await s3Client.send(command);
    
    console.log('✅ CORS configuration applied successfully!');
    console.log('📋 Allowed origins:');
    corsConfiguration.CORSRules[0].AllowedOrigins.forEach(origin => {
      console.log(`   - ${origin}`);
    });
    
  } catch (error) {
    console.error('❌ Failed to configure CORS:', error);
    
    if (error.name === 'NoSuchBucket') {
      console.error(`   The bucket '${bucketName}' does not exist or you don't have access to it.`);
    } else if (error.name === 'AccessDenied') {
      console.error('   Access denied. Check your AWS credentials and permissions.');
    } else if (error.name === 'InvalidBucketName') {
      console.error(`   Invalid bucket name: '${bucketName}'`);
    }
    
    process.exit(1);
  }
}

// Run the configuration
configureCors();
