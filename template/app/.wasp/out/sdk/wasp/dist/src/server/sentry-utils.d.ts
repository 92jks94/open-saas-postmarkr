/**
 * Utility functions for Sentry error tracking and performance monitoring
 */
/**
 * Capture an exception with additional context
 */
export declare function captureException(error: Error, context?: Record<string, any>): void;
/**
 * Capture a message with level
 */
export declare function captureMessage(message: string, level?: 'info' | 'warning' | 'error', context?: Record<string, any>): void;
/**
 * Set user context for error tracking
 */
export declare function setUserContext(user: {
    id: string | number;
    email?: string;
    username?: string;
}): void;
/**
 * Clear user context (useful for logout)
 */
export declare function clearUserContext(): void;
/**
 * Add breadcrumb for debugging
 */
export declare function addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error'): void;
/**
 * Wrap an async function with Sentry error handling
 */
export declare function withSentryErrorHandling<T extends any[], R>(fn: (...args: T) => Promise<R>, operationName: string): (...args: T) => Promise<R>;
//# sourceMappingURL=sentry-utils.d.ts.map