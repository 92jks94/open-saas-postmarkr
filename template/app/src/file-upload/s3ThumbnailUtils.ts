import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnvVar } from '../server/envValidation';

const s3Client = new S3Client({
  region: getEnvVar('AWS_S3_REGION', 'us-east-2'),
  credentials: {
    accessKeyId: getEnvVar('AWS_S3_IAM_ACCESS_KEY'),
    secretAccessKey: getEnvVar('AWS_S3_IAM_SECRET_KEY'),
  },
});

/**
 * Upload thumbnail image buffer to S3
 * Used for server-side thumbnail generation
 */
export async function uploadThumbnailToS3({
  thumbnailBuffer,
  userId,
  fileId,
}: {
  thumbnailBuffer: Buffer;
  userId: string;
  fileId: string;
}): Promise<string> {
  const key = getThumbnailS3Key(userId, fileId);
  
  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
    Body: thumbnailBuffer,
    ContentType: 'image/jpeg',
    // Set cache headers for better performance
    CacheControl: 'public, max-age=31536000', // 1 year
  });
  
  await s3Client.send(command);
  return key;
}

/**
 * Upload base64 thumbnail data to S3
 * Used for client-side thumbnail generation
 */
export async function uploadBase64ThumbnailToS3({
  base64Data,
  userId,
  fileId,
}: {
  base64Data: string;
  userId: string;
  fileId: string;
}): Promise<string> {
  // Extract base64 data from data URL (remove "data:image/jpeg;base64," prefix)
  const base64Content = base64Data.replace(/^data:image\/\w+;base64,/, '');
  const buffer = Buffer.from(base64Content, 'base64');
  
  return uploadThumbnailToS3({ thumbnailBuffer: buffer, userId, fileId });
}

/**
 * Get signed URL for viewing a thumbnail
 * Uses 7-day expiration for Stripe checkout receipts
 */
export async function getThumbnailSignedUrl(thumbnailKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: thumbnailKey,
  });
  
  // 7-day expiration for Stripe checkout images
  return getSignedUrl(s3Client, command, { expiresIn: 604800 }); // 7 days
}

/**
 * Generate S3 key for thumbnail storage
 * Format: thumbnails/{userId}/{fileId}.jpg
 */
function getThumbnailS3Key(userId: string, fileId: string): string {
  return `thumbnails/${userId}/${fileId}.jpg`;
}

/**
 * Generate thumbnail from PDF buffer
 * Note: This function is deprecated - server-side thumbnail generation is now implemented
 * in operations.ts using @napi-rs/canvas and pdfjs-dist
 * 
 * Use the generateServerSideThumbnail function in operations.ts instead
 */
export async function generateThumbnailFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
  // This function is deprecated - use generateServerSideThumbnail in operations.ts
  throw new Error('This function is deprecated. Use generateServerSideThumbnail in operations.ts instead.');
}

