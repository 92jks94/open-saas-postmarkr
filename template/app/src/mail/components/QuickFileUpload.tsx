import React, { useState, useRef } from 'react';
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { cn } from '../../lib/utils';
import { 
  uploadFileWithProgress, 
  validateFile,
  type FileWithValidType,
  type FileUploadError 
} from '../../file-upload/fileUploading';
import { ALLOWED_FILE_TYPES, formatFileSize } from '../../file-upload/validation';
import { verifyFileUpload, triggerPDFProcessing } from 'wasp/client/operations';
import { generatePDFThumbnail } from '../../file-upload/pdfThumbnail';

interface QuickFileUploadProps {
  onUploadSuccess: (fileId: string) => void;
  onUploadStart?: () => void;
}

export const QuickFileUpload: React.FC<QuickFileUploadProps> = ({ 
  onUploadSuccess,
  onUploadStart 
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<FileUploadError | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setIsUploading(true);
    setUploadError(null);
    setUploadSuccess(false);
    setUploadProgress(0);
    
    if (onUploadStart) {
      onUploadStart();
    }

    try {
      // Generate preview data for PDF files
      let previewData: {
        previewPageCount?: number;
        previewDimensions?: { width: number; height: number };
      } = {};

      if (file.type === 'application/pdf') {
        try {
          const pdfPreview = await generatePDFThumbnail(file);
          previewData = {
            previewPageCount: pdfPreview.pageCount,
            previewDimensions: pdfPreview.firstPageDimensions
          };
        } catch (error) {
          console.warn('Failed to generate preview data:', error);
        }
      }

      // Upload file
      const { createFileResult } = await uploadFileWithProgress({
        file: file as FileWithValidType,
        setUploadProgressPercent: setUploadProgress,
        previewPageCount: previewData.previewPageCount,
        previewDimensions: previewData.previewDimensions
      });

      // Verify upload
      try {
        const verification = await verifyFileUpload({ fileId: createFileResult.fileId });
        if (!verification.exists) {
          throw new Error('File not found in storage after upload');
        }
      } catch (verificationError) {
        console.error('File verification failed:', verificationError);
        throw new Error('Upload verification failed');
      }

      // Trigger PDF processing
      if (file.type === 'application/pdf') {
        try {
          await triggerPDFProcessing({ fileId: createFileResult.fileId });
        } catch (processingError) {
          console.warn('Failed to trigger PDF processing:', processingError);
        }
      }

      setUploadSuccess(true);
      setUploadProgress(100);
      
      // Call success callback
      setTimeout(() => {
        onUploadSuccess(createFileResult.fileId);
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Upload failed. Please try again.',
        code: 'UPLOAD_FAILED'
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      await handleFileSelect(files[0]); // Only handle first file
    }
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 transition-all duration-200 cursor-pointer",
          "hover:border-primary hover:bg-primary/5",
          isDragOver && "border-primary bg-primary/10 scale-[1.02]",
          isUploading && "opacity-50 cursor-not-allowed pointer-events-none",
          uploadSuccess && "border-green-500 bg-green-50"
        )}
      >
        <div className="flex flex-col items-center space-y-3 text-center">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            uploadSuccess ? "bg-green-100" : "bg-primary/10"
          )}>
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            ) : uploadSuccess ? (
              <CheckCircle className="w-6 h-6 text-green-600" />
            ) : (
              <Upload className="w-6 h-6 text-primary" />
            )}
          </div>
          <div>
            <p className="text-base font-semibold text-foreground">
              {uploadSuccess ? 'Upload Complete!' : 'Drop your file here'}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {uploadSuccess ? 'File ready to use' : 'or click to browse • Max 10MB • PDF only'}
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_FILE_TYPES.join(',')}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFileSelect(e.target.files[0]);
            e.target.value = ''; // Reset input
          }
        }}
        className="hidden"
      />

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-2">
          <Progress value={uploadProgress} className="w-full" />
          <p className="text-sm text-center text-muted-foreground">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      {/* Error Alert */}
      {uploadError && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            <p className="font-medium">{uploadError.message}</p>
            {uploadError.code === 'FILE_TOO_LARGE' && (
              <p className="text-sm mt-2">
                💡 Tip: Compress your PDF using free online tools
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Success Message */}
      {uploadSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-800">
            File uploaded successfully! Proceeding to next step...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

