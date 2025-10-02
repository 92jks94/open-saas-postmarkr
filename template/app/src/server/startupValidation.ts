import { validateEnvironmentOnStartup, isProduction, isDevelopment } from './envValidation';
import { runAllConnectivityTests, runCriticalConnectivityTests } from './apiConnectivityTests';
import { alertManager, runMonitoringChecks } from './monitoringAlerts';
import { displayStartupBanner, displayProductionStatus } from './startupBanner';
import { runServiceConnectivityTests } from './serviceConnectivityTests';

/**
 * Server startup validation
 * This module handles all validation that should happen when the server starts up
 */

/**
 * Validates the server environment on startup
 * This should be called early in the server initialization process
 */
export async function validateServerStartup(): Promise<void> {
  const startTime = Date.now();
  const criticalIssues: string[] = [];
  
  try {
    // Phase 1: Environment variable validation
    console.log('📋 Phase 1: Environment variable validation...');
    validateEnvironmentOnStartup();
    const envIssues = extractEnvironmentIssues();
    criticalIssues.push(...envIssues);
    
    // Phase 2: Database connection validation
    console.log('🗄️ Phase 2: Database connection validation...');
    await validateDatabaseConnection();
    
    // Phase 3: External service configuration validation
    console.log('🔗 Phase 3: External service configuration validation...');
    validateExternalServices();
    
    // Phase 3.5: Real-time service connectivity tests (development only)
    if (isDevelopment()) {
      console.log('🧪 Phase 3.5: Real-time service connectivity tests...');
      const connectivityIssues = await runServiceConnectivityTests();
      criticalIssues.push(...connectivityIssues);
    }
    
    // Phase 4: API connectivity tests (production only)
    if (isProduction()) {
      console.log('🧪 Phase 4: API connectivity tests...');
      await validateApiConnectivity();
    }
    
    // Phase 5: Monitoring setup and initial health check
    console.log('📊 Phase 5: Monitoring setup and health check...');
    const monitoringIssues = await setupMonitoring();
    criticalIssues.push(...monitoringIssues);
    
    // Phase 6: Display startup banner
    console.log('🎨 Phase 6: Displaying startup information...');
    if (isDevelopment()) {
      displayStartupBanner(startTime, criticalIssues);
    } else {
      displayProductionStatus();
    }
    
    console.log('✅ Server startup validation completed successfully');
  } catch (error) {
    console.error('❌ Server startup validation failed:', error);
    process.exit(1);
  }
}

/**
 * Validates database connection with real connectivity tests
 */
