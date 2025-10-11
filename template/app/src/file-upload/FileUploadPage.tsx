import { useEffect, useState, useRef } from 'react';
import { getAllFilesByUser, getDownloadFileSignedURL, deleteFile, triggerPDFProcessing, useQuery } from 'wasp/client/operations';
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
import { cn } from '../lib/utils';
import {
  type FileUploadError,
  type FileWithValidType,
  uploadFileWithProgress,
  validateFile,
} from './fileUploading';
import { ALLOWED_FILE_TYPES, formatFileSize } from './validation';
import { FilePreviewCard } from './FilePreviewCard';
import { Upload, FileText, Image as ImageIcon, Clock, Loader2, CheckCircle, XCircle, X } from 'lucide-react';
import { generatePDFThumbnail, estimateCostFromPages } from './pdfThumbnail';
import { CostCalculatorWidget } from './CostCalculatorWidget';

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
  if (seconds < 60) return `${Math.round(seconds)} seconds`;
  const minutes = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
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
  // Phase 1: File preview state
  const [filePreview, setFilePreview] = useState<{
    file: File;
    thumbnailUrl: string;
    pageCount: number;
    estimatedCost: number;
    dimensions: { width: number; height: number };
  } | null>(null);

  const allUserFiles = useQuery(getAllFilesByUser, undefined, {
    refetchInterval: false, // Will be overridden by useEffect
    refetchIntervalInBackground: false,
  }) as { data: FileEntity[] | undefined; isLoading: boolean; error: any; refetch: () => void };

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

    // Poll every 2 seconds to check processing status
    const pollInterval = setInterval(() => {
      allUserFiles.refetch();
    }, 2000);

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
            alert('Error fetching download');
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

  // Phase 1: Handle file selection with preview generation (for PDF files only)
  const handleFileSelectWithPreview = async (file: File) => {
    try {
      setUploadError(null);
      
      // Basic validation first
      const fileValidationError = validateFile(file);
      if (fileValidationError !== null) {
        setUploadError(fileValidationError);
        return;
      }
      
      // Only generate preview for PDF files
      if (file.type === 'application/pdf') {
        try {
          // Generate thumbnail and get page count (client-side, fast)
          const previewData = await generatePDFThumbnail(file);
          const costEstimate = estimateCostFromPages(previewData.pageCount);
          
          // Check if page count is valid
          if (costEstimate.warning) {
            setUploadError({
              message: costEstimate.warning,
              code: 'VALIDATION_FAILED'
            });
            return;
          }
          
          // Show preview to user
          setFilePreview({
            file,
            thumbnailUrl: previewData.thumbnailDataUrl,
            pageCount: previewData.pageCount,
            estimatedCost: costEstimate.price / 100,
            dimensions: previewData.firstPageDimensions
          });
        } catch (error) {
          console.error('Failed to generate PDF preview:', error);
          // Show warning but allow upload to continue
          setUploadError({
            message: 'Preview generation failed, but you can still upload this file. The thumbnail may not be available immediately.',
            code: 'PREVIEW_WARNING'
          });
          // Proceed with upload after short delay so user can see the warning
          setTimeout(() => {
            setUploadError(null);
            handleMultipleFileUpload([file]);
          }, 2000);
        }
      } else {
        // Non-PDF files: upload directly without preview
        await handleMultipleFileUpload([file]);
      }
      
    } catch (error) {
      console.error('Error selecting file:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to process file.',
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
    if (files.length === 0) return;

    // Handle multiple files
    await handleMultipleFileUpload(files);
  };

  // Handle multiple file upload
  const handleMultipleFileUpload = async (files: File[]) => {
    // Validate all files first
    const validatedFiles = files.map(file => ({
      file,
      validation: validateFile(file)
    }));

    const invalidFiles = validatedFiles.filter(f => f.validation !== null);
    if (invalidFiles.length > 0) {
      setUploadError({
        message: `${invalidFiles.length} file(s) failed validation. Please check file size and type.`,
        code: 'VALIDATION_FAILED'
      });
      return;
    }

    // Clear any previous errors
    setUploadError(null);

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

  // Phase 1: Upload file from preview with thumbnail data
  const uploadFileFromPreview = async () => {
    if (!filePreview) return;
    
    try {
      setUploadError(null);
      setUploadProgressPercent(0);
      
      const { uploadResponse, createFileResult } = await uploadFileWithProgress({
        file: filePreview.file as FileWithValidType,
        setUploadProgressPercent,
        // Pass thumbnail data
        clientThumbnail: filePreview.thumbnailUrl,
        previewPageCount: filePreview.pageCount,
        previewDimensions: filePreview.dimensions
      });
      
      // Trigger PDF processing
      if (filePreview.file.type === 'application/pdf') {
        try {
          await triggerPDFProcessing({ fileId: createFileResult.fileId });
        } catch (processingError) {
          console.warn('Failed to trigger PDF processing:', processingError);
        }
      }
      
      // Clear preview and refetch files
      setFilePreview(null);
      setUploadProgressPercent(0);
      allUserFiles.refetch();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to upload file.',
        code: 'UPLOAD_FAILED'
      });
      setUploadProgressPercent(0);
    }
  };

  // Upload single file from queue
  const uploadSingleFileFromQueue = async (item: UploadQueueItem) => {
    try {
      // Update status to uploading
      setUploadQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status: 'uploading' as const } : q)
      );

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
        }
      });

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

  // Helper function to upload a single file
  const uploadSingleFile = async (file: File) => {
    try {
      setUploadError(null);
      setRetryAttempt(0);

      const fileValidationError = validateFile(file);
      if (fileValidationError !== null) {
        setUploadError(fileValidationError);
        return;
      }

      const { uploadResponse, createFileResult } = await uploadFileWithProgress({ 
        file: file as FileWithValidType, 
        setUploadProgressPercent,
        onRetry: (attempt, error) => {
          setRetryAttempt(attempt);
          console.log(`Upload attempt ${attempt} failed, retrying...`, error.message);
        }
      });
      
      // If this is a PDF file, trigger processing now that upload is complete
      if (file.type === 'application/pdf') {
        try {
          await triggerPDFProcessing({ fileId: createFileResult.fileId });
        } catch (processingError) {
          console.warn('Failed to trigger PDF processing:', processingError);
          // Don't fail the upload if processing trigger fails
        }
      }
      
      // Reset states
      setRetryAttempt(0);
      allUserFiles.refetch();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError({
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred while uploading the file.',
        code: 'UPLOAD_FAILED',
      });
      setRetryAttempt(0);
    } finally {
      setUploadProgressPercent(0);
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 my-8">
          {/* Main upload area - 2/3 width on large screens */}
          <div className="lg:col-span-2">
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
                      // Phase 1: Single PDF file gets preview, multiple files upload directly
                      if (files.length === 1 && files[0].type === 'application/pdf') {
                        handleFileSelectWithPreview(files[0]);
                      } else {
                        handleMultipleFileUpload(files);
                      }
                      e.target.value = ''; // Reset input
                    }
                  }}
                  className='hidden'
                />
              </div>

              {/* Phase 1: PDF Preview Card */}
              {filePreview && !uploadProgressPercent && (
                <Card className="border-2 border-primary">
                  <CardContent className="pt-6">
                    <div className="flex gap-4">
                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        <img 
                          src={filePreview.thumbnailUrl} 
                          alt="PDF Preview"
                          className="w-32 h-40 object-cover rounded border-2"
                        />
                      </div>
                      
                      {/* Info */}
                      <div className="flex-1 space-y-3">
                        <h3 className="font-semibold">{filePreview.file.name}</h3>
                        <div className="space-y-1 text-sm">
                          <p>📄 {filePreview.pageCount} pages</p>
                          <p>💰 Estimated cost: <span className="font-bold text-green-600">${filePreview.estimatedCost.toFixed(2)}</span></p>
                          <p>📧 Envelope: {filePreview.pageCount <= 5 ? 'Standard #10' : 'Flat 9x12'}</p>
                        </div>
                        
                        {/* Action buttons */}
                        <div className="flex gap-2">
                          <Button onClick={uploadFileFromPreview}>
                            ✓ Upload & Continue
                          </Button>
                          <Button variant="outline" onClick={() => setFilePreview(null)}>
                            ✗ Cancel
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

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
                <Alert variant={uploadError.code === 'PREVIEW_WARNING' ? 'default' : 'destructive'} className="space-y-2">
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
                    {uploadError.code === 'PREVIEW_WARNING' && (
                      <p className="text-sm mt-2">
                        ⏳ Uploading automatically in 2 seconds...
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
    <div className="lg:col-span-1">
      <CostCalculatorWidget />
    </div>
  </div>

  {/* Uploaded Files section - full width below the grid */}
  <div className='space-y-4'>
    <div className="flex items-center justify-between">
      <CardTitle className='text-xl font-bold text-foreground'>Uploaded Files</CardTitle>
    </div>
    {allUserFiles.isLoading && <LoadingSpinner text="Loading files..." />}
    {allUserFiles.error && (
      <Alert variant='destructive'>
        <AlertDescription>Error: {allUserFiles.error.message}</AlertDescription>
      </Alert>
    )}
    {!!allUserFiles.data && allUserFiles.data.length > 0 && !allUserFiles.isLoading ? (
      <div className='space-y-3'>
        {allUserFiles.data.map((file: FileEntity) => {
          return (
            <FilePreviewCard
              key={file.key}
              file={file}
              onDownload={() => setFileKeyForS3(file.key)}
              onDelete={() => handleDelete(file.id)}
              isDownloading={file.key === fileKeyForS3 && isDownloadUrlLoading}
            />
          );
        })}
      </div>
    ) : !allUserFiles.isLoading && (
      <EmptyFilesState onUpload={() => {
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) {
          fileInput.click();
        }
      }} />
    )}
  </div>
</div>
</div>
);
}
