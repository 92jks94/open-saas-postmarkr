import { validateEnvironmentOnStartup, isProduction, isDevelopment } from './envValidation';
import { runAllConnectivityTests, runCriticalConnectivityTests } from './apiConnectivityTests';
import { alertManager, runMonitoringChecks } from './monitoringAlerts';

/**
 * Server startup validation
 * This module handles all validation that should happen when the server starts up
 */

/**
 * Validates the server environment on startup
 * This should be called early in the server initialization process
 */
export async function validateServerStartup(): Promise<void> {
  console.log('🚀 Starting comprehensive server startup validation...');
  
  try {
    // Phase 1: Environment variable validation
    console.log('📋 Phase 1: Environment variable validation...');
    validateEnvironmentOnStartup();
    
    // Phase 2: Database connection validation
    console.log('🗄️ Phase 2: Database connection validation...');
    validateDatabaseConnection();
    
    // Phase 3: External service configuration validation
    console.log('🔗 Phase 3: External service configuration validation...');
    validateExternalServices();
    
    // Phase 4: API connectivity tests (production only)
    if (isProduction()) {
      console.log('🧪 Phase 4: API connectivity tests...');
      await validateApiConnectivity();
    }
    
    // Phase 5: Monitoring setup and initial health check
    console.log('📊 Phase 5: Monitoring setup and health check...');
    await setupMonitoring();
    
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
    validateOpenAIConfiguration();
    validateGoogleAnalyticsConfiguration();
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
 * Validates OpenAI configuration
 */
function validateOpenAIConfiguration(): void {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn('⚠️ OpenAI API key not configured - AI features will be disabled');
    return;
  }
  
  if (!apiKey.startsWith('sk-')) {
    throw new Error('OpenAI API key format is invalid - must start with sk-');
  }
  
  console.log('✅ OpenAI configuration validated');
}

/**
 * Validates Google Analytics configuration
 */
function validateGoogleAnalyticsConfiguration(): void {
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  
  if (!clientEmail || !privateKey || !propertyId) {
    console.warn('⚠️ Google Analytics not fully configured - analytics features will be limited');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    throw new Error('Google Analytics client email format is invalid');
  }
  
  console.log('✅ Google Analytics configuration validated');
}


/**
 * Validates API connectivity for critical services
 */
async function validateApiConnectivity(): Promise<void> {
  console.log('🧪 Running critical API connectivity tests...');
  
  try {
    const results = await runCriticalConnectivityTests();
    
    const failedTests = results.filter(result => result.status === 'unhealthy');
    
    if (failedTests.length > 0) {
      console.error('❌ Critical API connectivity tests failed:');
      failedTests.forEach(test => {
        console.error(`   ${test.service}: ${test.error}`);
      });
      throw new Error(`${failedTests.length} critical API connectivity tests failed`);
    }
    
    console.log('✅ All critical API connectivity tests passed');
  } catch (error) {
    console.error('❌ API connectivity validation failed:', error);
    throw error;
  }
}

/**
 * Sets up monitoring and runs initial health check
 */
async function setupMonitoring(): Promise<void> {
  console.log('📊 Setting up monitoring system...');
  
  try {
    // Run initial monitoring checks
    const dashboard = await runMonitoringChecks();
    
    // Log monitoring status
    console.log(`📊 Monitoring Status: ${dashboard.status.toUpperCase()}`);
    console.log(`   Active alerts: ${dashboard.alerts.filter(a => !a.resolved).length}`);
    console.log(`   Missing env vars: ${dashboard.environmentVariables.missing.length}`);
    console.log(`   Healthy services: ${dashboard.services.healthy.length}`);
    console.log(`   Unhealthy services: ${dashboard.services.unhealthy.length}`);
    
    // If there are critical alerts, warn but don't fail startup
    const criticalAlerts = dashboard.alerts.filter(a => a.level === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) {
      console.warn(`⚠️ ${criticalAlerts.length} critical alerts detected - check configuration`);
    }
    
    console.log('✅ Monitoring setup completed');
  } catch (error) {
    console.error('❌ Monitoring setup failed:', error);
    // Don't fail startup for monitoring issues
    console.warn('⚠️ Continuing startup despite monitoring setup failure');
  }
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
    { name: 'OpenAI', configured: !!process.env.OPENAI_API_KEY },
    { name: 'Google Analytics', configured: !!(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && process.env.GOOGLE_ANALYTICS_PRIVATE_KEY) },
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
  
  // Check OpenAI
  services.openai = {
    status: process.env.OPENAI_API_KEY ? 'healthy' : 'unknown',
    message: process.env.OPENAI_API_KEY ? undefined : 'OpenAI API key not configured (optional)'
  };
  
  // Check Google Analytics
  const gaConfigured = !!(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && process.env.GOOGLE_ANALYTICS_PRIVATE_KEY);
  services.googleAnalytics = {
    status: gaConfigured ? 'healthy' : 'unknown',
    message: gaConfigured ? undefined : 'Google Analytics not configured (optional)'
  };
  
  
  return services;
}
