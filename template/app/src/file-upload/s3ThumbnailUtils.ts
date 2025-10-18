import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getEnvVar } from '../server/envValidation';
import { PDFDocument } from 'pdf-lib';
// import { createCanvas } from 'canvas'; // Temporarily disabled due to compilation issues

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
 * Generate thumbnail from PDF buffer using server-side rendering
 * Uses pdf-lib and canvas for server-side PDF to image conversion
 * TEMPORARILY DISABLED due to canvas compilation issues
 */
export async function generateThumbnailFromPDF(pdfBuffer: Buffer): Promise<Buffer> {
  // Temporarily disabled due to canvas compilation issues
  // TODO: Re-enable after installing system dependencies or finding alternative
  console.log('[generateThumbnailFromPDF] Server-side thumbnail generation disabled');
  throw new Error('Server-side thumbnail generation temporarily disabled');
  
  /* Commented out due to canvas compilation issues
  try {
    // Load PDF document
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    const pages = pdfDoc.getPages();
    
    if (pages.length === 0) {
      throw new Error('PDF has no pages');
    }
    
    // Get first page
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    // Calculate thumbnail dimensions (max 300px width, maintain aspect ratio)
    const maxWidth = 300;
    const scale = maxWidth / width;
    const thumbnailWidth = Math.round(width * scale);
    const thumbnailHeight = Math.round(height * scale);
    
    // Create canvas for rendering
    const canvas = createCanvas(thumbnailWidth, thumbnailHeight);
    const ctx = canvas.getContext('2d');
    
    // Set white background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, thumbnailWidth, thumbnailHeight);
    
    // Render PDF page to canvas
    // Note: pdf-lib doesn't have direct canvas rendering, so we'll use a different approach
    // We'll convert the PDF page to an image using pdf-lib's built-in capabilities
    
    // For now, we'll create a simple placeholder thumbnail
    // In a production environment, you might want to use a different PDF rendering library
    // like pdf2pic or puppeteer for better canvas rendering
    
    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(10, 10, thumbnailWidth - 20, thumbnailHeight - 20);
    
    ctx.fillStyle = '#333333';
    ctx.font = '16px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('PDF Preview', thumbnailWidth / 2, thumbnailHeight / 2);
    
    // Convert canvas to JPEG buffer
    return canvas.toBuffer('image/jpeg', { quality: 0.85 });
    
  } catch (error) {
    console.error('Failed to generate thumbnail from PDF:', error);
    throw new Error(`Thumbnail generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
  */
}

