/**
 * In-memory Status Cache for Lob Status Lookups
 * 
 * Reduces API calls and improves response times by caching status data
 * with intelligent TTL based on mail piece status.
 * 
 * Cache Strategy:
 * - Active delivery states: Cache for 5 minutes (status changes frequently)
 * - Final states: Cache for 1 hour (status won't change)
 * - Unknown states: Cache for 10 minutes (conservative default)
 */

interface CachedStatus {
  status: string;
  lobStatus?: string;
  trackingNumber?: string;
  cachedAt: Date;
  expiresAt: Date;
}

// In-memory cache storage
const statusCache = new Map<string, CachedStatus>();

/**
 * Cache TTL configuration by status
 * Optimized for balance between freshness and API reduction
 */
const CACHE_TTL_MS = {
  // Active delivery states - cache for shorter time (5 minutes)
  // These statuses change frequently, so we check more often
  submitted: 5 * 60 * 1000,
  in_transit: 5 * 60 * 1000,
  in_local_area: 5 * 60 * 1000,
  processed_for_delivery: 5 * 60 * 1000,
  re_routed: 5 * 60 * 1000,
  
  // Final states - cache longer (1 hour)
  // These statuses won't change, safe to cache longer
  delivered: 60 * 60 * 1000,
  returned: 60 * 60 * 1000,
  failed: 60 * 60 * 1000,
  canceled: 60 * 60 * 1000,
  
  // Payment/submission states - moderate caching (10 minutes)
  draft: 10 * 60 * 1000,
  pending_payment: 10 * 60 * 1000,
  paid: 10 * 60 * 1000,
  
  // Default for unknown states - conservative (10 minutes)
  default: 10 * 60 * 1000,
} as const;

/**
 * Get TTL for a specific status
 */
function getTTL(status: string): number {
  return CACHE_TTL_MS[status as keyof typeof CACHE_TTL_MS] || CACHE_TTL_MS.default;
}

/**
 * Get status from cache if available and not expired
 * 
 * @param mailPieceId - Mail piece ID to look up
 * @returns Cached status if available and fresh, null otherwise
 */
export function getCachedStatus(mailPieceId: string): CachedStatus | null {
  const cached = statusCache.get(mailPieceId);
  
  if (!cached) {
    return null;
  }
  
  // Check if expired
  if (new Date() > cached.expiresAt) {
    statusCache.delete(mailPieceId);
    return null;
  }
  
  return cached;
}

/**
 * Cache status with appropriate TTL based on status value
 * 
 * @param mailPieceId - Mail piece ID
 * @param status - Internal status
 * @param lobStatus - Lob API status (optional)
 * @param trackingNumber - USPS tracking number (optional)
 */
export function setCachedStatus(
  mailPieceId: string,
  status: string,
  lobStatus?: string,
  trackingNumber?: string
): void {
  const ttl = getTTL(status);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttl);
  
  statusCache.set(mailPieceId, {
    status,
    lobStatus,
    trackingNumber,
    cachedAt: now,
    expiresAt,
  });
}

/**
 * Invalidate cache for a specific mail piece
 * Called when webhook updates status to ensure fresh data
 * 
 * @param mailPieceId - Mail piece ID to invalidate
 */
export function invalidateStatusCache(mailPieceId: string): void {
  statusCache.delete(mailPieceId);
}

/**
 * Clear entire cache
 * Useful for testing or maintenance
 */
export function clearStatusCache(): void {
  statusCache.clear();
}

/**
 * Get cache statistics for monitoring
 * 
 * @returns Cache statistics including size and validity counts
 */
export function getCacheStats() {
  const now = new Date();
  let valid = 0;
  let expired = 0;
  
  for (const [, cached] of statusCache) {
    if (now > cached.expiresAt) {
      expired++;
    } else {
      valid++;
    }
  }
  
  return {
    total: statusCache.size,
    valid,
    expired,
    hitRate: valid / (valid + expired) || 0,
  };
}

/**
 * Cleanup expired entries from cache
 * Prevents memory leaks from accumulating expired entries
 * 
 * @returns Number of entries removed
 */
export function cleanupExpiredCache(): number {
  const now = new Date();
  let removed = 0;
  
  for (const [mailPieceId, cached] of statusCache) {
    if (now > cached.expiresAt) {
      statusCache.delete(mailPieceId);
      removed++;
    }
  }
  
  return removed;
}

/**
 * Get cache entry for debugging/monitoring
 * Returns full cache entry without checking expiration
 * 
 * @param mailPieceId - Mail piece ID
 * @returns Cache entry if exists, undefined otherwise
 */
export function getCacheEntry(mailPieceId: string): CachedStatus | undefined {
  return statusCache.get(mailPieceId);
}

// Auto-cleanup expired entries every 5 minutes
// This prevents memory leaks from expired entries
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
const cleanupInterval = setInterval(() => {
  const removed = cleanupExpiredCache();
  if (removed > 0) {
    console.log(`[StatusCache] Cleaned up ${removed} expired entries`);
  }
}, CLEANUP_INTERVAL_MS);

// Allow cleanup interval to be cleared (useful for testing)
export function stopCleanupInterval(): void {
  clearInterval(cleanupInterval);
}

