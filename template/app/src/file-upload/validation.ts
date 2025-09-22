// Set this to the max file size you want to allow (currently 5MB).
// Nathan - Updated to 10MB and restricted to pdf only
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
] as const;