async function validateDatabaseConnection(): Promise<void> {
  console.log('📊 Validating database connection...');
  
  try {
    // Import Prisma client dynamically to avoid circular dependencies
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    
    // Test basic connectivity
    const startTime = Date.now();
    await prisma.$connect();
    const connectionTime = Date.now() - startTime;
    
    // Test a simple query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    
    // Get database info - try PostgreSQL first, then SQLite
    let databaseInfo = 'Unknown Database';
    try {
      // Try PostgreSQL version query first
      const pgInfo = await prisma.$queryRaw`SELECT version() as database_info` as any[];
      databaseInfo = `PostgreSQL ${pgInfo[0]?.database_info || 'Unknown Version'}`;
    } catch (error) {
      try {
        // Try SQLite version query
        const sqliteInfo = await prisma.$queryRaw`SELECT sqlite_version() as database_info` as any[];
        databaseInfo = `SQLite ${sqliteInfo[0]?.database_info || 'Unknown Version'}`;
      } catch (sqliteError) {
        // If both fail, try to determine from connection string
        const dbUrl = process.env.DATABASE_URL || '';
        if (dbUrl.includes('postgresql')) {
          databaseInfo = 'PostgreSQL (version unknown)';
        } else if (dbUrl.includes('sqlite')) {
          databaseInfo = 'SQLite (version unknown)';
        }
      }
    }
    
    console.log(`✅ Database connection successful (${connectionTime}ms)`);
    console.log(`   Database: ${databaseInfo}`);
    console.log(`   Connection String: ${maskDatabaseUrl(process.env.DATABASE_URL || '')}`);
    
    // Test database schema - try PostgreSQL first, then SQLite
    try {
      // Try PostgreSQL table count first
      const pgTableCount = await prisma.$queryRaw`
        SELECT COUNT(*) as count FROM information_schema.tables 
        WHERE table_schema = 'public'
      ` as any[];
      console.log(`   Tables: ${pgTableCount[0]?.count || 'Unknown'} tables`);
    } catch (error) {
      try {
        // Try SQLite table count
        const sqliteTableCount = await prisma.$queryRaw`
          SELECT COUNT(*) as count FROM sqlite_master WHERE type='table'
        ` as any[];
        console.log(`   Tables: ${sqliteTableCount[0]?.count || 'Unknown'} tables`);
      } catch (sqliteError) {
        console.log(`   Tables: Unable to determine table count`);
      }
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    throw new Error(`Database connection validation failed: ${error}`);
  }
}

/**
 * Masks sensitive information in database URL for logging
 */
function maskDatabaseUrl(url: string): string {
  if (!url) return 'Not configured';
  
  // Mask password in connection string
  return url.replace(/(:\/\/[^:]+:)[^@]+(@)/, '$1***$2');
}

/**
 * Extracts critical environment variable issues
 */
function extractEnvironmentIssues(): string[] {
  const issues: string[] = [];
  
  // Check for missing required environment variables
  if (!process.env.JWT_SECRET) {
    issues.push('JWT_SECRET: Required environment variable missing');
  }
  
  if (!process.env.WASP_WEB_CLIENT_URL) {
    issues.push('WASP_WEB_CLIENT_URL: Required environment variable missing');
  }
  
  if (!process.env.WASP_SERVER_URL) {
    issues.push('WASP_SERVER_URL: Required environment variable missing');
  }
  
  // Check for invalid API key formats
  if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    issues.push('STRIPE_SECRET_KEY: Invalid format (must start with sk_live_ or sk_test_)');
  }
  
  if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
    issues.push('OpenAI API Key: Invalid format (must start with sk-)');
  }
  
  return issues;
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
  const awsAccessKey = process.env.AWS_S3_IAM_ACCESS_KEY;
  const awsSecretKey = process.env.AWS_S3_IAM_SECRET_KEY;
  const awsRegion = process.env.AWS_S3_REGION;
  const awsBucket = process.env.AWS_S3_FILES_BUCKET;
  
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
async function setupMonitoring(): Promise<string[]> {
  console.log('📊 Setting up monitoring system...');
  const criticalIssues: string[] = [];
  
  try {
    // Run initial monitoring checks
    const dashboard = await runMonitoringChecks();
    
    // Log monitoring status
    console.log(`📊 Monitoring Status: ${dashboard.status.toUpperCase()}`);
    console.log(`   Active alerts: ${dashboard.alerts.filter(a => !a.resolved).length}`);
    console.log(`   Missing env vars: ${dashboard.environmentVariables.missing.length}`);
    console.log(`   Healthy services: ${dashboard.services.healthy.length}`);
    console.log(`   Unhealthy services: ${dashboard.services.unhealthy.length}`);
    
    // Collect critical alerts as issues
    const criticalAlerts = dashboard.alerts.filter(a => a.level === 'critical' && !a.resolved);
    if (criticalAlerts.length > 0) {
      console.warn(`⚠️ ${criticalAlerts.length} critical alerts detected - check configuration`);
      criticalAlerts.forEach(alert => {
        criticalIssues.push(`${alert.service}: ${alert.message}`);
      });
    }
    
    console.log('✅ Monitoring setup completed');
  } catch (error) {
    console.error('❌ Monitoring setup failed:', error);
    // Don't fail startup for monitoring issues
    console.warn('⚠️ Continuing startup despite monitoring setup failure');
    criticalIssues.push(`Monitoring setup failed: ${error}`);
  }
  
  return criticalIssues;
}

/**
 * Logs service configuration status (for development)
 */
