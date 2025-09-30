/**
 * Operation-Level Rate Limiting
 * 
 * Implements rate limiting within Wasp operations to prevent abuse and cost overruns.
 * Uses in-memory storage for simplicity (consider Redis for production scaling).
 */

import { HttpError } from 'wasp/server';
import { RATE_LIMITS } from './config';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

interface RateLimitConfig {
  windowMs: number;
  max: number;
  message: string;
}

// In-memory rate limit store (consider Redis for production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Generate a unique key for rate limiting
 */
function getRateLimitKey(userId: string | number | undefined, operation: string): string {
  if (userId) {
    return `user:${userId}:${operation}`;
  }
  // For operations without user context, use a generic key
  // In a real app, you might want to use IP address here
  return `anonymous:${operation}`;
}

/**
 * Check if a request should be rate limited
 */
function checkRateLimit(key: string, config: RateLimitConfig): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);

  if (!entry || now > entry.resetTime) {
    // No entry or window expired, create new entry
    rateLimitStore.set(key, {
      count: 1,
      resetTime: now + config.windowMs
    });
    return true; // Allow request
  }

  if (entry.count >= config.max) {
    return false; // Rate limit exceeded
  }

  // Increment count
  entry.count++;
  return true; // Allow request
}

/**
 * Clean up expired entries periodically
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);

/**
 * Rate limiting decorator for operations
 */
export function withRateLimit(
  operation: string,
  limitType: keyof typeof RATE_LIMITS,
  userId?: string | number
) {
  return function (target: any, propertyName: string, descriptor: PropertyDescriptor) {
    const method = descriptor.value;
    
    descriptor.value = async function (...args: any[]) {
      const key = getRateLimitKey(userId, operation);
      const config = RATE_LIMITS[limitType];
      
      if (!checkRateLimit(key, config)) {
        console.warn('[RATE_LIMIT] Rate limit exceeded', {
          key,
          operation,
          limitType,
          timestamp: new Date().toISOString(),
        });
        
        throw new HttpError(429, config.message);
      }
      
      return method.apply(this, args);
    };
  };
}

/**
 * Rate limiting function for direct use in operations
 */
export function checkOperationRateLimit(
  operation: string,
  limitType: keyof typeof RATE_LIMITS,
  userId?: string | number
): void {
  const key = getRateLimitKey(userId, operation);
  const config = RATE_LIMITS[limitType];
  
  if (!checkRateLimit(key, config)) {
    console.warn('[RATE_LIMIT] Rate limit exceeded', {
      key,
      operation,
      limitType,
      timestamp: new Date().toISOString(),
    });
    
    throw new HttpError(429, config.message);
  }
}

/**
 * Get rate limit status for debugging
 */
export function getRateLimitStatus(key: string): RateLimitEntry | null {
  return rateLimitStore.get(key) || null;
}

/**
 * Clear rate limit for a specific key (useful for testing)
 */
export function clearRateLimit(key: string): void {
  rateLimitStore.delete(key);
}

/**
 * Clear all rate limits (useful for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}
