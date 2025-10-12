import { validateEnvironmentOnStartup, isProduction, isDevelopment } from './envValidation';
import { runAllConnectivityTests, runCriticalConnectivityTests } from './apiConnectivityTests';
import { alertManager, runMonitoringChecks } from './monitoringAlerts';
import { displayStartupBanner, displayProductionStatus } from './startupBanner';
import { runServiceConnectivityTests } from './serviceConnectivityTests';
import { PrismaClient } from '@prisma/client';

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
    try {
      await validateDatabaseConnection();
    } catch (error) {
      console.warn('⚠️  Database connection validation failed:', error);
      console.warn('⚠️  Server will continue but database operations may fail');
      criticalIssues.push(`Database connection failed: ${error}`);
    }
    
    // Phase 3: External service configuration validation
    console.log('🔗 Phase 3: External service configuration validation...');
    try {
      validateExternalServices();
    } catch (error) {
      console.warn('⚠️  External service validation failed:', error);
      console.warn('⚠️  Server will continue but some services may not work');
      criticalIssues.push(`External service validation failed: ${error}`);
    }
    
    // Phase 3.5: Real-time service connectivity tests (development only)
    if (isDevelopment()) {
      console.log('🧪 Phase 3.5: Real-time service connectivity tests...');
      try {
        const connectivityIssues = await runServiceConnectivityTests();
        criticalIssues.push(...connectivityIssues);
      } catch (error) {
        console.warn('⚠️  Service connectivity tests failed:', error);
        criticalIssues.push(`Service connectivity tests failed: ${error}`);
      }
    }
    
    // Phase 4: API connectivity tests (production only)
    if (isProduction()) {
      console.log('🧪 Phase 4: API connectivity tests...');
      try {
        await validateApiConnectivity();
      } catch (error) {
        console.warn('⚠️  API connectivity validation failed:', error);
        console.warn('⚠️  Server will continue but API integrations may not work');
        criticalIssues.push(`API connectivity failed: ${error}`);
      }
    }
    
    // Phase 5: Monitoring setup and initial health check
    console.log('📊 Phase 5: Monitoring setup and health check...');
    const monitoringIssues = await setupMonitoring();
    criticalIssues.push(...monitoringIssues);
    
    // Phase 6: Display startup banner
    console.log('🎨 Phase 6: Displaying startup information...');
    try {
      if (isDevelopment()) {
        displayStartupBanner(startTime, criticalIssues);
      } else {
        displayProductionStatus();
      }
    } catch (error) {
      console.warn('⚠️  Failed to display startup banner:', error);
    }
    
    console.log('✅ Server startup validation completed successfully');
  } catch (error) {
    console.error('❌ Server startup validation failed:', error);
    // Log the error but don't crash in production - allow server to start
    // This prevents crash loops when non-critical services are misconfigured
    if (isDevelopment()) {
      // Only exit in development to catch config issues early
      process.exit(1);
    } else {
      console.warn('⚠️  Server starting despite validation failures - check logs!');
    }
  }
}

/**
 * Validates database connection with real connectivity tests
 * Now logs warnings instead of throwing errors
 */
