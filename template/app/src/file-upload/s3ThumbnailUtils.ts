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
 * Thumbnails are public-readable but we use signed URLs for consistency
 */
export async function getThumbnailSignedUrl(thumbnailKey: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: thumbnailKey,
  });
  
  // Thumbnails can have longer expiration since they don't change
  return getSignedUrl(s3Client, command, { expiresIn: 86400 }); // 24 hours
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
 * Note: Server-side thumbnail generation requires additional dependencies (canvas, sharp)
 * For now, we rely on client-side generation. This function is a placeholder for future enhancement.
 * 
 * Future implementation options:
 * 1. Use sharp + pdf-poppler (requires system dependencies)
 * 2. Use canvas + pdfjs (requires node-canvas)
 * 3. Use external service (AWS Lambda, CloudConvert, etc.)
 */
export async function generateThumbnailFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
  // TODO: Implement server-side thumbnail generation
  // For now, throw error - thumbnails should be generated client-side
  throw new Error('Server-side thumbnail generation not yet implemented. Use client-side generation.');
}

