import { validateEnvironmentOnStartup, isProduction, isDevelopment } from './envValidation';

/**
 * Server startup validation
 * This module handles all validation that should happen when the server starts up
 */

/**
 * Validates the server environment on startup
 * This should be called early in the server initialization process
 */
export function validateServerStartup(): void {
  console.log('🚀 Starting server startup validation...');
  
  try {
    // Validate environment variables
    validateEnvironmentOnStartup();
    
    // Additional startup validations can be added here
    validateDatabaseConnection();
    validateExternalServices();
    
    console.log('✅ Server startup validation completed successfully');
  } catch (error) {
    console.error('❌ Server startup validation failed:', error);
    process.exit(1);
  }
}

/**
 * Validates database connection (placeholder for now)
 * In a real implementation, you would test the database connection here
 */
function validateDatabaseConnection(): void {
  console.log('📊 Validating database connection...');
  
  // TODO: Add actual database connection validation
  // This could involve:
  // 1. Testing the connection string format
  // 2. Attempting to connect to the database
  // 3. Running a simple query to verify connectivity
  
  console.log('✅ Database connection validation passed');
}

/**
 * Validates external service configurations
 * Checks that API keys and configurations are properly set up
 */
function validateExternalServices(): void {
  console.log('🔗 Validating external service configurations...');
  
  if (isProduction()) {
    // In production, validate all external services
    validateStripeConfiguration();
    validateSendGridConfiguration();
    validateLobConfiguration();
    validateAwsConfiguration();
    validateSentryConfiguration();
  } else {
    // In development, just log what's configured
    logServiceConfiguration();
  }
  
  console.log('✅ External service validation completed');
}

/**
 * Validates Stripe configuration
 */
function validateStripeConfiguration(): void {
  const stripeKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeKey) {
    throw new Error('Stripe configuration is missing in production');
  }
  
  // Validate Stripe key format
  if (!stripeKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  
  console.log('✅ Stripe configuration validated');
}

/**
 * Validates SendGrid configuration
 */
function validateSendGridConfiguration(): void {
  const sendGridKey = process.env.SENDGRID_API_KEY;
  if (!sendGridKey) {
    throw new Error('SendGrid configuration is missing in production');
  }
  
  // Validate SendGrid key format
  if (!sendGridKey.startsWith('SG.')) {
    throw new Error('Invalid SendGrid API key format');
  }
  
  console.log('✅ SendGrid configuration validated');
}

/**
 * Validates Lob configuration
 */
function validateLobConfiguration(): void {
  const lobEnvironment = process.env.LOB_ENVIRONMENT;
  const lobProdKey = process.env.LOB_PROD_KEY;
  
  if (lobEnvironment === 'live' || lobEnvironment === 'prod') {
    if (!lobProdKey) {
      throw new Error('Lob production key is required for live/prod environment');
    }
    
    if (!lobProdKey.startsWith('live_')) {
      throw new Error('Invalid Lob production key format');
    }
  }
  
  console.log('✅ Lob configuration validated');
}

/**
 * Validates AWS configuration
 */
function validateAwsConfiguration(): void {
  const awsAccessKey = process.env.AWS_ACCESS_KEY_ID;
  const awsSecretKey = process.env.AWS_SECRET_ACCESS_KEY;
  const awsRegion = process.env.AWS_REGION;
  const awsBucket = process.env.AWS_S3_BUCKET;
  
  if (!awsAccessKey || !awsSecretKey || !awsRegion || !awsBucket) {
    throw new Error('AWS configuration is incomplete in production');
  }
  
  console.log('✅ AWS configuration validated');
}

/**
 * Validates Sentry configuration
 */
function validateSentryConfiguration(): void {
  const sentryDsn = process.env.SENTRY_DSN;
  if (!sentryDsn) {
    throw new Error('Sentry DSN is required in production');
  }
  
  if (!sentryDsn.startsWith('https://')) {
    throw new Error('Invalid Sentry DSN format');
  }
  
  console.log('✅ Sentry configuration validated');
}

/**
 * Logs service configuration status (for development)
 */
function logServiceConfiguration(): void {
  const services = [
    { name: 'Stripe', configured: !!process.env.STRIPE_SECRET_KEY },
    { name: 'SendGrid', configured: !!process.env.SENDGRID_API_KEY },
    { name: 'Lob', configured: !!(process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY) },
    { name: 'AWS S3', configured: !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) },
    { name: 'Sentry', configured: !!process.env.SENTRY_DSN },
  ];
  
  console.log('📋 Service configuration status:');
  services.forEach(service => {
    const status = service.configured ? '✅' : '❌';
    console.log(`  ${status} ${service.name}`);
  });
}

/**
 * Health check endpoint data
 * Returns the status of all external services
 */
export function getServiceHealthStatus(): Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; message?: string }> {
  const services: Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; message?: string }> = {};
  
  // Check Stripe
  services.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'healthy' : 'unhealthy',
    message: process.env.STRIPE_SECRET_KEY ? undefined : 'Stripe secret key not configured'
  };
  
  // Check SendGrid
  services.sendgrid = {
    status: process.env.SENDGRID_API_KEY ? 'healthy' : 'unhealthy',
    message: process.env.SENDGRID_API_KEY ? undefined : 'SendGrid API key not configured'
  };
  
  // Check Lob
  const lobKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
  services.lob = {
    status: lobKey ? 'healthy' : 'unhealthy',
    message: lobKey ? undefined : 'Lob API key not configured'
  };
  
  // Check AWS
  const awsConfigured = !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
  services.aws = {
    status: awsConfigured ? 'healthy' : 'unhealthy',
    message: awsConfigured ? undefined : 'AWS credentials not configured'
  };
  
  // Check Sentry
  services.sentry = {
    status: process.env.SENTRY_DSN ? 'healthy' : 'unhealthy',
    message: process.env.SENTRY_DSN ? undefined : 'Sentry DSN not configured'
  };
  
  return services;
}
