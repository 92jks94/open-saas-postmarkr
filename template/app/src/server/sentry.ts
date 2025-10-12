import * as Sentry from "@sentry/node";

let isSentryInitialized = false;

export function initServerSentry() {
  // Prevent multiple initializations
  if (isSentryInitialized) {
    console.log('Server Sentry already initialized, skipping');
    return;
  }

  // Check for Sentry DSN in environment variables
  const sentryDsn = process.env.SENTRY_DSN || process.env.REACT_APP_SENTRY_DSN;

  // Only initialize if DSN is provided
  if (!sentryDsn) {
    console.log('Server Sentry DSN not provided, skipping initialization');
    return;
  }

  try {
    console.log('Initializing Server Sentry with DSN:', sentryDsn.substring(0, 20) + '...');
    
    Sentry.init({
      dsn: sentryDsn,
      environment: process.env.NODE_ENV || 'development',
      // Setting this option to true will send default PII data to Sentry.
      // For example, automatic IP address collection on events
      sendDefaultPii: true,
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

    isSentryInitialized = true;
    console.log('Server Sentry initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Server Sentry:', error);
  }
}

// Export Sentry for use in server operations
export { Sentry };