import * as Sentry from '@sentry/node';

/**
 * Utility functions for Sentry error tracking and performance monitoring
 */

/**
 * Capture an exception with additional context
 */
export function captureException(error: Error, context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureException(error);
  });
}

/**
 * Capture a message with level
 */
export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: Record<string, any>) {
  Sentry.withScope((scope) => {
    if (context) {
      Object.entries(context).forEach(([key, value]) => {
        scope.setContext(key, value);
      });
    }
    Sentry.captureMessage(message, level);
  });
}

/**
 * Set user context for error tracking
 */
export function setUserContext(user: { id: string | number; email?: string; username?: string }) {
  Sentry.setUser({
    id: user.id.toString(),
    email: user.email,
    username: user.username,
  });
}

/**
 * Clear user context (useful for logout)
 */
export function clearUserContext() {
  Sentry.setUser(null);
}

/**
 * Add breadcrumb for debugging
 */
export function addBreadcrumb(message: string, category?: string, level?: 'info' | 'warning' | 'error') {
  Sentry.addBreadcrumb({
    message,
    category: category || 'custom',
    level: level || 'info',
  });
}

/**
 * Wrap an async function with Sentry error handling
 */
export function withSentryErrorHandling<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName: string
) {
  return async (...args: T): Promise<R> => {
    try {
      addBreadcrumb(`Starting ${operationName}`, 'operation');
      const result = await fn(...args);
      addBreadcrumb(`Completed ${operationName}`, 'operation');
      return result;
    } catch (error) {
      captureException(error as Error, {
        operation: operationName,
        args: args.length > 0 ? 'Arguments provided' : 'No arguments',
      });
      throw error; // Re-throw to maintain normal error flow
    }
  };
}
