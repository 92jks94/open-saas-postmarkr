/**
 * File upload and validation constants
 * Used by both client (pre-upload validation) and server (post-upload validation)
 */

/**
 * File size limits
 */
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_FILE_SIZE_MB = 10;

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
] as const;

/**
 * Page count requirements per mail type
 */
export const MAIL_TYPE_PAGE_REQUIREMENTS = {
  'letter': {
    minPages: 1,
    maxPages: 50,
    allowedOrientations: ['portrait'] as const,
    recommendedSizes: ['4x6'] as const // #10 envelope
  },
  // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
  // 'postcard': {
  //   minPages: 1,
  //   maxPages: 1,
  //   allowedOrientations: ['portrait', 'landscape'] as const,
  //   recommendedSizes: ['4x6'] as const
  // },
  // 'check': {
  //   minPages: 1,
  //   maxPages: 1,
  //   allowedOrientations: ['portrait'] as const,
  //   recommendedSizes: ['6x9'] as const
  // },
  // 'self_mailer': {
  //   minPages: 1,
  //   maxPages: 4,
  //   allowedOrientations: ['portrait', 'landscape'] as const,
  //   recommendedSizes: ['6x9', '6x11', '6x18'] as const
  // },
  // 'catalog': {
  //   minPages: 2,
  //   maxPages: 50,
  //   allowedOrientations: ['portrait'] as const,
  //   recommendedSizes: ['9x12', '12x15', '12x18'] as const
  // },
  // 'booklet': {
  //   minPages: 2,
  //   maxPages: 20,
  //   allowedOrientations: ['portrait'] as const,
  //   recommendedSizes: ['6x9', '9x12'] as const
  // }
} as const;

/**
 * Mail size dimensions (in inches)
 */
export const MAIL_SIZE_DIMENSIONS = {
  '4x6': { width: 4, height: 6 },
  '6x9': { width: 6, height: 9 },
  '6x11': { width: 6, height: 11 },
  '6x18': { width: 6, height: 18 },
  '9x12': { width: 9, height: 12 },
  '12x15': { width: 12, height: 15 },
  '12x18': { width: 12, height: 18 }
} as const;

/**
 * PDF dimension limits (in pixels)
 */
export const MAX_PDF_DIMENSION_PIXELS = 2000;

/**
 * Conversion constant for file size calculations
 */
export const BYTES_PER_KB = 1024;

/**
 * Dimension tolerance for size matching (10%)
 */
export const DIMENSION_TOLERANCE = 0.1;

