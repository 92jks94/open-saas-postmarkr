/**
 * Centralized Lob Configuration
 * 
 * Consolidates all Lob-related configuration values in one place for easy
 * maintenance and consistency across the application.
 */

/**
 * Circuit Breaker Configuration
 * Prevents cascading failures when Lob API is experiencing issues
 */
export const LOB_CIRCUIT_BREAKER_CONFIG = {
  failureThreshold: 5,      // Open circuit after 5 consecutive failures
  timeoutMs: 60000,         // Keep circuit open for 60 seconds (1 minute)
  halfOpenMaxAttempts: 1,   // Try 1 request when half-open before deciding
} as const;

/**
 * Rate Limiting Configuration
 * Protects against exceeding Lob's rate limits and user abuse
 */
export const LOB_RATE_LIMIT_CONFIG = {
  // User-level rate limits (per operation)
  submissionsPerHour: 10,           // Max Lob submissions per user per hour
  addressValidationsPerHour: 30,    // Max address validations per user per hour
  statusChecksPerHour: 60,          // Max status checks per user per hour
  
  // System-level rate limits (Lob API)
  defaultRetryAfterMs: 60000,       // Default wait time when rate limited (1 minute)
} as const;

/**
 * Retry Configuration for Different Operation Types
 * Each operation type has optimized retry settings based on criticality
 */
export const LOB_RETRY_CONFIG = {
  // Address validation - less critical, can retry more
  addressValidation: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 5000,
  },
  
  // Cost calculation - important for user experience
  costCalculation: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 8000,
  },
  
  // Mail piece creation - critical operation
  mailPieceCreation: {
    maxAttempts: 5,
    baseDelayMs: 2000,
    maxDelayMs: 15000,
  },
  
  // Status retrieval - can be retried frequently
  statusRetrieval: {
    maxAttempts: 3,
    baseDelayMs: 1000,
    maxDelayMs: 10000,
  },
  
  // Webhook processing - should be fast
  webhookProcessing: {
    maxAttempts: 2,
    baseDelayMs: 500,
    maxDelayMs: 3000,
  }
} as const;

/**
 * Background Job Configuration
 * Settings for PgBoss job queue processing
 */
export const LOB_JOB_CONFIG = {
  // Submit paid mail to Lob job
  submitPaidMail: {
    retryLimit: 3,              // Retry up to 3 times
    retryDelaySeconds: 60,      // Wait 60 seconds between retries
    retryBackoff: true,         // Use exponential backoff
    expireInHours: 24,          // Expire job after 24 hours
  },
  
  // Payment verification job (scheduled)
  paymentVerification: {
    scheduleEveryMinutes: 5,    // Run every 5 minutes
    lookbackHours: 24,          // Check pieces from last 24 hours
  },
} as const;

/**
 * Validation Configuration
 * Settings for address and mail piece validation
 */
export const LOB_VALIDATION_CONFIG = {
  // File requirements
  maxFileSizeMB: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  allowedFileTypes: ['application/pdf'] as const,
  
  // Page count limits
  minPagesPerLetter: 1,
  maxPagesPerLetter: 20,      // Per Lob limits
  maxPagesPerPostcard: 1,
  
  // Address requirements
  requiredAddressFields: [
    'address_line1',
    'address_city',
    'address_state',
    'address_zip',
    'address_country'
  ] as const,
} as const;

/**
 * Simulation Mode Configuration
 * Settings for development/testing without actual Lob API calls
 */
export const LOB_SIMULATION_CONFIG = {
  enabled: !process.env.LOB_TEST_KEY && !process.env.LOB_PROD_KEY,
  mockDelayMs: 500,             // Simulate API delay
  mockCostCents: 60,            // $0.60 default cost
  mockDeliveryDays: 3,          // Estimated delivery in 3 days
} as const;

/**
 * API Configuration
 * Settings for Lob API interaction
 */
export const LOB_API_CONFIG = {
  environment: process.env.LOB_ENVIRONMENT || 'test',
  baseUrl: process.env.LOB_BASE_URL || 'https://api.lob.com/v1',
  apiVersion: 'v1',
  
  // Timeouts
  requestTimeoutMs: 30000,      // 30 second request timeout
  
  // Default mail settings
  defaultMailSettings: {
    color: false,               // Default to black & white
    doubleSided: true,          // Default to double-sided
    addressPlacement: 'insert_blank_page' as const,
    useType: 'operational' as const,
  },
} as const;

/**
 * Error Handling Configuration
 */
export const LOB_ERROR_CONFIG = {
  // HTTP status codes that should trigger retries
  retriableStatusCodes: [429, 500, 502, 503, 504] as const,
  
  // Error codes that should never retry
  nonRetriableErrorCodes: [
    'invalid_request',
    'authentication_error',
    'invalid_file',
  ] as const,
  
  // Timeout for error logging
  errorLogRetentionDays: 30,
} as const;

/**
 * Monitoring & Alerting Configuration
 */
export const LOB_MONITORING_CONFIG = {
  // Alert thresholds
  duplicateSubmissionAlertThreshold: 1,     // Alert on any duplicate attempt
  failureRateAlertThreshold: 0.05,          // Alert if >5% failure rate
  circuitBreakerAlertEnabled: true,
  
  // Metrics collection
  metricsEnabled: true,
  metricsFlushIntervalMs: 60000,            // Flush metrics every minute
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  verboseLogging: process.env.LOB_VERBOSE_LOGGING === 'true',
} as const;

/**
 * Helper function to get job configuration
 */
export function getLobJobConfig(jobName: keyof typeof LOB_JOB_CONFIG) {
  return LOB_JOB_CONFIG[jobName];
}

/**
 * Helper function to get retry configuration
 */
export function getLobRetryConfig(operationType: keyof typeof LOB_RETRY_CONFIG) {
  return LOB_RETRY_CONFIG[operationType];
}

/**
 * Helper function to check if in simulation mode
 */
export function isLobSimulationMode(): boolean {
  return LOB_SIMULATION_CONFIG.enabled;
}

/**
 * Helper function to check if status code is retriable
 */
export function isRetriableStatusCode(statusCode: number): boolean {
  return (LOB_ERROR_CONFIG.retriableStatusCodes as readonly number[]).includes(statusCode);
}

/**
 * Helper function to check if error code is retriable
 */
export function isRetriableErrorCode(errorCode: string): boolean {
  return !LOB_ERROR_CONFIG.nonRetriableErrorCodes.includes(errorCode as any);
}

