/**
 * Retry mechanism for Lob API calls
 *
 * Implements exponential backoff and jitter for robust API integration
 */
interface RetryOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    jitter?: boolean;
    retryCondition?: (error: any) => boolean;
}
/**
 * Retry a function with exponential backoff
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
/**
 * Retry configuration for different types of Lob API calls
 */
export declare const RETRY_CONFIGS: {
    readonly addressValidation: {
        readonly maxRetries: 2;
        readonly baseDelay: 500;
        readonly maxDelay: 5000;
    };
    readonly costCalculation: {
        readonly maxRetries: 3;
        readonly baseDelay: 1000;
        readonly maxDelay: 8000;
    };
    readonly mailPieceCreation: {
        readonly maxRetries: 5;
        readonly baseDelay: 2000;
        readonly maxDelay: 15000;
    };
    readonly statusRetrieval: {
        readonly maxRetries: 3;
        readonly baseDelay: 1000;
        readonly maxDelay: 10000;
    };
    readonly webhookProcessing: {
        readonly maxRetries: 2;
        readonly baseDelay: 500;
        readonly maxDelay: 3000;
    };
};
/**
 * Rate limit detection and handling
 */
export declare class RateLimitHandler {
    private static instance;
    private rateLimitUntil;
    static getInstance(): RateLimitHandler;
    /**
     * Check if we're currently rate limited
     */
    isRateLimited(): boolean;
    /**
     * Set rate limit until timestamp
     */
    setRateLimited(until: number): void;
    /**
     * Wait for rate limit to expire
     */
    waitForRateLimit(): Promise<void>;
    /**
     * Extract rate limit info from error and set appropriate delay
     */
    handleRateLimitError(error: any): void;
}
/**
 * Circuit breaker pattern for Lob API
 */
export declare class CircuitBreaker {
    private static instance;
    private failureCount;
    private lastFailureTime;
    private state;
    private readonly failureThreshold;
    private readonly timeout;
    static getInstance(): CircuitBreaker;
    /**
     * Check if circuit breaker allows the request
     */
    canExecute(): boolean;
    /**
     * Record a successful request
     */
    onSuccess(): void;
    /**
     * Record a failed request
     */
    onFailure(): void;
    /**
     * Get current state
     */
    getState(): string;
}
export {};
