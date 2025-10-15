import { useEffect, useState, useRef } from 'react';
import { getAllFilesByUser, getPaginatedFilesByUser, getDownloadFileSignedURL, deleteFile, triggerPDFProcessing, verifyFileUpload, useQuery } from 'wasp/client/operations';
import type { File as FileEntity } from 'wasp/entities';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { LoadingSpinner, InlineLoadingSpinner } from '../components/ui/loading-spinner';
import { EmptyFilesState } from '../components/ui/empty-state';
import { PageHeader } from '../components/ui/page-header';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import {
  type FileUploadError,
  type FileWithValidType,
  uploadFileWithProgress,
  validateFile,
} from './fileUploading';
import { ALLOWED_FILE_TYPES, formatFileSize } from './validation';
// Removed FilePreviewCard import - using simple template approach
import { Upload, FileText, Image as ImageIcon, Clock, Loader2, CheckCircle, XCircle, X, Download, Trash2 } from 'lucide-react';
import { generatePDFThumbnail } from './pdfThumbnail';
import { DEBOUNCE_DELAY_MS, SECONDS_PER_MINUTE } from '../shared/constants/timing';
import { FileListThumbnail } from '../components/ThumbnailImage';
// CostCalculatorWidget moved to docs/FILE_UPLOAD_TODOS.md for future reference

// Upload queue item interface
interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  result?: any;
  speed?: number; // bytes per second
  timeRemaining?: number; // seconds
}

// Helper function to format time
function formatTime(seconds: number): string {
  if (seconds < 1) return 'Less than 1 second';
  if (seconds < SECONDS_PER_MINUTE) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const secs = Math.round(seconds % SECONDS_PER_MINUTE);
  return `${minutes}m ${secs}s`;
}

// Helper function to format speed
function formatSpeed(bytesPerSecond: number): string {
  return `${formatFileSize(bytesPerSecond)}/s`;
}