async function validateDatabaseConnection(): Promise<void> {
  console.log('📊 Validating database connection...');
  
  try {
    // Use Prisma client directly to avoid Rollup dynamic import issues
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
    console.warn('⚠️  Server will continue but database operations will fail');
    // Don't throw - just log the error and continue
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
  
  try {
    // Check for missing required environment variables
    if (!process.env.JWT_SECRET) {
      issues.push('JWT_SECRET: Required environment variable missing');
      console.warn('⚠️  JWT_SECRET is missing - authentication may not work');
    }
    
    if (!process.env.WASP_WEB_CLIENT_URL) {
      issues.push('WASP_WEB_CLIENT_URL: Required environment variable missing');
      console.warn('⚠️  WASP_WEB_CLIENT_URL is missing - CORS may not work');
    }
    
    if (!process.env.WASP_SERVER_URL) {
      issues.push('WASP_SERVER_URL: Required environment variable missing');
      console.warn('⚠️  WASP_SERVER_URL is missing - client-server communication may fail');
    }
    
    // Check for invalid API key formats
    if (process.env.STRIPE_SECRET_KEY && !process.env.STRIPE_SECRET_KEY.startsWith('sk_')) {
      issues.push('STRIPE_SECRET_KEY: Invalid format (must start with sk_live_ or sk_test_)');
      console.warn('⚠️  STRIPE_SECRET_KEY has invalid format');
    }
    
    if (process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.startsWith('sk-')) {
      issues.push('OpenAI API Key: Invalid format (must start with sk-)');
      console.warn('⚠️  OPENAI_API_KEY has invalid format');
    }
  } catch (error) {
    console.warn('⚠️  Error while extracting environment issues:', error);
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
    // Use try-catch to prevent validation failures from crashing the server
    try { validateStripeConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateSendGridConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateLobConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateAwsConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateSentryConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateOpenAIConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
    try { validateGoogleAnalyticsConfiguration(); } catch (e) { console.warn('⚠️ ', e); }
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
  console.log('📊 Validating Google Analytics configuration...');
  
  const clientEmail = process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_ANALYTICS_PRIVATE_KEY;
  const propertyId = process.env.GOOGLE_ANALYTICS_PROPERTY_ID;
  
  console.log('🔍 Environment variables:');
  console.log('   GOOGLE_ANALYTICS_CLIENT_EMAIL:', clientEmail ? `${clientEmail.substring(0, 20)}...` : 'NOT SET');
  console.log('   GOOGLE_ANALYTICS_PRIVATE_KEY:', privateKey ? `SET (${privateKey.length} chars)` : 'NOT SET');
  console.log('   GOOGLE_ANALYTICS_PROPERTY_ID:', propertyId || 'NOT SET');
  
  if (!clientEmail || !privateKey || !propertyId) {
    const missing = [
      !clientEmail && 'GOOGLE_ANALYTICS_CLIENT_EMAIL',
      !privateKey && 'GOOGLE_ANALYTICS_PRIVATE_KEY',
      !propertyId && 'GOOGLE_ANALYTICS_PROPERTY_ID'
    ].filter(Boolean);
    console.warn('⚠️  Google Analytics not fully configured - analytics features will be limited');
    console.warn('   Missing variables:', missing.join(', '));
    console.warn('💡 To enable Google Analytics API, set these in .env.server');
    return;
  }
  
  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(clientEmail)) {
    console.error('❌ Google Analytics client email format is invalid:', clientEmail);
    throw new Error('Google Analytics client email format is invalid');
  }
  console.log('   ✓ Email format valid');
  
  // Validate private key format (should be base64 encoded)
  try {
    const decoded = Buffer.from(privateKey, 'base64').toString('utf-8');
    console.log('   ✓ Private key is valid base64');
    console.log('   ✓ Decoded key length:', decoded.length);
    
    if (!decoded.includes('BEGIN PRIVATE KEY')) {
      console.error('❌ Decoded private key missing BEGIN PRIVATE KEY header');
      throw new Error('Invalid private key format - missing header');
    }
    if (!decoded.includes('END PRIVATE KEY')) {
      console.error('❌ Decoded private key missing END PRIVATE KEY footer');
      throw new Error('Invalid private key format - missing footer');
    }
    console.log('   ✓ Private key format valid (PEM)');
  } catch (error) {
    console.error('❌ Failed to validate private key:', error);
    throw new Error('Google Analytics private key is invalid');
  }
  
  // Validate property ID format (should be numeric)
  if (!/^\d+$/.test(propertyId)) {
    console.error('❌ Google Analytics property ID should be numeric:', propertyId);
    throw new Error('Google Analytics property ID format is invalid');
  }
  console.log('   ✓ Property ID format valid (numeric)');
  
  console.log('✅ Google Analytics configuration validated successfully');
  console.log('💡 Note: This validates configuration format only, not API connectivity');
  console.log('   Check googleAnalyticsUtils.ts module logs for actual API initialization status');
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
      console.warn('⚠️  Some critical API connectivity tests failed:');
      failedTests.forEach(test => {
        console.warn(`   ${test.service}: ${test.error}`);
      });
      // Don't throw - just warn and continue
      console.warn(`⚠️  ${failedTests.length} API connectivity test(s) failed - server continuing anyway`);
    } else {
      console.log('✅ All critical API connectivity tests passed');
    }
  } catch (error) {
    console.warn('⚠️  API connectivity validation failed:', error);
    console.warn('⚠️  Continuing server startup anyway');
    // Don't throw - just warn and continue
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
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    services.database = {
      status: 'healthy',
      message: 'PostgreSQL connection successful'
    };
  } catch (error) {
    services.database = {
      status: 'unhealthy',
      message: error instanceof Error ? error.message : 'PostgreSQL connection failed'
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
  
  // Check SendGrid (Email Service)
  if (process.env.SENDGRID_API_KEY) {
    try {
      // Simple API key validation - check if it starts with 'SG.'
      if (process.env.SENDGRID_API_KEY.startsWith('SG.')) {
        services.sendgrid = {
          status: 'healthy',
          message: 'SendGrid integration configured'
        };
      } else {
        services.sendgrid = {
          status: 'unhealthy',
          message: 'SendGrid API key format invalid'
        };
      }
    } catch (error) {
      services.sendgrid = {
        status: 'unhealthy',
        message: 'SendGrid integration error'
      };
    }
  } else {
    services.sendgrid = {
      status: 'unhealthy',
      message: 'SendGrid integration not configured'
    };
  }
  
  // Check Lob (Mail Service)
  const lobKey = process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY;
  if (lobKey) {
    try {
      // Simple API key validation - check if it starts with 'test_' or 'live_'
      if (lobKey.startsWith('test_') || lobKey.startsWith('live_')) {
        services.lob = {
          status: 'healthy',
          message: 'Lob API integration configured'
        };
      } else {
        services.lob = {
          status: 'unhealthy',
          message: 'Lob API key format invalid'
        };
      }
    } catch (error) {
      services.lob = {
        status: 'unhealthy',
        message: 'Lob API integration error'
      };
    }
  } else {
    services.lob = {
      status: 'unhealthy',
      message: 'Lob API integration not configured'
    };
  }
  
  // Check AWS
  const awsConfigured = !!(process.env.AWS_S3_IAM_ACCESS_KEY && process.env.AWS_S3_IAM_SECRET_KEY);
  services.aws = {
    status: awsConfigured ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
    message: awsConfigured ? undefined : 'AWS credentials not configured'
  };
  
  // Check Sentry (optional)
  if (process.env.SENTRY_DSN) {
    services.sentry = {
      status: 'healthy',
      message: 'Sentry monitoring configured'
    };
  } else {
    services.sentry = {
      status: 'unknown',
      message: 'Sentry DSN not provided, skipping initialization'
    };
  }
  
  // Check OpenAI
  services.openai = {
    status: process.env.OPENAI_API_KEY ? 'healthy' as 'healthy' | 'unhealthy' | 'unknown' : 'unknown' as 'healthy' | 'unhealthy' | 'unknown',
    message: process.env.OPENAI_API_KEY ? undefined : 'OpenAI API key not configured (optional)'
  };
  
  // Check Google Analytics (optional)
  if (process.env.GOOGLE_ANALYTICS_ID) {
    services.googleAnalytics = {
      status: 'healthy',
      message: 'Google Analytics configured'
    };
  } else {
    services.googleAnalytics = {
      status: 'unknown',
      message: 'Google Analytics ID not provided, skipping initialization'
    };
  }
  
  
  return services;
}
