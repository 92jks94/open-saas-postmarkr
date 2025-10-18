/**
 * Standardized Error Catalog for Lob Operations
 * 
 * Provides consistent error messages, codes, and handling across the application.
 * Each error includes:
 * - code: Unique identifier for tracking/monitoring
 * - message: Technical message for logs
 * - userMessage: User-friendly message for UI
 * - action: Recommended action (RETRY, ALERT_ADMIN, USER_ACTION_REQUIRED, etc.)
 * - severity: ERROR, WARNING, CRITICAL
 */

export interface LobErrorDefinition {
  code: string;
  message: string;
  userMessage: string;
  action: 'RETRY' | 'ALERT_ADMIN' | 'USER_ACTION_REQUIRED' | 'NO_ACTION' | 'CONTACT_SUPPORT';
  severity: 'ERROR' | 'WARNING' | 'CRITICAL';
  httpStatus: number;
}

/**
 * Lob API Error Catalog
 */
export const LOB_ERRORS = {
  // Address validation errors
  ADDRESS_INVALID: {
    code: 'LOB_001',
    message: 'Invalid address format or missing required fields',
    userMessage: 'Please check your address details. Make sure all required fields are filled out correctly.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  ADDRESS_UNDELIVERABLE: {
    code: 'LOB_002',
    message: 'Address verification failed - address is undeliverable',
    userMessage: 'This address cannot receive mail. Please verify the address and try again.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  ADDRESS_LINE1_REQUIRED: {
    code: 'LOB_003',
    message: 'Address line 1 is required',
    userMessage: 'Street address is required.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  ADDRESS_CITY_REQUIRED: {
    code: 'LOB_004',
    message: 'City is required',
    userMessage: 'City is required.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  ADDRESS_STATE_REQUIRED: {
    code: 'LOB_005',
    message: 'State is required',
    userMessage: 'State is required.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  ADDRESS_ZIP_REQUIRED: {
    code: 'LOB_006',
    message: 'ZIP code is required',
    userMessage: 'ZIP code is required.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  // File errors
  FILE_INVALID: {
    code: 'LOB_101',
    message: 'Invalid file format or file cannot be processed',
    userMessage: 'The file you uploaded cannot be processed. Please ensure it\'s a valid PDF.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  FILE_TOO_LARGE: {
    code: 'LOB_102',
    message: 'File size exceeds maximum allowed',
    userMessage: 'File size must be less than 10MB.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  FILE_PAGE_COUNT_INVALID: {
    code: 'LOB_103',
    message: 'File page count exceeds limits or is invalid',
    userMessage: 'Your document must be between 1 and 20 pages.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  FILE_NOT_FOUND: {
    code: 'LOB_104',
    message: 'File not found or cannot be accessed',
    userMessage: 'We couldn\'t access your file. Please try uploading again.',
    action: 'RETRY',
    severity: 'ERROR',
    httpStatus: 404,
  },
  
  // Authentication & authorization errors
  LOB_API_AUTH_FAILED: {
    code: 'LOB_201',
    message: 'Lob API authentication failed',
    userMessage: 'We\'re experiencing technical difficulties. Our team has been notified.',
    action: 'ALERT_ADMIN',
    severity: 'CRITICAL',
    httpStatus: 401,
  },
  
  LOB_API_KEY_MISSING: {
    code: 'LOB_202',
    message: 'Lob API key not configured',
    userMessage: 'Service configuration error. Please contact support.',
    action: 'ALERT_ADMIN',
    severity: 'CRITICAL',
    httpStatus: 500,
  },
  
  // Rate limiting errors
  RATE_LIMIT_EXCEEDED: {
    code: 'LOB_301',
    message: 'Lob API rate limit exceeded',
    userMessage: 'Too many requests. Please wait a moment and try again.',
    action: 'RETRY',
    severity: 'WARNING',
    httpStatus: 429,
  },
  
  USER_RATE_LIMIT_EXCEEDED: {
    code: 'LOB_302',
    message: 'User rate limit exceeded for this operation',
    userMessage: 'You\'ve reached the limit for this action. Please try again later.',
    action: 'NO_ACTION',
    severity: 'WARNING',
    httpStatus: 429,
  },
  
  // Payment errors
  PAYMENT_NOT_COMPLETED: {
    code: 'LOB_401',
    message: 'Payment not completed before Lob submission',
    userMessage: 'Payment must be completed before sending mail.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  PAYMENT_STATUS_INVALID: {
    code: 'LOB_402',
    message: 'Invalid payment status for this operation',
    userMessage: 'Payment status doesn\'t allow this action.',
    action: 'NO_ACTION',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  // Submission errors
  ALREADY_SUBMITTED: {
    code: 'LOB_501',
    message: 'Mail piece already submitted to Lob',
    userMessage: 'This mail has already been sent.',
    action: 'NO_ACTION',
    severity: 'WARNING',
    httpStatus: 400,
  },
  
  DUPLICATE_SUBMISSION_ATTEMPTED: {
    code: 'LOB_502',
    message: 'Duplicate Lob submission attempted - prevented by system',
    userMessage: 'This mail piece has already been submitted.',
    action: 'ALERT_ADMIN',  // Alert because this should not happen
    severity: 'CRITICAL',
    httpStatus: 409,
  },
  
  MAIL_PIECE_NOT_READY: {
    code: 'LOB_503',
    message: 'Mail piece not ready for submission',
    userMessage: 'This mail piece cannot be sent yet. Please complete all required steps.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  // Balance & billing errors
  INSUFFICIENT_LOB_BALANCE: {
    code: 'LOB_601',
    message: 'Insufficient Lob account balance',
    userMessage: 'We\'re unable to process your mail at this time. Our team has been notified.',
    action: 'ALERT_ADMIN',
    severity: 'CRITICAL',
    httpStatus: 402,
  },
  
  // Network & system errors
  CIRCUIT_BREAKER_OPEN: {
    code: 'LOB_701',
    message: 'Circuit breaker open - Lob API temporarily unavailable',
    userMessage: 'Service temporarily unavailable due to repeated failures. Please try again in a few minutes.',
    action: 'RETRY',
    severity: 'ERROR',
    httpStatus: 503,
  },
  
  LOB_API_TIMEOUT: {
    code: 'LOB_702',
    message: 'Lob API request timed out',
    userMessage: 'Request timed out. Please try again.',
    action: 'RETRY',
    severity: 'WARNING',
    httpStatus: 504,
  },
  
  LOB_API_UNAVAILABLE: {
    code: 'LOB_703',
    message: 'Lob API unavailable or not responding',
    userMessage: 'Service temporarily unavailable. Please try again later.',
    action: 'RETRY',
    severity: 'ERROR',
    httpStatus: 503,
  },
  
  NETWORK_ERROR: {
    code: 'LOB_704',
    message: 'Network error during Lob API call',
    userMessage: 'Connection error. Please check your internet connection and try again.',
    action: 'RETRY',
    severity: 'WARNING',
    httpStatus: 500,
  },
  
  // Internal errors
  INTERNAL_ERROR: {
    code: 'LOB_801',
    message: 'Internal error during Lob operation',
    userMessage: 'An unexpected error occurred. Please try again or contact support if the problem persists.',
    action: 'CONTACT_SUPPORT',
    severity: 'ERROR',
    httpStatus: 500,
  },
  
  DATABASE_ERROR: {
    code: 'LOB_802',
    message: 'Database error during mail piece operation',
    userMessage: 'An error occurred saving your mail piece. Please try again.',
    action: 'RETRY',
    severity: 'ERROR',
    httpStatus: 500,
  },
  
  VALIDATION_ERROR: {
    code: 'LOB_803',
    message: 'Validation error for mail piece data',
    userMessage: 'Please check all fields and try again.',
    action: 'USER_ACTION_REQUIRED',
    severity: 'ERROR',
    httpStatus: 400,
  },
  
  // Webhook errors
  WEBHOOK_VERIFICATION_FAILED: {
    code: 'LOB_901',
    message: 'Webhook signature verification failed',
    userMessage: 'Invalid webhook request.',
    action: 'ALERT_ADMIN',
    severity: 'CRITICAL',
    httpStatus: 401,
  },
  
  WEBHOOK_PROCESSING_ERROR: {
    code: 'LOB_902',
    message: 'Error processing webhook event',
    userMessage: 'Webhook processing failed.',
    action: 'ALERT_ADMIN',
    severity: 'ERROR',
    httpStatus: 500,
  },
} as const satisfies Record<string, LobErrorDefinition>;

/**
 * Type for Lob error codes
 */
export type LobErrorCode = keyof typeof LOB_ERRORS;

/**
 * Helper function to get error definition by code
 */
export function getLobError(errorCode: LobErrorCode): LobErrorDefinition {
  return LOB_ERRORS[errorCode];
}

/**
 * Helper function to check if an error requires admin alert
 */
export function requiresAdminAlert(errorCode: LobErrorCode): boolean {
  return LOB_ERRORS[errorCode].action === 'ALERT_ADMIN';
}

/**
 * Helper function to check if an error is retriable
 */
export function isRetriableError(errorCode: LobErrorCode): boolean {
  return LOB_ERRORS[errorCode].action === 'RETRY';
}

/**
 * Helper function to check if an error is critical
 */
export function isCriticalError(errorCode: LobErrorCode): boolean {
  return LOB_ERRORS[errorCode].severity === 'CRITICAL';
}

/**
 * Map HTTP status codes to error codes
 */
export function mapHttpStatusToErrorCode(statusCode: number): LobErrorCode {
  switch (statusCode) {
    case 400:
      return 'VALIDATION_ERROR';
    case 401:
      return 'LOB_API_AUTH_FAILED';
    case 402:
      return 'INSUFFICIENT_LOB_BALANCE';
    case 404:
      return 'FILE_NOT_FOUND';
    case 429:
      return 'RATE_LIMIT_EXCEEDED';
    case 500:
      return 'INTERNAL_ERROR';
    case 503:
      return 'LOB_API_UNAVAILABLE';
    case 504:
      return 'LOB_API_TIMEOUT';
    default:
      return 'INTERNAL_ERROR';
  }
}

/**
 * Map Lob API error messages to error codes
 */
export function mapLobApiErrorToErrorCode(errorMessage: string): LobErrorCode {
  const lowerMessage = errorMessage.toLowerCase();
  
  if (lowerMessage.includes('address')) {
    if (lowerMessage.includes('undeliverable')) return 'ADDRESS_UNDELIVERABLE';
    return 'ADDRESS_INVALID';
  }
  
  if (lowerMessage.includes('file')) {
    if (lowerMessage.includes('size')) return 'FILE_TOO_LARGE';
    if (lowerMessage.includes('page')) return 'FILE_PAGE_COUNT_INVALID';
    return 'FILE_INVALID';
  }
  
  if (lowerMessage.includes('rate limit')) {
    return 'RATE_LIMIT_EXCEEDED';
  }
  
  if (lowerMessage.includes('insufficient') || lowerMessage.includes('balance')) {
    return 'INSUFFICIENT_LOB_BALANCE';
  }
  
  if (lowerMessage.includes('authentication') || lowerMessage.includes('unauthorized')) {
    return 'LOB_API_AUTH_FAILED';
  }
  
  if (lowerMessage.includes('timeout')) {
    return 'LOB_API_TIMEOUT';
  }
  
  return 'INTERNAL_ERROR';
}

