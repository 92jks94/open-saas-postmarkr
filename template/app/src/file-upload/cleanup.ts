import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Phase 3: Clean up orphaned extracted files to prevent storage bloat
 * Runs daily at 2 AM to delete extracted PDFs that:
 * - Are older than 30 days
 * - Are not being used in any mail pieces
 */
export async function cleanupOldExtractedFiles(_args: any, context: any) {
  try {
    console.log('🧹 Starting extracted file cleanup process...');
    
    const cutoffDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
    
    // Find unused extracted files older than 30 days
    const unusedExtractedFiles = await context.entities.File.findMany({
      where: {
        extractedFileKey: { not: null },
        createdAt: { lt: cutoffDate },
        mailPieces: { none: {} } // Not used in any mail piece
      }
    });
    
    console.log(`📊 Found ${unusedExtractedFiles.length} extracted files to clean up`);
    
    if (unusedExtractedFiles.length === 0) {
      console.log('✅ No extracted files to clean up');
      return {
        totalChecked: 0,
        filesDeleted: 0,
        success: true
      };
    }
    
    // Initialize S3 client
    const s3Client = new S3Client({
      region: process.env.AWS_S3_REGION || 'us-east-2',
      credentials: {
        accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
        secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
      },
    });
    
    let deletedCount = 0;
    let failedCount = 0;
    
    // Delete each file from S3 and database
    for (const file of unusedExtractedFiles) {
      try {
        // Delete from S3
        await s3Client.send(new DeleteObjectCommand({
          Bucket: process.env.AWS_S3_FILES_BUCKET!,
          Key: file.extractedFileKey!
        }));
        
        // Delete from database
        await context.entities.File.delete({
          where: { id: file.id }
        });
        
        deletedCount++;
        console.log(`🗑️ Deleted extracted file: ${file.name} (${file.extractedFileKey})`);
      } catch (error) {
        failedCount++;
        console.error(`❌ Failed to delete file ${file.name}:`, error);
      }
    }
    
    console.log(`✅ Extracted file cleanup completed: ${deletedCount}/${unusedExtractedFiles.length} files deleted (${failedCount} failed)`);
    
    return {
      totalChecked: unusedExtractedFiles.length,
      filesDeleted: deletedCount,
      filesFailed: failedCount,
      success: true
    };
    
  } catch (error) {
    console.error('❌ Extracted file cleanup failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

