import { createFile } from 'wasp/client/operations';
import axios from 'axios';
import { ALLOWED_FILE_TYPES, MAX_FILE_SIZE_BYTES, formatFileSize } from './validation';
import { uploadWithRetry } from './uploadWithRetry';

export type FileWithValidType = Omit<File, 'type'> & { type: AllowedFileType };
type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export interface UploadMetrics {
  speed: number; // bytes per second
  timeRemaining: number; // seconds
  bytesLoaded: number;
  bytesTotal: number;
}

interface FileUploadProgress {
  file: FileWithValidType;
  setUploadProgressPercent: (percentage: number) => void;
  onRetry?: (attempt: number, error: Error) => void;
  onMetricsUpdate?: (metrics: UploadMetrics) => void;
  // Phase 1: Optional thumbnail data
  clientThumbnail?: string;
  previewPageCount?: number;
  previewDimensions?: { width: number; height: number };
}

export async function uploadFileWithProgress({ 
  file, 
  setUploadProgressPercent,
  onRetry,
  onMetricsUpdate,
  clientThumbnail,
  previewPageCount,
  previewDimensions
}: FileUploadProgress) {
  const createFileResult = await createFile({ 
    fileType: file.type, 
    fileName: file.name,
    clientThumbnail,
    previewPageCount,
    previewDimensions
  });
  const { s3UploadUrl, s3UploadFields } = createFileResult;

  const formData = getFileUploadFormData(file, s3UploadFields);
  const startTime = Date.now();

  // Wrap the upload in retry logic with exponential backoff
  const uploadResponse = await uploadWithRetry(
    () => axios.post(s3UploadUrl, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgressPercent(percentage);

          // Calculate upload metrics
          if (onMetricsUpdate && progressEvent.loaded > 0) {
            const elapsedSeconds = (Date.now() - startTime) / 1000;
            const speed = progressEvent.loaded / Math.max(elapsedSeconds, 0.1); // bytes per second
            const remainingBytes = progressEvent.total - progressEvent.loaded;
            const timeRemaining = remainingBytes / Math.max(speed, 1); // seconds

            onMetricsUpdate({
              speed,
              timeRemaining,
              bytesLoaded: progressEvent.loaded,
              bytesTotal: progressEvent.total
            });
          }
        }
      },
    }),
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      onRetry: (attempt, error) => {
        // Reset progress on retry to show it's starting over
        setUploadProgressPercent(0);
        
        // Notify parent component about retry
        if (onRetry) {
          onRetry(attempt, error);
        }
      }
    }
  );

  // Return both the upload response and file creation result for further processing
  return { uploadResponse, createFileResult };
}

function getFileUploadFormData(file: File, s3UploadFields: Record<string, string>) {
  const formData = new FormData();
  Object.entries(s3UploadFields).forEach(([key, value]) => {
    formData.append(key, value);
  });
  formData.append('file', file);
  return formData;
}

export interface FileUploadError {
  message: string;
  code: 'NO_FILE' | 'INVALID_FILE_TYPE' | 'FILE_TOO_LARGE' | 'UPLOAD_FAILED' | 'INVALID_FILE_NAME' | 'VALIDATION_FAILED' | 'PREVIEW_WARNING';
}

/**
 * Validate a file for upload with user-friendly error messages
 */
export function validateFile(file: File): FileUploadError | null {
  // File size validation
  if (file.size === 0) {
    return {
      message: `File "${file.name}" is empty (0 bytes). Please select a valid file.`,
      code: 'FILE_TOO_LARGE' as const,
    };
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      message: `File "${file.name}" is ${formatFileSize(file.size)}, which exceeds the ${formatFileSize(MAX_FILE_SIZE_BYTES)} limit. Please compress your file or choose a smaller one.`,
      code: 'FILE_TOO_LARGE' as const,
    };
  }

  // File type validation
  if (!isAllowedFileType(file.type)) {
    const allowedTypes = ALLOWED_FILE_TYPES
      .map(type => type.split('/')[1]?.toUpperCase() || type)
      .join(', ');
    
    return {
      message: `File type "${file.type || 'unknown'}" is not supported. Please upload one of: ${allowedTypes}`,
      code: 'INVALID_FILE_TYPE' as const,
    };
  }

  // File name validation
  if (file.name.length > 200) {
    return {
      message: `File name is too long (${file.name.length} characters). Please rename to less than 200 characters.`,
      code: 'INVALID_FILE_NAME' as const,
    };
  }

  return null;
}

function isAllowedFileType(fileType: string): fileType is AllowedFileType {
  return (ALLOWED_FILE_TYPES as readonly string[]).includes(fileType);
}
