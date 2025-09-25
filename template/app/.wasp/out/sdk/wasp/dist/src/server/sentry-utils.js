import { Sentry } from './sentry';
/**
 * Utility functions for Sentry error tracking and performance monitoring
 */
/**
 * Capture an exception with additional context
 */
export function captureException(error, context) {
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
export function captureMessage(message, level = 'info', context) {
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
export function setUserContext(user) {
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
export function addBreadcrumb(message, category, level) {
    Sentry.addBreadcrumb({
        message,
        category: category || 'custom',
        level: level || 'info',
    });
}
/**
 * Wrap an async function with Sentry error handling
 */
export function withSentryErrorHandling(fn, operationName) {
    return async (...args) => {
        try {
            addBreadcrumb(`Starting ${operationName}`, 'operation');
            const result = await fn(...args);
            addBreadcrumb(`Completed ${operationName}`, 'operation');
            return result;
        }
        catch (error) {
            captureException(error, {
                operation: operationName,
                args: args.length > 0 ? 'Arguments provided' : 'No arguments',
            });
            throw error; // Re-throw to maintain normal error flow
        }
    };
}
//# sourceMappingURL=sentry-utils.js.map