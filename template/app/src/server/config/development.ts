/**
 * Development-specific configuration
 * This file contains settings that are only used in development mode
 */

/**
 * Check if we're running in development mode
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
}

/**
 * Check if email verification should be skipped in development
 */
export function shouldSkipEmailVerification(): boolean {
  return isDevelopment() && process.env.SKIP_EMAIL_VERIFICATION === 'true';
}

/**
 * Development-specific auth configuration
 */
export const developmentAuthConfig = {
  skipEmailVerification: shouldSkipEmailVerification(),
  isDevelopment: isDevelopment(),
};
