/**
 * Retry utility for file uploads with exponential backoff
 * 
 * This utility wraps any async function and retries it on failure
 * with exponential backoff and jitter to avoid thundering herd.
 */

export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Executes an async function with automatic retry on failure
 * 
 * @param uploadFn - The async function to execute (typically an upload operation)
 * @param options - Configuration for retry behavior
 * @returns Promise resolving to the function's result
 * @throws The final error if all retries are exhausted
 */
export async function uploadWithRetry<T>(
  uploadFn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelay = 1000,
    maxDelay = 5000,
    onRetry,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await uploadFn();
    } catch (error) {
      lastError = error as Error;
      const isLastAttempt = attempt === maxRetries;
      
      if (isLastAttempt) {
        throw error;
      }

      // Exponential backoff: delay = initialDelay * 2^attempt
      // Add jitter (random 0-1000ms) to prevent thundering herd
      const exponentialDelay = initialDelay * Math.pow(2, attempt);
      const jitter = Math.random() * 1000;
      const delay = Math.min(exponentialDelay + jitter, maxDelay);

      // Notify caller about retry attempt
      if (onRetry) {
        onRetry(attempt + 1, error as Error);
      }

      // Wait before next retry
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  // This should never be reached, but TypeScript needs it
  throw lastError || new Error('Upload failed after all retries');
}

