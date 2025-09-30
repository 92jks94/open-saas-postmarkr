import { initSentry } from './sentry';
import { validateServerStartup } from './startupValidation';
import type { MiddlewareConfigFn } from 'wasp/server';

// Initialize Sentry on server startup
initSentry();

// Run comprehensive startup validation
validateServerStartup().catch((error) => {
  console.error('❌ Startup validation failed:', error);
  process.exit(1);
});

// Server middleware configuration function
export const serverMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  // Note: Rate limiting is implemented at the operation level instead of middleware level
  // This provides better control and is more compatible with Wasp's architecture
  
  // Sentry is already initialized above
  // The integrations will automatically handle request tracking
  return middlewareConfig;
};