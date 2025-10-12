import * as Sentry from '@sentry/react';
import { browserTracingIntegration, replayIntegration } from '@sentry/react';

let isSentryInitialized = false;

export function initSentry() {
  // Prevent multiple initializations
  if (isSentryInitialized) {
    console.log('Sentry already initialized, skipping');
    return;
  }

  // Check for Sentry DSN (React App environment variable)
  const sentryDsn = import.meta.env.REACT_APP_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    console.log('Sentry DSN not provided, skipping initialization');
    return;
  }

  try {
    console.log('Initializing Sentry with DSN:', sentryDsn.substring(0, 20) + '...');
    
    Sentry.init({
      dsn: sentryDsn,
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
        // Filter out Chrome extension related errors
        if (event.exception) {
          const errorMessage = event.exception.values?.[0]?.value || '';
          if (errorMessage.includes('Chrome API') || 
              errorMessage.includes('message port closed') ||
              errorMessage.includes('runtime.lastError')) {
            return null; // Don't send Chrome extension errors to Sentry
          }
        }
        
        // Filter out non-error events in development
        if (import.meta.env.MODE === 'development' && event.level !== 'error') {
          return null;
        }
        return event;
      },
    });

    isSentryInitialized = true;
    console.log('Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Sentry:', error);
  }
}

// Export Sentry components for use in React components
export { Sentry };
