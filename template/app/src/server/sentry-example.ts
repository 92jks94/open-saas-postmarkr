/**
 * Example of how to use Sentry in your Wasp operations
 * 
 * This file shows how to integrate Sentry error tracking and performance monitoring
 * into your existing operations. You can copy these patterns to your actual operation files.
 */

import { HttpError } from 'wasp/server';
import { captureException, captureMessage, setUserContext, addBreadcrumb, withSentryErrorHandling } from './sentry-utils';

// Example operation with Sentry integration
export async function exampleOperationWithSentry(args: any, context: any) {
  try {
    // Set user context if user is authenticated
    if (context.user) {
      setUserContext({
        id: context.user.id,
        email: context.user.identities?.email?.id ?? undefined,
      });
    }

    // Add breadcrumb for debugging
    addBreadcrumb('Starting example operation', 'operation');

    // Your operation logic here
    const result = await someBusinessLogic(args);

    // Log successful completion
    captureMessage('Example operation completed successfully', 'info', {
      operation: 'exampleOperationWithSentry',
      userId: context.user?.id,
    });

    return result;
  } catch (error) {
    // Capture the error with context
    captureException(error as Error, {
      operation: 'exampleOperationWithSentry',
      userId: context.user?.id,
      args: JSON.stringify(args),
    });

    // Re-throw the error to maintain normal error flow
    throw error;
  }
}

// Example of wrapping an existing operation with Sentry
export const wrappedOperation = withSentryErrorHandling(
  async (args: any, context: any) => {
    // Your existing operation logic here
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    // Simulate some work
    await new Promise(resolve => setTimeout(resolve, 100));
    
    return { success: true };
  },
  'wrappedOperation'
);

// Example business logic function
async function someBusinessLogic(args: any) {
  // Simulate some work that might fail
  if (Math.random() < 0.1) {
    throw new Error('Random failure for demonstration');
  }
  
  return { processed: true, data: args };
}

// Example of how to use in your existing operations:
/*
// In your operations.ts file, you can now do:

import { captureException, setUserContext } from '../server/sentry-utils';

export const createTask: CreateTask<CreateTaskInput, Task> = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    // Set user context for better error tracking
    setUserContext({
      id: context.user.id,
      email: context.user.identities?.email?.id,
    });

    const task = await context.entities.Task.create({
      data: {
        description: args.description,
        userId: context.user.id,
      }
    });

    return task;
  } catch (error) {
    // Capture error with context
    captureException(error as Error, {
      operation: 'createTask',
      userId: context.user?.id,
      taskDescription: args.description,
    });
    
    throw error; // Re-throw to maintain normal error flow
  }
};
*/
