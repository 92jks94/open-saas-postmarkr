import * as z from 'zod';
import { HttpError } from 'wasp/server';
import { getUploadFileSignedURLFromS3, getDownloadFileSignedURLFromS3, deleteFileFromS3 } from './s3Utils';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { ALLOWED_FILE_TYPES } from './validation';
import { extractPDFMetadataFromBuffer, isPDFBuffer } from './pdfMetadata';
import { processPDFMetadata as processPDFMetadataJob } from 'wasp/server/jobs';
const createFileInputSchema = z.object({
    fileType: z.enum(ALLOWED_FILE_TYPES),
    fileName: z.string().nonempty(),
});
export const createFile = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
    const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(createFileInputSchema, rawArgs);
    const { s3UploadUrl, s3UploadFields, key } = await getUploadFileSignedURLFromS3({
        fileType,
        fileName,
        userId: context.user.id,
    });
    const file = await context.entities.File.create({
        data: {
            name: fileName,
            key,
            uploadUrl: s3UploadUrl,
            type: fileType,
            user: { connect: { id: context.user.id } },
        },
    });
    // Trigger PDF metadata processing for PDF files
    if (fileType === 'application/pdf') {
        // Submit the PDF metadata processing job to run in background
        await processPDFMetadataJob.submit({ fileId: file.id });
    }
    return {
        s3UploadUrl,
        s3UploadFields,
    };
};
export const getAllFilesByUser = async (_args, context) => {
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
export const getDownloadFileSignedURL = async (rawArgs, _context) => {
    const { key } = ensureArgsSchemaOrThrowHttpError(getDownloadFileSignedURLInputSchema, rawArgs);
    return await getDownloadFileSignedURLFromS3({ key });
};
const deleteFileInputSchema = z.object({
    fileId: z.string().nonempty(),
});
export const deleteFile = async (rawArgs, context) => {
    if (!context.user) {
        throw new HttpError(401);
    }
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
    }
    catch (error) {
        // Log error but don't throw - database deletion already succeeded
        // In production, this should use a proper logging service
        if (process.env.NODE_ENV === 'development') {
            console.error('Failed to delete file from S3:', error);
        }
    }
    return file;
};
// Background Job for PDF Metadata Processing
export const processPDFMetadata = async (args, context) => {
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
        // Download PDF from S3
        const s3Client = new S3Client({
            region: process.env.AWS_S3_REGION,
            credentials: {
                accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY,
                secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY,
            },
        });
        const getObjectCommand = new GetObjectCommand({
            Bucket: process.env.AWS_S3_FILES_BUCKET,
            Key: file.key,
        });
        const response = await s3Client.send(getObjectCommand);
        const pdfBuffer = Buffer.from(await response.Body.transformToByteArray());
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
    }
    catch (error) {
        // Log error in development only
        if (process.env.NODE_ENV === 'development') {
            console.error(`Error processing PDF metadata for file ${fileId}:`, error);
        }
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
export const cleanupOrphanedS3Files = async (args, context) => {
    try {
        console.log('🧹 Starting S3 file cleanup process...');
        // Get all file keys from database
        const dbFiles = await context.entities.File.findMany({
            select: { key: true }
        });
        const dbKeys = new Set(dbFiles.map((file) => file.key));
        // List all files in S3 bucket
        const s3Client = new S3Client({
            region: process.env.AWS_REGION || 'us-east-1',
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            },
        });
        const bucketName = process.env.AWS_S3_BUCKET;
        let continuationToken;
        let orphanedFiles = [];
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
                    const s3Key = object.Key;
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
            }
            catch (error) {
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
    }
    catch (error) {
        console.error('❌ S3 cleanup failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};
//# sourceMappingURL=operations.js.map