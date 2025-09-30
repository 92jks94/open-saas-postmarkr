import { initSentry } from './sentry';
import { validateServerStartup } from './startupValidation';

// Initialize Sentry on server startup
initSentry();

// Run comprehensive startup validation
validateServerStartup().catch((error) => {
  console.error('❌ Startup validation failed:', error);
  process.exit(1);
});

// Server middleware configuration function
export function serverMiddlewareConfigFn(app: any) {
  // Sentry is already initialized above
  // The integrations will automatically handle request tracking
  return app;
}