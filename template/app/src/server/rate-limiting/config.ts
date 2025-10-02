/**
 * Rate Limiting Configuration
 * 
 * Defines rate limits for different endpoint categories to protect against:
 * - DDoS attacks
 * - API abuse
 * - Cost overruns from excessive Stripe/Lob API calls
 */

export const RATE_LIMITS = {
  // Mail creation: 10 requests per hour
  // Prevents abuse of Lob API calls and excessive costs
  mail: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'Mail creation limit exceeded. Please try again later.',
  },
  
  // File upload: 10 requests per hour
  // Prevents storage abuse and excessive S3 costs
  fileUpload: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10,
    message: 'File upload limit exceeded. Please try again later.',
  },
  
  // Payment: 5 requests per minute
  // Protects against payment processing abuse
  payment: {
    windowMs: 60 * 1000, // 1 minute
    max: 5,
    message: 'Too many payment requests. Please try again shortly.',
  },
  
  // Address validation: 20 requests per hour
  // Prevents abuse of Lob API for free validation
  addressValidation: {
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 20,
    message: 'Address validation limit exceeded. Please try again later.',
  },
};

/**
 * Webhook paths that should NEVER be rate limited
 * These endpoints have their own security (HMAC signature verification)
 */
export const EXEMPT_PATHS = [
  '/webhooks/lob',
  '/payments-webhook',
  '/health',
  '/api/webhooks/health',
  '/api/webhooks/metrics',
  '/api/webhooks/events',
];

