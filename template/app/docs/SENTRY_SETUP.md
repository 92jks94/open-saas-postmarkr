# Sentry Setup Guide

This guide explains how Sentry has been configured in your Wasp application and how to use it effectively.

## What's Been Configured

### 1. Client-Side Sentry (`src/client/sentry.ts`)
- **Error Tracking**: Captures JavaScript errors in the browser
- **Performance Monitoring**: Tracks page load times and user interactions
- **Session Replay**: Records user sessions for debugging (10% sampling in production)
- **Environment Detection**: Automatically detects development vs production

### 2. Server-Side Sentry (`src/server/sentry.ts`)
- **Error Tracking**: Captures server-side errors and exceptions
- **Performance Monitoring**: Tracks API response times and database queries
- **Integration**: Works with Express, Prisma, and HTTP requests

### 3. Middleware Integration (`src/server/setup.ts`)
- **Request Tracking**: Automatically tracks all incoming requests
- **Error Handling**: Captures unhandled errors and exceptions
- **Performance Tracing**: Monitors server performance

### 4. Utility Functions (`src/server/sentry-utils.ts`)
- **Helper Functions**: Easy-to-use functions for manual error tracking
- **User Context**: Set user information for better error context
- **Breadcrumbs**: Add debugging information to error reports
- **Operation Wrapping**: Wrap functions with automatic error handling

## Environment Variables Required

Add these environment variables to your `.env.server` file:

```bash
# Sentry DSN - Get this from your Sentry project settings
SENTRY_DSN=https://your-dsn@sentry.io/project-id

# Optional: Override environment detection
NODE_ENV=production
```

For client-side, set the environment variable in your deployment environment or system:

```bash
# Client-side Sentry DSN (SAME as server - you can use one DSN for both!)
# For Vite (which Wasp uses)
VITE_SENTRY_DSN=https://your-dsn@sentry.io/project-id

# OR for Create React App
REACT_APP_SENTRY_DSN=https://your-dsn@sentry.io/project-id
```

**Important**: You can use the **SAME DSN** for both client and server! This is simpler and perfectly valid. You don't need separate DSNs unless you want different alerting rules for frontend vs backend errors.

## Getting Your Sentry DSN

1. Go to [sentry.io](https://sentry.io) and create an account
2. Create a new project (choose "React" for client-side, "Node.js" for server-side)
3. Copy the DSN from your project settings
4. Add it to your environment variables

## Usage Examples

### Basic Error Tracking in Operations

```typescript
import { captureException, setUserContext } from '../server/sentry-utils';

export const createTask: CreateTask<CreateTaskInput, Task> = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    // Set user context for better error tracking
    setUserContext({
      id: context.user.id,
      email: context.user.identities?.email?.email,
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
```

### Using Utility Functions

```typescript
import { captureMessage, addBreadcrumb, setUserContext } from '../server/sentry-utils';

// Add debugging information
addBreadcrumb('User started payment process', 'payment');

// Log important events
captureMessage('Payment completed successfully', 'info', {
  amount: 29.99,
  currency: 'USD',
  userId: user.id,
});

// Set user context
setUserContext({
  id: user.id,
  email: user.email,
  username: user.username,
});
```

### Wrapping Functions with Error Handling

```typescript
import { withSentryErrorHandling } from '../server/sentry-utils';

// Wrap your operation function
export const myOperation = withSentryErrorHandling(
  async (args: any, context: any) => {
    // Your operation logic here
    return await someComplexOperation(args);
  },
  'myOperation' // Operation name for Sentry
);
```

## Features Enabled

### Client-Side
- ✅ Error boundary for React components
- ✅ Performance monitoring
- ✅ Session replay (10% sampling)
- ✅ User context tracking
- ✅ Breadcrumb logging

### Server-Side
- ✅ Automatic error capture
- ✅ Performance monitoring
- ✅ Request/response tracking
- ✅ Database query monitoring
- ✅ User context tracking

## Production Considerations

1. **Sampling Rates**: Currently set to 10% for performance monitoring in production
2. **Session Replay**: Limited to 10% of sessions to manage costs
3. **Error Filtering**: Non-error events are filtered out in development
4. **User Privacy**: No sensitive data is automatically captured

## Monitoring and Alerts

Set up alerts in your Sentry dashboard for:
- New errors
- Error rate spikes
- Performance degradation
- User impact

## Troubleshooting

### Common Issues

1. **Sentry not capturing errors**: Check that your DSN is correctly set in environment variables
2. **Too many events**: Adjust sampling rates in the configuration files
3. **Missing context**: Use `setUserContext()` and `addBreadcrumb()` functions

### Debug Mode

In development, Sentry will only capture error-level events. To see all events, modify the `beforeSend` function in `src/client/sentry.ts` and `src/server/sentry.ts`.

## Testing Your Setup

I've created a test page at `/sentry-test` that you can use to verify your Sentry integration:

1. **Navigate to** `http://localhost:3000/sentry-test` (or your app's URL)
2. **Click the test buttons** to trigger different types of events:
   - "Trigger Client Error" - Creates a JavaScript error
   - "Send Test Message" - Sends a custom message to Sentry
   - "Add Breadcrumb" - Adds debugging information
3. **Check your Sentry dashboard** for the events within a few minutes

## Next Steps

1. ✅ Set up your Sentry project and get your DSN
2. ✅ Add the environment variables to `.env.server`
3. **Add client-side DSN**: Set `VITE_SENTRY_DSN` environment variable
4. **Test the integration** using the `/sentry-test` page
5. **Set up alerts and monitoring** in your Sentry dashboard
6. **Integrate Sentry utilities** into your existing operations

For more advanced configuration, see the [Sentry documentation](https://docs.sentry.io/).
