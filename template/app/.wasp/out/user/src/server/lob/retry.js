/**
 * Retry mechanism for Lob API calls
 *
 * Implements exponential backoff and jitter for robust API integration
 */
const DEFAULT_OPTIONS = {
    maxRetries: 3,
    baseDelay: 1000, // 1 second
    maxDelay: 10000, // 10 seconds
    jitter: true,
    retryCondition: (error) => {
        // Retry on network errors, rate limits, and temporary server errors
        if (error?.code === 'ECONNRESET' ||
            error?.code === 'ENOTFOUND' ||
            error?.code === 'ETIMEDOUT') {
            return true;
        }
        if (error?.status === 429 || // Rate limit
            error?.status === 500 || // Internal server error
            error?.status === 502 || // Bad gateway
            error?.status === 503 || // Service unavailable
            error?.status === 504) { // Gateway timeout
            return true;
        }
        // Retry on specific Lob API errors
        if (error?.message?.includes('rate limit') ||
            error?.message?.includes('temporary') ||
            error?.message?.includes('timeout')) {
            return true;
        }
        return false;
    }
};
/**
 * Sleep for a specified number of milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Calculate delay with exponential backoff and optional jitter
 */
function calculateDelay(attempt, options) {
    const exponentialDelay = options.baseDelay * Math.pow(2, attempt - 1);
    const delay = Math.min(exponentialDelay, options.maxDelay);
    if (options.jitter) {
        // Add random jitter to prevent thundering herd
        const jitterAmount = delay * 0.1; // 10% jitter
        const jitter = (Math.random() - 0.5) * 2 * jitterAmount;
        return Math.max(0, delay + jitter);
    }
    return delay;
}
/**
 * Retry a function with exponential backoff
 */
export async function withRetry(fn, options = {}) {
    const config = { ...DEFAULT_OPTIONS, ...options };
    let lastError;
    for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
        try {
            const result = await fn();
            if (attempt > 1) {
                console.log(`✅ Retry successful on attempt ${attempt}`);
            }
            return result;
        }
        catch (error) {
            lastError = error;
            console.warn(`⚠️  Attempt ${attempt} failed:`, {
                error: error instanceof Error ? error.message : String(error),
                willRetry: attempt < config.maxRetries && config.retryCondition(error)
            });
            // Don't retry if this is the last attempt or error doesn't meet retry condition
            if (attempt >= config.maxRetries || !config.retryCondition(error)) {
                break;
            }
            // Calculate delay and wait
            const delay = calculateDelay(attempt, config);
            console.log(`⏳ Waiting ${Math.round(delay)}ms before retry ${attempt + 1}...`);
            await sleep(delay);
        }
    }
    // All retries exhausted
    console.error(`❌ All ${config.maxRetries} attempts failed`);
    throw lastError;
}
/**
 * Retry configuration for different types of Lob API calls
 */
export const RETRY_CONFIGS = {
    // Address validation - less critical, can retry more
    addressValidation: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 5000,
    },
    // Cost calculation - important for user experience
    costCalculation: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 8000,
    },
    // Mail piece creation - critical operation
    mailPieceCreation: {
        maxRetries: 5,
        baseDelay: 2000,
        maxDelay: 15000,
    },
    // Status retrieval - can be retried frequently
    statusRetrieval: {
        maxRetries: 3,
        baseDelay: 1000,
        maxDelay: 10000,
    },
    // Webhook processing - should be fast
    webhookProcessing: {
        maxRetries: 2,
        baseDelay: 500,
        maxDelay: 3000,
    }
};
/**
 * Rate limit detection and handling
 */
export class RateLimitHandler {
    static instance;
    rateLimitUntil = 0;
    static getInstance() {
        if (!RateLimitHandler.instance) {
            RateLimitHandler.instance = new RateLimitHandler();
        }
        return RateLimitHandler.instance;
    }
    /**
     * Check if we're currently rate limited
     */
    isRateLimited() {
        return Date.now() < this.rateLimitUntil;
    }
    /**
     * Set rate limit until timestamp
     */
    setRateLimited(until) {
        this.rateLimitUntil = until;
        console.warn(`🚫 Rate limited until ${new Date(until).toISOString()}`);
    }
    /**
     * Wait for rate limit to expire
     */
    async waitForRateLimit() {
        if (this.isRateLimited()) {
            const waitTime = this.rateLimitUntil - Date.now();
            console.log(`⏳ Waiting ${Math.round(waitTime)}ms for rate limit to expire...`);
            await sleep(waitTime);
        }
    }
    /**
     * Extract rate limit info from error and set appropriate delay
     */
    handleRateLimitError(error) {
        // Try to extract rate limit info from error headers or message
        const retryAfter = error?.headers?.['retry-after'] ||
            error?.headers?.['Retry-After'] ||
            error?.response?.headers?.['retry-after'] ||
            error?.response?.headers?.['Retry-After'];
        if (retryAfter) {
            const delayMs = parseInt(retryAfter) * 1000;
            this.setRateLimited(Date.now() + delayMs);
        }
        else {
            // Default rate limit delay
            this.setRateLimited(Date.now() + 60000); // 1 minute
        }
    }
}
/**
 * Circuit breaker pattern for Lob API
 */
export class CircuitBreaker {
    static instance;
    failureCount = 0;
    lastFailureTime = 0;
    state = 'CLOSED';
    failureThreshold = 5;
    timeout = 60000; // 1 minute
    static getInstance() {
        if (!CircuitBreaker.instance) {
            CircuitBreaker.instance = new CircuitBreaker();
        }
        return CircuitBreaker.instance;
    }
    /**
     * Check if circuit breaker allows the request
     */
    canExecute() {
        if (this.state === 'CLOSED') {
            return true;
        }
        if (this.state === 'OPEN') {
            if (Date.now() - this.lastFailureTime > this.timeout) {
                this.state = 'HALF_OPEN';
                return true;
            }
            return false;
        }
        // HALF_OPEN state - allow one request to test
        return true;
    }
    /**
     * Record a successful request
     */
    onSuccess() {
        this.failureCount = 0;
        this.state = 'CLOSED';
    }
    /**
     * Record a failed request
     */
    onFailure() {
        this.failureCount++;
        this.lastFailureTime = Date.now();
        if (this.failureCount >= this.failureThreshold) {
            this.state = 'OPEN';
            console.error(`🔴 Circuit breaker opened after ${this.failureCount} failures`);
        }
    }
    /**
     * Get current state
     */
    getState() {
        return this.state;
    }
}
