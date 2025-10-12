import { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES } from '../shared/constants/files';

// Re-export for backward compatibility
export { MAX_FILE_SIZE_BYTES, ALLOWED_FILE_TYPES };

import { BYTES_PER_KB } from '../shared/constants/files';

/**
 * Format file size in human-readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));
  return Math.round((bytes / Math.pow(BYTES_PER_KB, i)) * 100) / 100 + ' ' + sizes[i];
}

import { 
  MAIL_TYPE_PAGE_REQUIREMENTS, 
  MAIL_SIZE_DIMENSIONS,
  DIMENSION_TOLERANCE 
} from '../shared/constants/files';

// Mail-specific validation constants (re-export for backward compatibility)
export const MAIL_MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_BYTES;
export const MAIL_ALLOWED_FILE_TYPES = ALLOWED_FILE_TYPES;
export const MAIL_TYPE_REQUIREMENTS = MAIL_TYPE_PAGE_REQUIREMENTS;
export { MAIL_SIZE_DIMENSIONS };

/**
 * Validate file for mail processing
 */
export function validateFileForMail(
  file: { type: string; size?: number; pageCount?: number; pdfMetadata?: any },
  mailType: string,
  mailSize: string
): { isValid: boolean; errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (!MAIL_ALLOWED_FILE_TYPES.includes(file.type as any)) {
    errors.push('Only PDF files are supported for mail');
  }

  // Check file size
  if (file.size && file.size > MAIL_MAX_FILE_SIZE_BYTES) {
    errors.push('File size must be less than 10MB for mail processing');
  }

  // Check page count for mail type
  if (file.pageCount) {
    const requirements = MAIL_TYPE_REQUIREMENTS[mailType as keyof typeof MAIL_TYPE_REQUIREMENTS];
    if (requirements) {
      if (file.pageCount > requirements.maxPages) {
        errors.push(`${mailType} cannot have more than ${requirements.maxPages} pages`);
      }
      if (file.pageCount < requirements.minPages) {
        warnings.push(`${mailType} typically has at least ${requirements.minPages} pages`);
      }
    }
  }

  // Check orientation
  if (file.pdfMetadata?.orientation) {
    const requirements = MAIL_TYPE_REQUIREMENTS[mailType as keyof typeof MAIL_TYPE_REQUIREMENTS];
    if (requirements && !requirements.allowedOrientations.includes(file.pdfMetadata.orientation)) {
      warnings.push(`${mailType} works best with ${requirements.allowedOrientations.join(' or ')} orientation`);
    }
  }

  // Check mail size compatibility
  const sizeDimensions = MAIL_SIZE_DIMENSIONS[mailSize as keyof typeof MAIL_SIZE_DIMENSIONS];
  if (sizeDimensions && file.pdfMetadata?.width && file.pdfMetadata?.height) {
    const widthMatch = Math.abs(file.pdfMetadata.width - sizeDimensions.width) <= (sizeDimensions.width * DIMENSION_TOLERANCE);
    const heightMatch = Math.abs(file.pdfMetadata.height - sizeDimensions.height) <= (sizeDimensions.height * DIMENSION_TOLERANCE);
    
    if (!widthMatch || !heightMatch) {
      warnings.push(`File dimensions don't match mail size ${mailSize} - may need resizing`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
}
