import { type PageViewSource } from 'wasp/entities';

// Cache interface for Google Analytics data
interface GACacheEntry {
  data: {
    totalViews: number;
    prevDayViewsChangePercent: string;
    sources: Array<{
      source: string;
      visitors: number;
    }>;
  };
  timestamp: Date;
  expiresAt: Date;
}

// In-memory cache (in production, consider using Redis or database cache)
const gaCache = new Map<string, GACacheEntry>();

// Enhanced source data interface
export interface EnhancedSourceData {
  source: string;
  visitors: number;
  conversionRate: number;
  revenuePerVisitor: number;
  qualityScore: number;
  lastActivity: Date;
  trendDirection: 'up' | 'down' | 'stable';
  trendPercentage: number;
}

// Retry utility with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, i);
      console.log(`Retry attempt ${i + 1} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Max retries exceeded');
}

// Cache key generator
function getCacheKey(date: Date): string {
  return `ga-data-${date.toISOString().split('T')[0]}`;
}

// Check if cache entry is valid
function isCacheValid(entry: GACacheEntry): boolean {
  return new Date() < entry.expiresAt;
}

// Get cached data if available and valid
export function getCachedGAData(date: Date): GACacheEntry | null {
  const key = getCacheKey(date);
  const entry = gaCache.get(key);
  
  if (entry && isCacheValid(entry)) {
    console.log(`Using cached GA data for ${key}`);
    return entry;
  }
  
  return null;
}

// Store data in cache
export function setCachedGAData(
  date: Date,
  data: GACacheEntry['data'],
  ttlHours: number = 6
): void {
  const key = getCacheKey(date);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  
  gaCache.set(key, {
    data,
    timestamp: now,
    expiresAt,
  });
  
  console.log(`Cached GA data for ${key}, expires at ${expiresAt.toISOString()}`);
}

// Validate Google Analytics data
export function validateGAData(data: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (typeof data.totalViews !== 'number' || data.totalViews < 0) {
    errors.push(`Invalid totalViews: ${data.totalViews}`);
  }
  
  if (typeof data.prevDayViewsChangePercent !== 'string') {
    errors.push(`Invalid prevDayViewsChangePercent: ${data.prevDayViewsChangePercent}`);
  }
  
  if (!Array.isArray(data.sources)) {
    errors.push('Sources must be an array');
  } else {
    data.sources.forEach((source: any, index: number) => {
      if (!source.source || typeof source.source !== 'string') {
        errors.push(`Source ${index}: invalid source name`);
      }
      if (typeof source.visitors !== 'number' || source.visitors < 0) {
        errors.push(`Source ${index}: invalid visitors count`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Calculate enhanced source metrics
export function calculateEnhancedSourceMetrics(
  sources: Array<{ source: string; visitors: number }>,
  totalRevenue: number,
  totalUsers: number
): EnhancedSourceData[] {
  const totalVisitors = sources.reduce((sum, source) => sum + source.visitors, 0);
  
  return sources.map(source => {
    // Calculate conversion rate (visitors to users)
    const conversionRate = totalVisitors > 0 ? (source.visitors / totalVisitors) * (totalUsers / totalVisitors) : 0;
    
    // Calculate revenue per visitor
    const revenuePerVisitor = source.visitors > 0 ? (source.visitors / totalVisitors) * totalRevenue / source.visitors : 0;
    
    // Calculate quality score based on conversion rate and visitor volume
    const volumeScore = Math.min(source.visitors / 100, 10); // Cap at 10 for high volume
    const conversionScore = conversionRate * 100; // Convert to 0-100 scale
    const qualityScore = Math.min((volumeScore + conversionScore) / 2, 10); // Average, capped at 10
    
    // Determine trend (simplified - in real implementation, compare with historical data)
    const trendDirection: 'up' | 'down' | 'stable' = 
      conversionRate > 0.05 ? 'up' : 
      conversionRate < 0.02 ? 'down' : 'stable';
    
    const trendPercentage = Math.abs(conversionRate - 0.03) * 100; // Compare against baseline 3%
    
    return {
      source: source.source,
      visitors: source.visitors,
      conversionRate: Math.round(conversionRate * 10000) / 100, // Convert to percentage with 2 decimals
      revenuePerVisitor: Math.round(revenuePerVisitor * 100) / 100, // Round to 2 decimals
      qualityScore: Math.round(qualityScore * 10) / 10, // Round to 1 decimal
      lastActivity: new Date(),
      trendDirection,
      trendPercentage: Math.round(trendPercentage * 10) / 10,
    };
  });
}

// Clean up expired cache entries
export function cleanupExpiredCache(): void {
  const now = new Date();
  let cleanedCount = 0;
  
  for (const [key, entry] of gaCache.entries()) {
    if (now >= entry.expiresAt) {
      gaCache.delete(key);
      cleanedCount++;
    }
  }
  
  if (cleanedCount > 0) {
    console.log(`Cleaned up ${cleanedCount} expired cache entries`);
  }
}
