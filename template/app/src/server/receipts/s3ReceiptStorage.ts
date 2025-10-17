/**
 * S3 Storage utilities for PDF receipts
 * Leverages existing S3 infrastructure and patterns
 */

import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import type { ReceiptStorageConfig } from './types';
import { getEnvVar } from '../envValidation';

// Reuse existing S3 configuration pattern
const s3Client = new S3Client({
  region: getEnvVar('AWS_S3_REGION', 'us-east-2'),
  credentials: {
    accessKeyId: getEnvVar('AWS_S3_IAM_ACCESS_KEY'),
    secretAccessKey: getEnvVar('AWS_S3_IAM_SECRET_KEY'),
  },
});

const RECEIPT_BUCKET = process.env.AWS_S3_RECEIPTS_BUCKET || process.env.AWS_S3_FILES_BUCKET!;
const RETENTION_DAYS = 90;

/**
 * Generate S3 key for receipt storage
 * Pattern: receipts/{userId}/{mailPieceId}/{timestamp}.pdf
 */
function getReceiptS3Key(userId: string, mailPieceId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `receipts/${userId}/${mailPieceId}/${timestamp}.pdf`;
}

/**
 * Upload PDF receipt to S3
 * Reuses existing S3 upload patterns from file-upload system
 */
export async function uploadReceiptToS3(
  pdfBuffer: Buffer,
  userId: string,
  mailPieceId: string
): Promise<string> {
  try {
    const key = getReceiptS3Key(userId, mailPieceId);
    
    const command = new PutObjectCommand({
      Bucket: RECEIPT_BUCKET,
      Key: key,
      Body: pdfBuffer,
      ContentType: 'application/pdf',
      Metadata: {
        userId: userId.toString(),
        mailPieceId,
        generatedAt: new Date().toISOString(),
        retentionDays: RETENTION_DAYS.toString(),
      },
    });

    await s3Client.send(command);
    
    console.log(`✅ Receipt uploaded to S3: ${key}`);
    return key;
  } catch (error) {
    console.error('Failed to upload receipt to S3:', error);
    throw new Error('Failed to upload receipt to storage');
  }
}

/**
 * Get signed URL for receipt download
 * Reuses existing signed URL pattern from file-upload system
 */
export async function getReceiptDownloadUrl(s3Key: string): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: RECEIPT_BUCKET!,
      Key: s3Key,
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 }); // 1 hour expiry
    return signedUrl;
  } catch (error) {
    console.error('Failed to generate receipt download URL:', error);
    throw new Error('Failed to generate download URL');
  }
}

/**
 * Clean up old receipts (90+ days)
 * Runs as background job to maintain storage efficiency
 */
export async function cleanupOldReceipts(): Promise<{ deleted: number; errors: number }> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - RETENTION_DAYS);
    
    let deleted = 0;
    let errors = 0;
    let continuationToken: string | undefined;

    do {
      const command = new ListObjectsV2Command({
        Bucket: RECEIPT_BUCKET!,
        Prefix: 'receipts/',
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(command);
      
      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key && object.LastModified && object.LastModified < cutoffDate) {
            try {
              await s3Client.send(new DeleteObjectCommand({
                Bucket: RECEIPT_BUCKET!,
                Key: object.Key,
              }));
              deleted++;
              console.log(`🗑️ Deleted old receipt: ${object.Key}`);
            } catch (error) {
              console.error(`Failed to delete receipt ${object.Key}:`, error);
              errors++;
            }
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    console.log(`🧹 Receipt cleanup completed: ${deleted} deleted, ${errors} errors`);
    return { deleted, errors };
  } catch (error) {
    console.error('Receipt cleanup failed:', error);
    throw new Error('Failed to cleanup old receipts');
  }
}

/**
 * Get receipt storage configuration
 */
export function getReceiptStorageConfig(): ReceiptStorageConfig {
  return {
    bucket: RECEIPT_BUCKET!,
    region: process.env.AWS_S3_REGION || 'us-east-2',
    retentionDays: RETENTION_DAYS,
  };
}
