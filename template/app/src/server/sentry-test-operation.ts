/**
 * Test operation for Sentry integration
 * This operation is designed to test server-side Sentry functionality
 */

import { HttpError } from 'wasp/server';
import { captureException, captureMessage, setUserContext, addBreadcrumb } from './sentry-utils';

export async function testSentryError(args: any, context: any) {
  try {
    // Set user context if user is authenticated
    if (context.user) {
      setUserContext({
        id: context.user.id,
        email: context.user.email ?? undefined,
      });
    }

    // Add breadcrumb for debugging
    addBreadcrumb('Starting Sentry test operation', 'test');

    // Capture a test message
    captureMessage('Sentry test operation started', 'info', {
      operation: 'testSentryError',
      userId: context.user?.id,
      timestamp: new Date().toISOString(),
    });

    // Simulate an error for testing
    throw new Error('Test error for Sentry integration - this is intentional');
    
  } catch (error) {
    // Capture the error with context
    captureException(error as Error, {
      operation: 'testSentryError',
      userId: context.user?.id,
      testType: 'intentional_error',
      timestamp: new Date().toISOString(),
    });

    // Return error info instead of throwing (for testing purposes)
    return {
      success: false,
      error: 'Test error captured by Sentry',
      message: 'Check your Sentry dashboard for the captured error',
      timestamp: new Date().toISOString(),
    };
  }
}

export async function testSentryMessage(args: any, context: any) {
  try {
    // Set user context if user is authenticated
    if (context.user) {
      setUserContext({
        id: context.user.id,
        email: context.user.email ?? undefined,
      });
    }

    // Add breadcrumb
    addBreadcrumb('Sentry message test completed', 'test');

    // Capture a test message
    captureMessage('Test message from server-side Sentry', 'info', {
      operation: 'testSentryMessage',
      userId: context.user?.id,
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      message: 'Test message sent to Sentry successfully',
      timestamp: new Date().toISOString(),
    };
    
  } catch (error) {
    captureException(error as Error, {
      operation: 'testSentryMessage',
      userId: context.user?.id,
    });
    
    throw error;
  }
}
