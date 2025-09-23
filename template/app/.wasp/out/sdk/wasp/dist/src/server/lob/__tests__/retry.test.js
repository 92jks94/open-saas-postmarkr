/**
 * Error Handling and Retry Logic Tests
 *
 * Tests circuit breaker, rate limiting, and retry mechanisms with real scenarios
 */
import { withRetry, RETRY_CONFIGS, RateLimitHandler, CircuitBreaker } from '../retry';
describe('Retry Logic and Error Handling', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset singleton instances
        RateLimitHandler.instance = undefined;
        CircuitBreaker.instance = undefined;
    });
    describe('withRetry', () => {
        it('should succeed on first attempt', async () => {
            const mockFn = jest.fn().mockResolvedValue('success');
            const result = await withRetry(mockFn);
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
        it('should retry on retryable errors and eventually succeed', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce(new Error('Network error'))
                .mockRejectedValueOnce(new Error('Timeout'))
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 10, // Short delay for testing
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });
        it('should fail after max retries exceeded', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Persistent error'));
            await expect(withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            })).rejects.toThrow('Persistent error');
            expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
        });
        it('should not retry on non-retryable errors', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('Validation error'));
            // Mock retry condition to reject validation errors
            const retryCondition = (error) => !error.message.includes('Validation');
            await expect(withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100,
                retryCondition
            })).rejects.toThrow('Validation error');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
        it('should retry on specific HTTP status codes', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce({ status: 429, message: 'Rate limited' })
                .mockRejectedValueOnce({ status: 500, message: 'Server error' })
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(3);
        });
        it('should apply exponential backoff with jitter', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockRejectedValueOnce(new Error('Error 2'))
                .mockResolvedValue('success');
            const startTime = Date.now();
            await withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 100,
                maxDelay: 1000,
                jitter: true
            });
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // Should have taken some time due to delays
            expect(totalTime).toBeGreaterThan(100);
            expect(mockFn).toHaveBeenCalledTimes(3);
        });
        it('should respect max delay limit', async () => {
            const mockFn = jest.fn()
                .mockRejectedValueOnce(new Error('Error 1'))
                .mockRejectedValueOnce(new Error('Error 2'))
                .mockRejectedValueOnce(new Error('Error 3'))
                .mockResolvedValue('success');
            const startTime = Date.now();
            await withRetry(mockFn, {
                maxRetries: 4,
                baseDelay: 1000, // 1 second base
                maxDelay: 2000, // 2 second max
                jitter: false
            });
            const endTime = Date.now();
            const totalTime = endTime - startTime;
            // Should not exceed max delay * retries
            expect(totalTime).toBeLessThan(10000); // 2s max * 4 retries + buffer
            expect(mockFn).toHaveBeenCalledTimes(4);
        });
    });
    describe('Circuit Breaker', () => {
        let circuitBreaker;
        beforeEach(() => {
            circuitBreaker = CircuitBreaker.getInstance();
        });
        it('should start in CLOSED state', () => {
            expect(circuitBreaker.getState()).toBe('CLOSED');
            expect(circuitBreaker.canExecute()).toBe(true);
        });
        it('should open circuit after failure threshold', () => {
            // Simulate 5 failures (default threshold)
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            expect(circuitBreaker.getState()).toBe('OPEN');
            expect(circuitBreaker.canExecute()).toBe(false);
        });
        it('should transition to HALF_OPEN after timeout', () => {
            // Open the circuit
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            // Mock time passage (61 seconds later)
            const originalNow = Date.now;
            const mockNow = jest.fn()
                .mockReturnValueOnce(1000) // Initial time
                .mockReturnValueOnce(1000) // After failures
                .mockReturnValueOnce(61000); // After timeout
            Date.now = mockNow;
            expect(circuitBreaker.canExecute()).toBe(true);
            expect(circuitBreaker.getState()).toBe('HALF_OPEN');
            Date.now = originalNow;
        });
        it('should close circuit on successful request', () => {
            // Open the circuit
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            // Mock time passage to HALF_OPEN
            const originalNow = Date.now;
            Date.now = jest.fn()
                .mockReturnValueOnce(1000) // Initial time
                .mockReturnValueOnce(1000) // After failures
                .mockReturnValueOnce(61000) // After timeout
                .mockReturnValueOnce(61000); // On success
            circuitBreaker.onSuccess();
            expect(circuitBreaker.getState()).toBe('CLOSED');
            Date.now = originalNow;
        });
        it('should reset failure count on successful request', () => {
            // Simulate some failures
            for (let i = 0; i < 3; i++) {
                circuitBreaker.onFailure();
            }
            // Success should reset the count
            circuitBreaker.onSuccess();
            // Should still be CLOSED (not opened)
            expect(circuitBreaker.getState()).toBe('CLOSED');
            expect(circuitBreaker.canExecute()).toBe(true);
        });
        it('should handle multiple circuit breaker instances as singleton', () => {
            const instance1 = CircuitBreaker.getInstance();
            const instance2 = CircuitBreaker.getInstance();
            expect(instance1).toBe(instance2);
            // Opening one should affect the other
            for (let i = 0; i < 5; i++) {
                instance1.onFailure();
            }
            expect(instance2.getState()).toBe('OPEN');
            expect(instance2.canExecute()).toBe(false);
        });
    });
    describe('Rate Limiting', () => {
        let rateLimitHandler;
        beforeEach(() => {
            rateLimitHandler = RateLimitHandler.getInstance();
        });
        it('should not be rate limited initially', () => {
            expect(rateLimitHandler.isRateLimited()).toBe(false);
        });
        it('should set rate limit with retry-after header', () => {
            const error = {
                headers: { 'retry-after': '60' }
            };
            rateLimitHandler.handleRateLimitError(error);
            expect(rateLimitHandler.isRateLimited()).toBe(true);
        });
        it('should set rate limit with Retry-After header (case insensitive)', () => {
            const error = {
                headers: { 'Retry-After': '30' }
            };
            rateLimitHandler.handleRateLimitError(error);
            expect(rateLimitHandler.isRateLimited()).toBe(true);
        });
        it('should set rate limit with response headers', () => {
            const error = {
                response: {
                    headers: { 'retry-after': '45' }
                }
            };
            rateLimitHandler.handleRateLimitError(error);
            expect(rateLimitHandler.isRateLimited()).toBe(true);
        });
        it('should use default rate limit when no retry-after header', () => {
            const error = {};
            const originalNow = Date.now;
            const mockNow = jest.fn().mockReturnValue(1000);
            Date.now = mockNow;
            rateLimitHandler.handleRateLimitError(error);
            // Should be rate limited for 60 seconds (default)
            expect(rateLimitHandler.isRateLimited()).toBe(true);
            // Mock time passage (59 seconds later - still rate limited)
            mockNow.mockReturnValue(60000);
            expect(rateLimitHandler.isRateLimited()).toBe(true);
            // Mock time passage (61 seconds later - no longer rate limited)
            mockNow.mockReturnValue(62000);
            expect(rateLimitHandler.isRateLimited()).toBe(false);
            Date.now = originalNow;
        });
        it('should wait for rate limit to expire', async () => {
            const error = {
                headers: { 'retry-after': '1' } // 1 second
            };
            rateLimitHandler.handleRateLimitError(error);
            const startTime = Date.now();
            await rateLimitHandler.waitForRateLimit();
            const endTime = Date.now();
            // Should have waited approximately 1 second
            expect(endTime - startTime).toBeGreaterThanOrEqual(1000);
            expect(rateLimitHandler.isRateLimited()).toBe(false);
        });
        it('should not wait if not rate limited', async () => {
            const startTime = Date.now();
            await rateLimitHandler.waitForRateLimit();
            const endTime = Date.now();
            // Should return immediately
            expect(endTime - startTime).toBeLessThan(100);
        });
        it('should handle multiple rate limit handler instances as singleton', () => {
            const handler1 = RateLimitHandler.getInstance();
            const handler2 = RateLimitHandler.getInstance();
            expect(handler1).toBe(handler2);
            // Setting rate limit on one should affect the other
            handler1.setRateLimited(Date.now() + 60000);
            expect(handler2.isRateLimited()).toBe(true);
        });
    });
    describe('Retry Configurations', () => {
        it('should have appropriate retry configs for different operations', () => {
            expect(RETRY_CONFIGS.addressValidation.maxRetries).toBe(2);
            expect(RETRY_CONFIGS.addressValidation.baseDelay).toBe(500);
            expect(RETRY_CONFIGS.addressValidation.maxDelay).toBe(5000);
            expect(RETRY_CONFIGS.costCalculation.maxRetries).toBe(3);
            expect(RETRY_CONFIGS.costCalculation.baseDelay).toBe(1000);
            expect(RETRY_CONFIGS.costCalculation.maxDelay).toBe(8000);
            expect(RETRY_CONFIGS.mailPieceCreation.maxRetries).toBe(5);
            expect(RETRY_CONFIGS.mailPieceCreation.baseDelay).toBe(2000);
            expect(RETRY_CONFIGS.mailPieceCreation.maxDelay).toBe(15000);
            expect(RETRY_CONFIGS.statusRetrieval.maxRetries).toBe(3);
            expect(RETRY_CONFIGS.statusRetrieval.baseDelay).toBe(1000);
            expect(RETRY_CONFIGS.statusRetrieval.maxDelay).toBe(10000);
            expect(RETRY_CONFIGS.webhookProcessing.maxRetries).toBe(2);
            expect(RETRY_CONFIGS.webhookProcessing.baseDelay).toBe(500);
            expect(RETRY_CONFIGS.webhookProcessing.maxDelay).toBe(3000);
        });
        it('should use correct retry configs in real scenarios', async () => {
            const mockFn = jest.fn().mockRejectedValue(new Error('API Error'));
            // Test address validation config
            await expect(withRetry(mockFn, RETRY_CONFIGS.addressValidation))
                .rejects.toThrow('API Error');
            expect(mockFn).toHaveBeenCalledTimes(3); // Initial + 2 retries
            jest.clearAllMocks();
            // Test mail piece creation config
            await expect(withRetry(mockFn, RETRY_CONFIGS.mailPieceCreation))
                .rejects.toThrow('API Error');
            expect(mockFn).toHaveBeenCalledTimes(6); // Initial + 5 retries
        });
    });
    describe('Real Error Scenarios', () => {
        it('should handle network timeout errors', async () => {
            const timeoutError = new Error('ETIMEDOUT');
            timeoutError.code = 'ETIMEDOUT';
            const mockFn = jest.fn()
                .mockRejectedValueOnce(timeoutError)
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        it('should handle connection reset errors', async () => {
            const connectionError = new Error('ECONNRESET');
            connectionError.code = 'ECONNRESET';
            const mockFn = jest.fn()
                .mockRejectedValueOnce(connectionError)
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        it('should handle DNS resolution errors', async () => {
            const dnsError = new Error('ENOTFOUND');
            dnsError.code = 'ENOTFOUND';
            const mockFn = jest.fn()
                .mockRejectedValueOnce(dnsError)
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        it('should handle HTTP 429 rate limit errors', async () => {
            const rateLimitError = new Error('Rate limit exceeded');
            rateLimitError.status = 429;
            const mockFn = jest.fn()
                .mockRejectedValueOnce(rateLimitError)
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        it('should handle HTTP 5xx server errors', async () => {
            const serverError = new Error('Internal server error');
            serverError.status = 500;
            const mockFn = jest.fn()
                .mockRejectedValueOnce(serverError)
                .mockResolvedValue('success');
            const result = await withRetry(mockFn, {
                maxRetries: 2,
                baseDelay: 10,
                maxDelay: 100
            });
            expect(result).toBe('success');
            expect(mockFn).toHaveBeenCalledTimes(2);
        });
        it('should not retry HTTP 4xx client errors', async () => {
            const clientError = new Error('Bad request');
            clientError.status = 400;
            const mockFn = jest.fn().mockRejectedValue(clientError);
            await expect(withRetry(mockFn, {
                maxRetries: 3,
                baseDelay: 10,
                maxDelay: 100
            })).rejects.toThrow('Bad request');
            expect(mockFn).toHaveBeenCalledTimes(1);
        });
    });
});
//# sourceMappingURL=retry.test.js.map