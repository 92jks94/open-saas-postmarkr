// ============================================================================
// WASP FRAMEWORK IMPORTS
// ============================================================================
import { HttpError } from 'wasp/server';
import type {
  CreateFile,
  DeleteFile,
  GetAllFilesByUser,
  GetDownloadFileSignedURL,
  GetThumbnailURL,
  TriggerPDFProcessing,
  ExtractPDFPages,
} from 'wasp/server/operations';
import type { File } from 'wasp/entities';
import { processPDFMetadata as processPDFMetadataJob } from 'wasp/server/jobs';

// ============================================================================
// LOCAL SERVICE/UTILITY IMPORTS
// ============================================================================
import { getUploadFileSignedURLFromS3, getDownloadFileSignedURLFromS3, deleteFileFromS3 } from './s3Utils';
import { uploadBase64ThumbnailToS3, getThumbnailSignedUrl } from './s3ThumbnailUtils';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { ALLOWED_FILE_TYPES } from './validation';
import { extractPDFMetadataFromBuffer, isPDFBuffer, type PDFMetadata } from './pdfMetadata';
import { checkOperationRateLimit } from '../server/rate-limiting/operationRateLimiter';

// ============================================================================
// EXTERNAL LIBRARY IMPORTS
// ============================================================================
import * as z from 'zod';
import { S3Client, GetObjectCommand, ListObjectsV2Command, PutObjectCommand } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const createFileInputSchema = z.object({
  fileType: z.enum(ALLOWED_FILE_TYPES),
  fileName: z.string().nonempty(),
  // Phase 1: Optional thumbnail data from client
  clientThumbnail: z.string().optional(),
  previewPageCount: z.number().optional(),
  previewDimensions: z.object({
    width: z.number(),
    height: z.number()
  }).optional(),
});

type CreateFileInput = z.infer<typeof createFileInputSchema>;

export const createFile: CreateFile<
  CreateFileInput,
  {
    fileId: string;
    s3UploadUrl: string;
    s3UploadFields: Record<string, string>;
  }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Rate limiting: 10 file uploads per hour
  checkOperationRateLimit('createFile', 'fileUpload', context.user.id);

  const validatedInput = ensureArgsSchemaOrThrowHttpError(createFileInputSchema, rawArgs);
  const { fileType, fileName } = validatedInput;

  const { s3UploadUrl, s3UploadFields, key } = await getUploadFileSignedURLFromS3({
    fileType,
    fileName,
    userId: context.user.id,
  });

  // Create file record first to get the fileId
  const file = await context.entities.File.create({
    data: {
      name: fileName,
      key,
      uploadUrl: s3UploadUrl,
      type: fileType,
      user: { connect: { id: context.user.id } },
      // Pre-populate page count if available (will be verified by background job)
      pageCount: validatedInput.previewPageCount,
    },
  });

  // Upload thumbnail to S3 if provided (client-side generated)
  let thumbnailKey: string | undefined;
  if (validatedInput.clientThumbnail) {
    try {
      thumbnailKey = await uploadBase64ThumbnailToS3({
        base64Data: validatedInput.clientThumbnail,
        userId: context.user.id,
        fileId: file.id, // Use the actual database file ID
      });
      
      // Update file record with thumbnail key
      await context.entities.File.update({
        where: { id: file.id },
        data: {
          thumbnailKey: thumbnailKey,
          thumbnailGeneratedAt: new Date(),
        },
      });
    } catch (error) {
      console.error('Failed to upload thumbnail to S3:', error);
      // Don't fail file creation if thumbnail upload fails
      thumbnailKey = undefined;
    }
  }

  // Note: PDF metadata processing will be triggered by client after S3 upload completes

  return {
    fileId: file.id,
    s3UploadUrl,
    s3UploadFields,
  };
};