function logServiceConfiguration(): void {
  const services = [
    { 
      name: 'Stripe', 
      configured: !!process.env.STRIPE_SECRET_KEY,
      details: process.env.STRIPE_SECRET_KEY ? 
        `Mode: ${process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'Test' : 'Live'}` : 
        'Required for payment processing'
    },
    { 
      name: 'SendGrid', 
      configured: !!process.env.SENDGRID_API_KEY,
      details: process.env.SENDGRID_API_KEY ? 'Email delivery configured' : 'Required for email sending'
    },
    { 
      name: 'Lob', 
      configured: !!(process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY),
      details: process.env.LOB_TEST_KEY ? 'Test environment' : 
               process.env.LOB_PROD_KEY ? 'Production environment' : 'Required for mail service'
    },
    { 
      name: 'AWS S3', 
      configured: !!(process.env.AWS_S3_IAM_ACCESS_KEY && process.env.AWS_S3_IAM_SECRET_KEY),
      details: process.env.AWS_S3_IAM_ACCESS_KEY ? 
        `Bucket: ${process.env.AWS_S3_FILES_BUCKET || 'Not specified'}, Region: ${process.env.AWS_S3_REGION || 'us-east-1'}` : 
        'Required for file storage'
    },
    { 
      name: 'Sentry', 
      configured: !!process.env.SENTRY_DSN,
      details: process.env.SENTRY_DSN ? 'Error tracking enabled' : 'Optional - error tracking disabled'
    },
    { 
      name: 'OpenAI', 
      configured: !!process.env.OPENAI_API_KEY,
      details: process.env.OPENAI_API_KEY ? 'AI features enabled' : 'Optional - AI features disabled'
    },
    { 
      name: 'Google Analytics', 
      configured: !!(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && process.env.GOOGLE_ANALYTICS_PRIVATE_KEY),
      details: process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL ? 'Analytics enabled' : 'Optional - analytics disabled'
    },
  ];
  
  console.log('📋 Service configuration status:');
  services.forEach(service => {
    const status = service.configured ? '✅' : '❌';
    console.log(`  ${status} ${service.name}`);
    if (service.details) {
      console.log(`      ${service.details}`);
    }
  });
}

/**
 * Health check endpoint data
 * Returns the status of all external services
 */
export async function getServiceHealthStatus(): Promise<Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; message?: string }>> {
  const services: Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; message?: string }> = {};
  
  // Check Database
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    services.database = {
      status: 'healthy' as 'healthy' | 'unhealthy' | 'unknown',
      message: undefined
    };
  } catch (error) {
    services.database = {
      status: 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
      message: error instanceof Error ? error.message : 'Database connection failed'
    };
  }
  
  // Check Environment variable (for environment status)
  services.environment = {
    status: process.env.DATABASE_URL ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.DATABASE_URL ? undefined : 'DATABASE_URL not configured'
  };
  
  // Check Stripe
  services.stripe = {
    status: process.env.STRIPE_SECRET_KEY ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.STRIPE_SECRET_KEY ? undefined : 'Stripe secret key not configured'
  };
  
  // Check SendGrid
  services.sendgrid = {
    status: process.env.SENDGRID_API_KEY ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.SENDGRID_API_KEY ? undefined : 'SendGrid API key not configured'
  };
  
  // Check Lob
  const lobKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
  services.lob = {
    status: lobKey ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: lobKey ? undefined : 'Lob API key not configured'
  };
  
  // Check AWS
  const awsConfigured = !!(process.env.AWS_S3_IAM_ACCESS_KEY && process.env.AWS_S3_IAM_SECRET_KEY);
  services.aws = {
    status: awsConfigured ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: awsConfigured ? undefined : 'AWS credentials not configured'
  };
  
  // Check Sentry
  services.sentry = {
    status: process.env.SENTRY_DSN ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.SENTRY_DSN ? undefined : 'Sentry DSN not configured'
  };
  
  // Check OpenAI
  services.openai = {
    status: process.env.OPENAI_API_KEY ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.OPENAI_API_KEY ? undefined : 'OpenAI API key not configured (optional)'
  };
  
  // Check Google Analytics
  const gaConfigured = !!(process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && process.env.GOOGLE_ANALYTICS_PRIVATE_KEY);
  services.googleAnalytics = {
    status: gaConfigured ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    message: gaConfigured ? undefined : 'Google Analytics not configured (optional)'
  };
  
  
  return services;
}
