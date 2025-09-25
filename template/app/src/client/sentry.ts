import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';

let isSentryInitialized = false;

export function initSentry() {
  // Prevent multiple initializations
  if (isSentryInitialized) {
    return;
  }

  // Only initialize if DSN is provided
  if (!import.meta.env.VITE_SENTRY_DSN) {
    console.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE || 'development',
    integrations: [
      browserTracingIntegration(),
      replayIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.MODE === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Set user context when available
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if (import.meta.env.MODE === 'development' && event.level !== 'error') {
        return null;
      }
      return event;
    },
  });

  isSentryInitialized = true;
}

// Export Sentry components for use in React components
export { Sentry };
