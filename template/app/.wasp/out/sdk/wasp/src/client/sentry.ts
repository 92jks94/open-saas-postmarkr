import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';

export function initSentry() {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN || process.env.REACT_APP_SENTRY_DSN,
    environment: import.meta.env.MODE || process.env.NODE_ENV || 'development',
    integrations: [
      browserTracingIntegration({
        // Set tracing origins to trace requests to your backend
        tracePropagationTargets: ['localhost', /^https:\/\/.*\.vercel\.app/, /^https:\/\/.*\.netlify\.app/],
      }),
      replayIntegration({
        // Capture 10% of all sessions for performance monitoring
        sessionSampleRate: 0.1,
        // Capture 100% of sessions with an error for debugging
        errorSampleRate: 1.0,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: (import.meta.env.MODE || process.env.NODE_ENV) === 'production' ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Set user context when available
    beforeSend(event, hint) {
      // Filter out non-error events in development
      if ((import.meta.env.MODE || process.env.NODE_ENV) === 'development' && event.level !== 'error') {
        return null;
      }
      return event;
    },
  });
}

// Export Sentry components for use in React components
export { Sentry };
