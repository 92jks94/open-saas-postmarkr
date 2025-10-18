/**
 * Server Startup Validation
 * 
 * ✅ FIX #5: Validates critical configuration before the server starts accepting requests.
 * This prevents runtime errors from misconfiguration and ensures production safety.
 */

import { getEnvVar } from './envValidation';

/**
 * Validate production requirements
 * 
 * Ensures that all critical API keys and configuration are present
 * in production environment. Fails startup if requirements not met.
 */
export function validateProductionRequirements(): void {
  const nodeEnv = process.env.NODE_ENV;
  
  console.log(`🔍 Validating environment: ${nodeEnv}`);
  
  // Only enforce strict validation in production
  if (nodeEnv === 'production') {
    console.log('🔒 Production mode - validating critical configuration');
    
    // Validate Lob API key
    const lobKey = process.env.LOB_PROD_KEY || process.env.LOB_TEST_KEY;
    
    if (!lobKey) {
      console.error('');
      console.error('🔴 ==========================================');
      console.error('🔴 CRITICAL ERROR: Lob API key not configured');
      console.error('🔴 ==========================================');
      console.error('🔴');
      console.error('🔴 Production deployment requires Lob API configuration.');
      console.error('🔴 Please set one of the following environment variables:');
      console.error('🔴   - LOB_PROD_KEY (recommended for production)');
      console.error('🔴   - LOB_TEST_KEY (fallback, for staging)');
      console.error('🔴');
      console.error('🔴 Application cannot start without Lob configuration.');
      console.error('🔴 No mail will be sent without valid Lob API keys.');
      console.error('🔴 ==========================================');
      console.error('');
      
      // Exit process - don't start server
      process.exit(1);
    }
    
    // Validate Stripe keys
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    
    if (!stripeKey) {
      console.error('');
      console.error('🔴 ==========================================');
      console.error('🔴 CRITICAL ERROR: Stripe API key not configured');
      console.error('🔴 ==========================================');
      console.error('🔴');
      console.error('🔴 Production deployment requires Stripe configuration.');
      console.error('🔴 Please set STRIPE_SECRET_KEY environment variable.');
      console.error('🔴 ==========================================');
      console.error('');
      
      process.exit(1);
    }
    
    // Validate S3 configuration
    const s3Bucket = process.env.AWS_S3_FILES_BUCKET;
    const awsRegion = process.env.AWS_S3_REGION;
    
    if (!s3Bucket || !awsRegion) {
      console.error('');
      console.error('🔴 ==========================================');
      console.error('🔴 CRITICAL ERROR: S3 configuration missing');
      console.error('🔴 ==========================================');
      console.error('🔴');
      console.error('🔴 Production deployment requires S3 configuration.');
      console.error('🔴 Please set:');
      console.error('🔴   - AWS_S3_FILES_BUCKET');
      console.error('🔴   - AWS_S3_REGION');
      console.error('🔴 ==========================================');
      console.error('');
      
      process.exit(1);
    }
    
    console.log('✅ Lob API key configured for production');
    console.log('✅ Stripe API key configured');
    console.log('✅ S3 configuration validated');
    console.log('✅ All production requirements validated');
  } else {
    console.log('ℹ️  Development/test mode - skipping strict validation');
    
    // Warn about missing keys in development
    const lobKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
    if (!lobKey) {
      console.warn('⚠️  Warning: Lob API key not configured');
      console.warn('⚠️  Lob operations will fail without API key');
      console.warn('⚠️  Set LOB_TEST_KEY or LOB_PROD_KEY in your .env.server file');
    }
  }
}

/**
 * Setup function called by Wasp on server startup
 * Call this in main.wasp server.setupFn
 */
export async function setupServer(): Promise<void> {
  console.log('🚀 Starting server setup...');
  
  // Validate production requirements
  validateProductionRequirements();
  
  console.log('✅ Server setup complete');
}

/**
 * Server middleware configuration
 * Required by main.wasp server.middlewareConfigFn
 * 
 * Implements:
 * - Canonical host enforcement (www -> non-www)
 * - HTTPS redirect in production
 * - HSTS header for security
 */
export function serverMiddlewareConfigFn(middlewareConfig: Map<string, any>): Map<string, any> {
  // Add canonical host redirect middleware
  middlewareConfig.set('canonical-redirect', (req: any, res: any, next: any) => {
    const host = req.headers.host || '';
    const proto = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const path = req.path || req.url;
    
    // Skip redirect for health check endpoints (Fly.io internal checks)
    if (path && (path.startsWith('/health') || path.startsWith('/api/webhooks/health'))) {
      return next();
    }
    
    // Production only - enforce canonical host and HTTPS
    if (process.env.NODE_ENV === 'production') {
      // Add HSTS header for security (force HTTPS for 1 year)
      res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
      
      // Redirect www to non-www, and http to https
      const shouldRedirect = 
        host === 'www.postmarkr.com' || 
        host.startsWith('www.') || 
        proto === 'http';
      
      if (shouldRedirect) {
        // Build canonical URL
        const canonicalHost = host.replace(/^www\./, '');
        const canonicalUrl = `https://${canonicalHost}${req.originalUrl || req.url}`;
        
        console.log(`🔀 Redirecting ${proto}://${host}${req.url} -> ${canonicalUrl}`);
        return res.redirect(301, canonicalUrl);
      }
    }
    
    next();
  });
  
  return middlewareConfig;
}