export default function FileUploadPage() {
  const [fileKeyForS3, setFileKeyForS3] = useState<FileEntity['key']>('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<FileUploadError | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [isProcessingQueue, setIsProcessingQueue] = useState(false);

  // Removed pagination and view mode state - using simple template approach

  // Use simple query for file list (revert to working template approach)
  const allUserFiles = useQuery(getAllFilesByUser, undefined, {
    refetchInterval: false,
    refetchIntervalInBackground: false,
  }) as { data: FileEntity[] | undefined; isLoading: boolean; error: any; refetch: () => void };

  const files = allUserFiles.data || [];
  const isFilesLoading = allUserFiles.isLoading;
  const filesError = allUserFiles.error;

  // Check if any files are currently being processed
  const hasProcessingFiles = allUserFiles.data?.some(
    file => file.validationStatus === 'processing'
  ) ?? false;

  // Conditional polling: Only poll when files are actively processing
  // This dramatically reduces database queries (~95% reduction)
  // Polling only occurs when files have validationStatus === 'processing'
  useEffect(() => {
    if (!hasProcessingFiles) {
      return; // No polling needed - user is just viewing completed files
    }

    // Poll to check processing status
    const pollInterval = setInterval(() => {
      allUserFiles.refetch();
    }, DEBOUNCE_DELAY_MS);

    return () => clearInterval(pollInterval);
  }, [hasProcessingFiles, allUserFiles.refetch]);

  const { isLoading: isDownloadUrlLoading, refetch: refetchDownloadUrl } = useQuery(
    getDownloadFileSignedURL,
    { key: fileKeyForS3 },
    { enabled: false }
  );

  useEffect(() => {
    allUserFiles.refetch();
  }, []);

  useEffect(() => {
    if (fileKeyForS3.length > 0) {
      refetchDownloadUrl()
        .then((urlQuery) => {
          if (urlQuery.status === 'error') {
            console.error('Error fetching download URL', urlQuery.error);
            
            // Show user-friendly error message
            const errorMessage = urlQuery.error?.message || 'Unknown error';
            if (errorMessage.includes('File not found in storage')) {
              alert('This file is no longer available in storage. Please re-upload the file.');
            } else {
              alert(`Error downloading file: ${errorMessage}`);
            }
            return;
          }
          if (urlQuery.status === 'success') {
            window.open(urlQuery.data, '_blank');
            return;
          }
        })
        .finally(() => {
          setFileKeyForS3('');
        });
    }
  }, [fileKeyForS3]);

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile({ fileId });
      allUserFiles.refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to delete file. Please try again.',
        code: 'UPLOAD_FAILED',
      });
    }
  };

  const handleDownload = (file: FileEntity) => {
    setFileKeyForS3(file.key);
  };

  // Simplified file selection handler - validates and uploads directly
  const handleFileSelect = async (files: File[]) => {
    if (files.length === 0) return;
    
    try {
      setUploadError(null);
      
      // Validate all files first
      const validatedFiles = files.map(file => ({
        file,
        validation: validateFile(file)
      }));

      const invalidFiles = validatedFiles.filter(f => f.validation !== null);
      if (invalidFiles.length > 0) {
        const firstError = invalidFiles[0].validation!;
        setUploadError(firstError);
        return;
      }

      // Upload directly through queue
      await handleMultipleFileUpload(files);
      
    } catch (error) {
      console.error('Error selecting files:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to process files.',
        code: 'VALIDATION_FAILED'
      });
    }
  };

  // Drag & drop event handlers
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
    await handleFileSelect(files);
  };

  // Handle multiple file upload - validation already done by handleFileSelect
  const handleMultipleFileUpload = async (files: File[]) => {
    // Add files to queue
    const queueItems: UploadQueueItem[] = files.map(file => ({
      id: `${Date.now()}-${Math.random()}`,
      file,
      progress: 0,
      status: 'pending'
    }));

    setUploadQueue(prev => [...prev, ...queueItems]);
    
    // Start processing queue
    await processUploadQueue(queueItems);
  };

  // Process upload queue (3 concurrent uploads max)
  const processUploadQueue = async (items: UploadQueueItem[]) => {
    setIsProcessingQueue(true);
    const CONCURRENT_LIMIT = 3;
    
    for (let i = 0; i < items.length; i += CONCURRENT_LIMIT) {
      const batch = items.slice(i, i + CONCURRENT_LIMIT);
      
      await Promise.allSettled(
        batch.map(item => uploadSingleFileFromQueue(item))
      );
    }
    
    setIsProcessingQueue(false);
    allUserFiles.refetch();
  };


  // Upload single file from queue
  const uploadSingleFileFromQueue = async (item: UploadQueueItem) => {
    try {
      // Update status to uploading
      setUploadQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status: 'uploading' as const } : q)
      );

      // Generate preview data for PDF files (including thumbnail)
      let previewData: {
        previewPageCount?: number;
        previewDimensions?: { width: number; height: number };
        clientThumbnail?: string;
      } = {};

      if (item.file.type === 'application/pdf') {
        try {
          const pdfPreview = await generatePDFThumbnail(item.file);
          previewData = {
            previewPageCount: pdfPreview.pageCount,
            previewDimensions: pdfPreview.firstPageDimensions,
            clientThumbnail: pdfPreview.thumbnailDataUrl
          };
        } catch (error) {
          console.warn('Failed to generate preview data for queued file:', error);
          // Continue upload without preview data
        }
      }

      const { uploadResponse, createFileResult } = await uploadFileWithProgress({
        file: item.file as FileWithValidType,
        setUploadProgressPercent: (progress) => {
          setUploadQueue(prev =>
            prev.map(q => q.id === item.id ? { ...q, progress } : q)
          );
        },
        onMetricsUpdate: (metrics) => {
          setUploadQueue(prev =>
            prev.map(q => q.id === item.id ? { 
              ...q, 
              speed: metrics.speed, 
              timeRemaining: metrics.timeRemaining 
            } : q)
          );
        },
        // Pass preview data including thumbnail
        previewPageCount: previewData.previewPageCount,
        previewDimensions: previewData.previewDimensions,
        clientThumbnail: previewData.clientThumbnail
      });

      // Verify the file was actually uploaded to S3
      try {
        const verification = await verifyFileUpload({ fileId: createFileResult.fileId });
        if (!verification.exists) {
          // The verifyFileUpload operation already marks the file as invalid in the database
          throw new Error('File not found in storage after upload');
        }
      } catch (verificationError) {
        console.error('File verification failed:', verificationError);
        // The verifyFileUpload operation already marks the file as invalid in the database
        throw new Error('Upload verification failed: File may not have been saved correctly');
      }

      // Trigger PDF processing if needed
      if (item.file.type === 'application/pdf') {
        try {
          await triggerPDFProcessing({ fileId: createFileResult.fileId });
        } catch (processingError) {
          console.warn('Failed to trigger PDF processing:', processingError);
        }
      }

      // Update status to success
      setUploadQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status: 'success' as const, result: createFileResult } : q)
      );

      // Refetch to show the new file
      allUserFiles.refetch();

    } catch (error) {
      // Update status to error
      setUploadQueue(prev =>
        prev.map(q => q.id === item.id ? { 
          ...q, 
          status: 'error' as const, 
          error: error instanceof Error ? error.message : 'Upload failed'
        } : q)
      );
    }
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <PageHeader
          title="File Upload"
          description="Upload files to use with your mail pieces. Supports PDF, images, and documents."
        />
        {/* Phase 4: Grid layout with upload area and cost calculator */}
        {/* TODO: Restore lg:grid-cols-3 and lg:col-span-2 when cost calculator is re-enabled */}
        <div className="grid grid-cols-1 gap-8 my-8">
          {/* Main upload area - full width (was 2/3 width on large screens) */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className='space-y-10 my-10 py-8 px-4'>
            <div className='flex flex-col gap-4'>
              {/* Modern Drop Zone */}
              <div className='space-y-2'>
                <Label htmlFor='file-upload' className='text-sm font-medium text-foreground'>
                  Upload a file
                </Label>
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => !uploadProgressPercent && fileInputRef.current?.click()}
                  className={cn(
                    "border-2 border-dashed rounded-xl p-8 transition-all duration-200 cursor-pointer",
                    "hover:border-primary hover:bg-primary/5",
                    isDragOver && "border-primary bg-primary/10 scale-[1.02] shadow-lg",
                    uploadProgressPercent > 0 && "opacity-50 cursor-not-allowed pointer-events-none"
                  )}
                >
                  <div className="flex flex-col items-center space-y-3 text-center">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Upload className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-base font-semibold text-foreground">
                        Drop your file here
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">
                        or click to browse • Max 10MB • PDF only
                      </p>
                    </div>
                  </div>
                </div>
                <Input
                  ref={fileInputRef}
                  type='file'
                  id='file-upload'
                  name='file-upload'
                  multiple
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      const files = Array.from(e.target.files);
                      handleFileSelect(files);
                      e.target.value = ''; // Reset input
                    }
                  }}
                  className='hidden'
                />
              </div>

              {/* Progress indicator for single file uploads */}
              {uploadProgressPercent > 0 && uploadQueue.length === 0 && (
                <div className='space-y-2'>
                  <Progress value={uploadProgressPercent} className='w-full' />
                  <p className="text-sm text-center text-muted-foreground">Uploading... {uploadProgressPercent}%</p>
                </div>
              )}
              {retryAttempt > 0 && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertDescription className="text-yellow-800">
                    Network error detected. Retrying... (Attempt {retryAttempt}/3)
                  </AlertDescription>
                </Alert>
              )}
              {uploadError && (
                <Alert variant='destructive' className="space-y-2">
                  <AlertDescription>
                    <p className="font-medium">{uploadError.message}</p>
                    {uploadError.code === 'FILE_TOO_LARGE' && (
                      <p className="text-sm mt-2">
                        💡 Tip: You can compress PDF files using free online tools like{' '}
                        <a 
                          href="https://www.ilovepdf.com/compress_pdf" 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="underline hover:text-destructive-foreground"
                        >
                          iLovePDF
                        </a>
                      </p>
                    )}
                    {uploadError.code === 'INVALID_FILE_TYPE' && (
                      <p className="text-sm mt-2">
                        💡 Tip: We currently support PDF files for mail pieces. Make sure your file has a .pdf extension.
                      </p>
                    )}
                    {uploadError.code === 'INVALID_FILE_NAME' && (
                      <p className="text-sm mt-2">
                        💡 Tip: Try shortening your file name before uploading.
                      </p>
                    )}
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Upload Queue UI */}
            {uploadQueue.length > 0 && (
              <Card className="border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <CardTitle className="text-lg">
                      Upload Queue ({uploadQueue.filter(q => q.status !== 'success').length} remaining)
                    </CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadQueue(prev => prev.filter(q => q.status !== 'success'))}
                        disabled={uploadQueue.every(q => q.status !== 'success')}
                      >
                        Clear Completed
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const failedItems = uploadQueue.filter(q => q.status === 'error');
                          processUploadQueue(failedItems);
                        }}
                        disabled={uploadQueue.every(q => q.status !== 'error')}
                      >
                        Retry Failed
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    {uploadQueue.map((item) => (
                      <div
                        key={item.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border",
                          item.status === 'success' && "bg-green-50 border-green-200",
                          item.status === 'error' && "bg-red-50 border-red-200"
                        )}
                      >
                        {/* File Icon */}
                        <div className="flex-shrink-0">
                          {item.file.type.startsWith('image/') ? (
                            <ImageIcon className="w-8 h-8 text-gray-400" />
                          ) : (
                            <FileText className="w-8 h-8 text-gray-400" />
                          )}
                        </div>

                        {/* File Info */}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.file.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs text-muted-foreground">
                              {formatFileSize(item.file.size)}
                            </span>
                            {item.status === 'uploading' && item.progress > 0 && (
                              <Progress value={item.progress} className="w-32 h-1" />
                            )}
                          </div>
                          {/* Upload Speed and Time Remaining */}
                          {item.status === 'uploading' && item.speed && item.timeRemaining && (
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{formatSpeed(item.speed)}</span>
                              <span>•</span>
                              <span>{formatTime(item.timeRemaining)} remaining</span>
                            </div>
                          )}
                          {item.error && (
                            <p className="text-xs text-red-600 mt-1">{item.error}</p>
                          )}
                        </div>

                        {/* Status */}
                        <div className="flex-shrink-0">
                          {item.status === 'pending' && (
                            <Clock className="w-5 h-5 text-gray-400" />
                          )}
                          {item.status === 'uploading' && (
                            <div className="flex items-center gap-2">
                              <Loader2 className="w-5 h-5 text-primary animate-spin" />
                              <span className="text-sm font-medium">{item.progress}%</span>
                            </div>
                          )}
                          {item.status === 'success' && (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          )}
                          {item.status === 'error' && (
                            <XCircle className="w-5 h-5 text-red-600" />
                          )}
                        </div>

                        {/* Remove Button */}
                        {(item.status === 'success' || item.status === 'error') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setUploadQueue(prev => prev.filter(q => q.id !== item.id))}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    
    {/* Phase 4: Cost calculator sidebar - 1/3 width on large screens */}
    {/* TODO: Re-enable when ready - see docs/FILE_UPLOAD_TODOS.md */}
    {/* <div className="lg:col-span-1">
      <CostCalculatorWidget />
    </div> */}
  </div>

  {/* Uploaded Files section - full width below the grid */}
  <div className='space-y-4'>
    <div className="flex items-center justify-between">
      <CardTitle className='text-xl font-bold text-foreground'>Uploaded Files</CardTitle>
    </div>
    
    {isFilesLoading && <LoadingSpinner text="Loading files..." />}
    
    {filesError && (
      <Alert variant='destructive'>
        <AlertDescription>Error: {filesError.message}</AlertDescription>
      </Alert>
    )}
    
    {files.length === 0 && !isFilesLoading ? (
      <EmptyFilesState onUpload={() => {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }} />
    ) : !isFilesLoading && (
      <div className="space-y-3">
        {files.map((file: FileEntity) => (
          <Card key={file.key} className="p-4">
            <div
              className={cn(
                "flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center",
                {
                  "opacity-70":
                    file.key === fileKeyForS3 && isDownloadUrlLoading,
                  "border-red-200 bg-red-50":
                    file.validationStatus === 'invalid',
                },
              )}
            >
              <div className="flex items-center gap-3">
                <FileListThumbnail 
                  file={file} 
                  onClick={() => setFileKeyForS3(file.key)}
                />
                <div>
                  <p className="text-foreground font-medium">
                    {file.name}
                  </p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{formatFileSize(file.size || 0)}</span>
                    <span>•</span>
                    <span>{file.type.split('/')[1]?.toUpperCase() || file.type}</span>
                    {file.pageCount && (
                      <>
                        <span>•</span>
                        <span>{file.pageCount} pages</span>
                      </>
                    )}
                    {file.validationStatus && (
                      <>
                        <span>•</span>
                        <Badge variant={
                          file.validationStatus === 'valid' ? 'default' :
                          file.validationStatus === 'processing' ? 'secondary' :
                          file.validationStatus === 'invalid' ? 'destructive' : 'outline'
                        }>
                          {file.validationStatus}
                        </Badge>
                      </>
                    )}
                  </div>
                  {file.validationStatus === 'invalid' && file.validationError && (
                    <div className="mt-2">
                      <p className="text-sm text-red-600">
                        ⚠️ {file.validationError}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => setFileKeyForS3(file.key)}
                  disabled={
                    file.key === fileKeyForS3 && isDownloadUrlLoading ||
                    file.validationStatus === 'invalid'
                  }
                  variant="outline"
                  size="sm"
                  title={
                    file.validationStatus === 'invalid' 
                      ? 'File is not available for download. Please re-upload.' 
                      : 'Download file'
                  }
                >
                  {file.key === fileKeyForS3 && isDownloadUrlLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4" />
                  )}
                </Button>
                {file.validationStatus === 'invalid' && (
                  <Button
                    onClick={() => {
                      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
                      if (fileInput) {
                        fileInput.click();
                      }
                    }}
                    variant="outline"
                    size="sm"
                    title="Re-upload this file"
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                )}
                {file.type === 'application/pdf' && !file.thumbnailKey && file.validationStatus === 'valid' && (
                  <Button
                    onClick={async () => {
                      try {
                        // Import the regenerateThumbnail function
                        const { regenerateThumbnail } = await import('wasp/client/operations');
                        await regenerateThumbnail({ fileId: file.id });
                        allUserFiles.refetch();
                        alert('Thumbnail regenerated successfully!');
                      } catch (error) {
                        console.error('Failed to regenerate thumbnail:', error);
                        alert('Failed to regenerate thumbnail. Please try again.');
                      }
                    }}
                    variant="outline"
                    size="sm"
                    title="Generate thumbnail for this PDF"
                  >
                    <ImageIcon className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  onClick={() => handleDelete(file.id)}
                  variant="destructive"
                  size="sm"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    )}
  </div>
</div>
</div>
);
}