export const getAllFilesByUser: GetAllFilesByUser<void, File[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  return context.entities.File.findMany({
    where: {
      user: {
        id: context.user.id,
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
};

const getDownloadFileSignedURLInputSchema = z.object({ key: z.string().nonempty() });

type GetDownloadFileSignedURLInput = z.infer<typeof getDownloadFileSignedURLInputSchema>;

export const getDownloadFileSignedURL: GetDownloadFileSignedURL<
  GetDownloadFileSignedURLInput,
  string
> = async (rawArgs, _context) => {
  const { key } = ensureArgsSchemaOrThrowHttpError(getDownloadFileSignedURLInputSchema, rawArgs);
  return await getDownloadFileSignedURLFromS3({ key });
};

const getThumbnailURLInputSchema = z.object({ 
  fileId: z.string().nonempty() 
});

type GetThumbnailURLInput = z.infer<typeof getThumbnailURLInputSchema>;

/**
 * Get signed URL for file thumbnail
 * Returns null if thumbnail doesn't exist
 */
export const getThumbnailURL: GetThumbnailURL<
  GetThumbnailURLInput,
  string | null
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  const { fileId } = ensureArgsSchemaOrThrowHttpError(getThumbnailURLInputSchema, rawArgs);
  
  // Get file and verify ownership
  const file = await context.entities.File.findFirst({
    where: {
      id: fileId,
      userId: context.user.id,
    },
  });

  if (!file) {
    throw new HttpError(404, 'File not found');
  }

  if (!file.thumbnailKey) {
    return null; // No thumbnail available
  }

  // Return signed URL for thumbnail
  return await getThumbnailSignedUrl(file.thumbnailKey);
};

const deleteFileInputSchema = z.object({
  fileId: z.string().nonempty(),
});

type DeleteFileInput = z.infer<typeof deleteFileInputSchema>;

export const deleteFile: DeleteFile<
  DeleteFileInput,
  File
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Rate limiting: 10 file deletions per hour
  checkOperationRateLimit('deleteFile', 'fileUpload', context.user.id);

  const { fileId } = ensureArgsSchemaOrThrowHttpError(deleteFileInputSchema, rawArgs);

  const file = await context.entities.File.delete({
    where: {
      id: fileId,
      user: {
        id: context.user.id,
      },
    },
  });

  // Delete the file from S3 after successful database deletion
  try {
    await deleteFileFromS3({ key: file.key });
  } catch (error) {
    // Log error but don't throw - database deletion already succeeded
    // In production, this should use a proper logging service
    if (process.env.NODE_ENV === 'development') {
      console.error('Failed to delete file from S3:', error);
    }
  }

  return file;
};

// Action to trigger PDF processing after successful upload
const triggerPDFProcessingInputSchema = z.object({
  fileId: z.string(),
});

type TriggerPDFProcessingInput = z.infer<typeof triggerPDFProcessingInputSchema>;

export const triggerPDFProcessing: TriggerPDFProcessing<
  TriggerPDFProcessingInput,
  { success: boolean }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }

  // Rate limiting: 10 PDF processing triggers per hour
  checkOperationRateLimit('triggerPDFProcessing', 'fileUpload', context.user.id);

  const { fileId } = ensureArgsSchemaOrThrowHttpError(triggerPDFProcessingInputSchema, rawArgs);

  // Verify the file belongs to the user and is a PDF
  const file = await context.entities.File.findFirst({
    where: {
      id: fileId,
      userId: context.user.id,
      type: 'application/pdf',
    },
  });

  if (!file) {
    throw new HttpError(404, 'PDF file not found');
  }

  // Submit the PDF metadata processing job to run in background
  await processPDFMetadataJob.submit({ fileId: file.id });

  return { success: true };
};

