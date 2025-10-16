import React, { useState, useRef, FormEvent } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Progress } from '../../components/ui/progress';
import { AlertTriangle, Upload, FileText, Loader2, CheckCircle, X } from 'lucide-react';
import { uploadFileWithProgress, validateFile, type FileUploadError } from '../../file-upload/fileUploading';
import { triggerPDFProcessing } from 'wasp/client/operations';
import type { File } from 'wasp/entities';
import { formatFileSize } from '../../file-upload/validation';
import { cn } from '../../lib/utils';

/**
 * Props for QuickUploadModal component
 */
export interface QuickUploadModalProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback fired when file is successfully uploaded and processed */
  onSuccess: (file: File) => void;
}

/**
 * QuickUploadModal - Inline file upload modal for mail creation flow
 * 
 * Features:
 * - Drag & drop or click to browse
 * - Real-time progress bar during upload
 * - PDF validation before upload
 * - Auto-close on success after brief delay
 * - Error handling with retry capability
 * - Prevents closing during active upload
 */
export const QuickUploadModal: React.FC<QuickUploadModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [selectedFile, setSelectedFile] = useState<globalThis.File | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploadError, setUploadError] = useState<FileUploadError | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal closes
  const handleClose = () => {
    if (isUploading) return; // Prevent closing while uploading
    setSelectedFile(null);
    setUploadProgress(0);
    setUploadError(null);
    setIsUploading(false);
    setUploadedFile(null);
    onClose();
  };

  // Handle file selection (from input or drop)
  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file before accepting (returns error or null)
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    setUploadError(null);
  };

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  // Upload file
  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      setIsUploading(true);
      setUploadError(null);
      setUploadProgress(0);

      // Upload file with progress tracking
      const { createFileResult } = await uploadFileWithProgress({
        file: selectedFile as any, // Type assertion for compatibility
        setUploadProgressPercent: (progress) => setUploadProgress(progress)
      });

      // Trigger PDF processing (thumbnail generation, page count, etc.)
      await triggerPDFProcessing({ fileId: createFileResult.fileId });

      // Create a minimal file object for success callback
      const uploadedFileData = {
        id: createFileResult.fileId,
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size,
      } as File;

      setUploadedFile(uploadedFileData);
      
      // Call success callback and close after brief delay (500ms)
      setTimeout(() => {
        onSuccess(uploadedFileData);
        handleClose();
      }, 500);

    } catch (error) {
      console.error('[QuickUploadModal] Upload error:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to upload file',
        code: 'UPLOAD_FAILED'
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Upload File</DialogTitle>
          <DialogDescription>
            Upload a PDF file to send. The file will be validated and processed automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ============================= */}
          {/* Drag & Drop Upload Area      */}
          {/* ============================= */}
          {!selectedFile && !uploadedFile && (
            <div
              className={cn(
                "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
                isDragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400",
                isUploading && "opacity-50 pointer-events-none"
              )}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  fileInputRef.current?.click();
                }
              }}
              aria-label="Click to browse or drag and drop PDF file"
            >
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-gray-700 mb-1">
                Drag & drop your PDF here
              </p>
              <p className="text-xs text-gray-500">
                or click to browse
              </p>
              <p className="text-xs text-gray-400 mt-2">
                PDF files only, max 25MB
              </p>
              
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf"
                onChange={(e) => handleFileSelect(e.target.files)}
                className="hidden"
                aria-label="File input"
              />
            </div>
          )}

          {/* ============================== */}
          {/* Selected File Info & Progress */}
          {/* ============================== */}
          {selectedFile && !uploadedFile && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 flex-1">
                  <FileText className="h-8 w-8 text-blue-600 flex-shrink-0 mt-1" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate" title={selectedFile.name}>
                      {selectedFile.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                </div>
                {!isUploading && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="flex-shrink-0"
                    aria-label="Remove selected file"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress Bar */}
              {isUploading && (
                <div className="mt-4 space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-xs text-gray-600 text-center">
                    Uploading... {Math.round(uploadProgress)}%
                  </p>
                </div>
              )}
            </div>
          )}

          {/* ==================== */}
          {/* Upload Success State */}
          {/* ==================== */}
          {uploadedFile && (
            <div className="border border-green-200 rounded-lg p-4 bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-8 w-8 text-green-600 flex-shrink-0" aria-label="Success" />
                <div>
                  <p className="text-sm font-medium text-green-900">
                    Upload successful!
                  </p>
                  <p className="text-xs text-green-700">
                    File is being processed...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* =============== */}
          {/* Error Display   */}
          {/* =============== */}
          {uploadError && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{uploadError.message}</AlertDescription>
            </Alert>
          )}

          {/* =============== */}
          {/* Action Buttons  */}
          {/* =============== */}
          <div className="flex gap-3 pt-2">
            {selectedFile && !uploadedFile && (
              <Button
                onClick={handleUpload}
                disabled={isUploading}
                className="flex-1"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload File
                  </>
                )}
              </Button>
            )}
            
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={isUploading}
              className={selectedFile && !uploadedFile ? '' : 'flex-1'}
            >
              {uploadedFile ? 'Done' : 'Cancel'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickUploadModal;

