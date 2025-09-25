import * as Sentry from '@sentry/node';
import { httpIntegration, expressIntegration, prismaIntegration } from '@sentry/node';

export function initSentry() {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      // Automatically instrument Node.js libraries and frameworks
      httpIntegration(),
      expressIntegration(),
      prismaIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
    // Set user context when available
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (process.env.NODE_ENV === 'development' && event.level !== 'error') {
        return null;
      }
      return event;
    },
  });
}

// Export Sentry for use in server operations
export { Sentry };