// Background Job for PDF Metadata Processing
export const processPDFMetadata = async (args: { fileId: string }, context: any) => {
  const { fileId } = args;
  
  try {
    // Get the file from database
    const file = await context.entities.File.findFirst({
      where: { 
        id: fileId,
        type: 'application/pdf'
      }
    });

    if (!file) {
      return;
    }

    // Skip if already processed successfully (caching)
    if (file.validationStatus === 'valid' && file.pdfMetadata) {
      return;
    }

    // Skip if currently processing to avoid duplicate processing
    if (file.validationStatus === 'processing') {
      return;
    }

    // Mark as processing to prevent duplicate jobs
    await context.entities.File.update({
      where: { id: fileId },
      data: { validationStatus: 'processing' }
    });

    // Download PDF from S3 - use the same configuration as s3Utils
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION || 'us-east-2', // Default to us-east-2 based on bucket location
      credentials: {
        accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
      },
    });

    const getObjectCommand = new GetObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
      Key: file.key,
    });

    // File should be available since processing is triggered after successful upload
    const response = await s3Client.send(getObjectCommand);
    const pdfBuffer = Buffer.from(await response.Body!.transformToByteArray());

    // Validate PDF format
    if (!isPDFBuffer(pdfBuffer)) {
      throw new HttpError(400, 'Invalid PDF file format');
    }

    // Extract metadata using existing function
    const metadata = await extractPDFMetadataFromBuffer(pdfBuffer);

    // Update file with metadata and processing timestamp
    await context.entities.File.update({
      where: { id: fileId },
      data: {
        pageCount: metadata.pageCount,
        pdfMetadata: metadata,
        validationStatus: 'valid',
        lastProcessedAt: new Date()
      }
    });

    // Successfully processed
  } catch (error) {
    // Log error in development only
    if (process.env.NODE_ENV === 'development') {
      console.error(`Error processing PDF metadata for file ${fileId}:`, error);
    }
    
    // Get file for userId in error case
    const file = await context.entities.File.findFirst({
      where: { id: fileId }
    });
    
    // Update file with error status
    await context.entities.File.update({
      where: { id: fileId },
      data: {
        validationStatus: 'invalid',
        validationError: error instanceof Error ? error.message : 'Unknown processing error'
      }
    });
  }
};

/**
 * Clean up orphaned files in S3 that have been deleted from the database
 * This should be run periodically to prevent S3 storage costs from accumulating
 */
