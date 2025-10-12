/**
 * Server resilience constants
 * Retry logic, timeouts, rate limiting, and monitoring configurations
 */

/**
 * Default retry configuration
 */
export const RETRY_CONFIG = {
  DEFAULT_MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  MAX_DELAY_MS: 10000,
  CONNECTION_TIMEOUT_MS: 10000,
} as const;

/**
 * LOB API specific retry configuration
 */
export const LOB_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  MAX_DELAY_MS: 15000,
} as const;

/**
 * LOB webhook retry configuration (for less critical operations)
 */
export const LOB_WEBHOOK_RETRY_CONFIG = {
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 2000,
  MAX_DELAY_MS: 10000,
} as const;

/**
 * Rate limiting cleanup interval
 */
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Monitoring alert cooldown periods
 */
export const MONITORING_COOLDOWN_MINUTES = 5;

/**
 * Webhook validation settings
 */
export const WEBHOOK_TIMESTAMP_MAX_AGE_MS = 6 * 60 * 1000; // 6 minutes

/**
 * Sentry flush timeout
 */
export const SENTRY_FLUSH_TIMEOUT_MS = 2000;

/**
 * Time conversion helpers for server operations
 */
export const MS_PER_MINUTE = 60 * 1000;
export const MS_PER_SECOND = 1000;