export const cleanupOrphanedS3Files = async (args: any, context: any) => {
  try {
    console.log('🧹 Starting S3 file cleanup process...');
    
    // Get all file keys from database
    const dbFiles = await context.entities.File.findMany({
      select: { key: true }
    });
    const dbKeys = new Set(dbFiles.map((file: { key: string }) => file.key));
    
    // List all files in S3 bucket (using consistent env var names with the rest of the app)
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION || 'us-east-2', // Match default region with PDF processing
      credentials: {
        accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
      },
    });
    
    const bucketName = process.env.AWS_S3_FILES_BUCKET!;
    let continuationToken: string | undefined;
    let orphanedFiles: string[] = [];
    let totalFilesChecked = 0;
    
    do {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucketName,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      });
      
      const response = await s3Client.send(listCommand);
      
      if (response.Contents) {
        for (const object of response.Contents) {
          totalFilesChecked++;
          const s3Key = object.Key!;
          
          // Check if this S3 file exists in our database
          if (!dbKeys.has(s3Key)) {
            orphanedFiles.push(s3Key);
          }
        }
      }
      
      continuationToken = response.NextContinuationToken;
    } while (continuationToken);
    
    console.log(`📊 Cleanup stats: ${totalFilesChecked} files checked, ${orphanedFiles.length} orphaned files found`);
    
    // Delete orphaned files from S3
    let deletedCount = 0;
    for (const orphanedKey of orphanedFiles) {
      try {
        await deleteFileFromS3({ key: orphanedKey });
        deletedCount++;
        console.log(`🗑️ Deleted orphaned file: ${orphanedKey}`);
      } catch (error) {
        console.error(`❌ Failed to delete file ${orphanedKey}:`, error);
      }
    }
    
    console.log(`✅ S3 cleanup completed: ${deletedCount}/${orphanedFiles.length} orphaned files deleted`);
    
    return {
      totalFilesChecked,
      orphanedFilesFound: orphanedFiles.length,
      filesDeleted: deletedCount,
      success: true
    };
    
  } catch (error) {
    console.error('❌ S3 cleanup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Phase 3: Extract specific pages from PDF
const extractPDFPagesInputSchema = z.object({
  fileId: z.string(),
  startPage: z.number().min(1),
  endPage: z.number().min(1),
});

type ExtractPDFPagesInput = z.infer<typeof extractPDFPagesInputSchema>;

export const extractPDFPages: ExtractPDFPages<
  ExtractPDFPagesInput,
  { extractedFileId: string; pageCount: number }
> = async (rawArgs, context) => {
  if (!context.user) {
    throw new HttpError(401);
  }
  
  const { fileId, startPage, endPage } = ensureArgsSchemaOrThrowHttpError(
    extractPDFPagesInputSchema,
    rawArgs
  );
  
  // Validate page range
  if (startPage > endPage) {
    throw new HttpError(400, 'Start page must be less than or equal to end page');
  }
  
  // Get original file
  const originalFile = await context.entities.File.findFirst({
    where: { id: fileId, userId: context.user.id }
  });
  
  if (!originalFile) {
    throw new HttpError(404, 'File not found');
  }
  
  if (!originalFile.pageCount) {
    throw new HttpError(400, 'File has not been processed yet');
  }
  
  if (endPage > originalFile.pageCount) {
    throw new HttpError(400, `End page ${endPage} exceeds total pages ${originalFile.pageCount}`);
  }
  
  const extractedPageCount = endPage - startPage + 1;
  
  // Validate extracted page count against mail limits
  if (extractedPageCount > 50) {
    throw new HttpError(400, 'Extracted pages cannot exceed 50 pages');
  }
  
  // Download original PDF from S3
  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
    },
  });
  
  const getObjectCommand = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: originalFile.key,
  });
  
  const response = await s3Client.send(getObjectCommand);
  const originalPdfBuffer = Buffer.from(await response.Body!.transformToByteArray());
  
  // Extract pages using pdf-lib (already installed from Phase 1)
  const { PDFDocument } = await import('pdf-lib');
  const sourcePDF = await PDFDocument.load(originalPdfBuffer);
  const newPDF = await PDFDocument.create();
  
  // Copy selected pages (pdf-lib uses 0-based indexing)
  const pageIndicesToCopy = Array.from(
    { length: extractedPageCount },
    (_, i) => startPage - 1 + i
  );
  
  const copiedPages = await newPDF.copyPages(sourcePDF, pageIndicesToCopy);
  copiedPages.forEach(page => newPDF.addPage(page));
  
  // Save extracted PDF
  const extractedPdfBytes = await newPDF.save();
  const extractedPdfBuffer = Buffer.from(extractedPdfBytes);
  
  // Upload extracted PDF to S3
  const extractedKey = `${context.user.id}/${randomUUID()}_pages_${startPage}-${endPage}.pdf`;
  
  const putCommand = new PutObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: extractedKey,
    Body: extractedPdfBuffer,
    ContentType: 'application/pdf',
  });
  
  await s3Client.send(putCommand);
  
  // Create new file record for extracted PDF
  const extractedFile = await context.entities.File.create({
    data: {
      name: `${originalFile.name.replace('.pdf', '')}_pages_${startPage}-${endPage}.pdf`,
      key: extractedKey,
      uploadUrl: '', // Not needed for extracted files
      type: 'application/pdf',
      userId: context.user.id,
      pageCount: extractedPageCount,
      validationStatus: 'valid',
      selectedPages: {
        start: startPage,
        end: endPage,
        total: originalFile.pageCount,
        originalFileId: fileId
      },
      extractedFileKey: extractedKey,
      isMailFile: true, // Mark as ready for mail
    },
  });
  
  // Trigger metadata extraction for extracted file
  await processPDFMetadataJob.submit({ fileId: extractedFile.id });
  
  return {
    extractedFileId: extractedFile.id,
    pageCount: extractedPageCount
  };
};
