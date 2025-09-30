import { isDevelopment, isProduction } from './envValidation';

/**
 * Creates a comprehensive startup banner with key system information
 * This provides developers with immediate visibility into the application state
 */

interface SystemInfo {
  environment: string;
  nodeVersion: string;
  waspVersion: string;
  databaseProvider: string;
  ports: {
    client: number;
    server: number;
  };
  services: {
    configured: string[];
    missing: string[];
    optional: string[];
  };
  features: {
    enabled: string[];
    disabled: string[];
  };
  startupTime: number;
}

/**
 * Displays a comprehensive startup banner
 */
export function displayStartupBanner(startTime: number = Date.now(), criticalIssues: string[] = []): void {
  const systemInfo = gatherSystemInfo(startTime);
  
  console.log('\n' + '='.repeat(80));
  console.log('🚀 POSTMARKR - DEVELOPMENT SERVER STARTUP');
  
  // Status Summary
  const hasCriticalIssues = criticalIssues.length > 0;
  const statusText = hasCriticalIssues ? '⚠️ PARTIALLY FUNCTIONAL' : '✅ FULLY FUNCTIONAL';
  const issueCount = hasCriticalIssues ? ` (${criticalIssues.length} critical issues)` : '';
  console.log(`Status: ${statusText}${issueCount}`);
  console.log('='.repeat(80));
  
  // Critical Issues Section
  if (hasCriticalIssues) {
    console.log('\n🚨 CRITICAL ISSUES REQUIRING ATTENTION:');
    criticalIssues.forEach(issue => {
      console.log(`   ❌ ${issue}`);
    });
    console.log('');
  }
  
  // System Overview
  const startupDuration = Date.now() - startTime;
  console.log('📊 SYSTEM OVERVIEW:');
  console.log(`   📋 Environment: ${systemInfo.environment.toUpperCase()}`);
  console.log(`   🔧 Node.js: ${systemInfo.nodeVersion}`);
  console.log(`   ⚡ Wasp: ${systemInfo.waspVersion}`);
  console.log(`   🗄️ Database: ${systemInfo.databaseProvider}`);
  console.log(`   🌐 Client: http://localhost:${systemInfo.ports.client}`);
  console.log(`   🔗 Server: http://localhost:${systemInfo.ports.server}`);
  console.log(`   ⏱️ Startup Time: ${startupDuration}ms`);
  
  // Services Status (will be populated by connectivity results)
  console.log('\n📡 SERVICES STATUS:');
  console.log('   (Service connectivity results will be displayed above)');
  
  // Feature Status
  console.log('\n🎯 FEATURES STATUS:');
  systemInfo.features.enabled.forEach(feature => {
    console.log(`   ✅ ${feature}`);
  });
  
  systemInfo.features.disabled.forEach(feature => {
    console.log(`   ❌ ${feature}`);
  });
  
  // Development Guidance
  console.log('\n💡 DEVELOPMENT GUIDANCE:');
  
  if (hasCriticalIssues) {
    console.log('   🔧 IMMEDIATE ACTIONS:');
    if (criticalIssues.some(issue => issue.includes('JWT_SECRET'))) {
      console.log('      • Fix missing JWT_SECRET in .env.server');
    }
    if (criticalIssues.some(issue => issue.includes('WASP_WEB_CLIENT_URL'))) {
      console.log('      • Set WASP_WEB_CLIENT_URL=http://localhost:3000');
    }
    if (criticalIssues.some(issue => issue.includes('WASP_SERVER_URL'))) {
      console.log('      • Set WASP_SERVER_URL=http://localhost:3001');
    }
    if (criticalIssues.some(issue => issue.includes('OpenAI'))) {
      console.log('      • Fix OpenAI API key format (must start with sk-)');
    }
    console.log('');
  }
  
  console.log('   🚀 NEXT STEPS:');
  console.log('      • Check /admin for admin dashboard');
  console.log('      • Use /health for system health check');
  console.log('      • Email auth uses Dummy provider (check console)');
  console.log('      • Run `wasp db seed` to populate test data');
  
  // Quick Reference
  console.log('\n📚 QUICK REFERENCE:');
  console.log('   🔗 Health Check: http://localhost:3001/health');
  console.log('   📊 Admin Dashboard: http://localhost:3000/admin');
  console.log('   📋 Environment Setup: docs/ENVIRONMENT_SETUP.md');
  console.log('   🆘 Support: Check server logs for detailed error information');
  
  console.log('='.repeat(80));
  console.log('🎉 Server ready! Happy coding! 🎉');
  console.log('='.repeat(80) + '\n');
}

/**
 * Gathers comprehensive system information
 */
function gatherSystemInfo(startTime: number): SystemInfo {
  const environment = process.env.NODE_ENV || 'development';
  const nodeVersion = process.version;
  const waspVersion = '^0.18.0'; // From main.wasp
  
  // Determine database provider from DATABASE_URL
  const databaseUrl = process.env.DATABASE_URL || '';
  const databaseProvider = databaseUrl.includes('postgresql') || databaseUrl.includes('postgres') ? 'PostgreSQL' : 'SQLite';
  
  // Service configuration status
  const services = {
    configured: [] as string[],
    missing: [] as string[],
    optional: [] as string[]
  };
  
  // Required services
  if (process.env.STRIPE_SECRET_KEY) {
    services.configured.push('Stripe (Payment)');
  } else if (isProduction()) {
    services.missing.push('Stripe (Payment)');
  }
  
  if (process.env.SENDGRID_API_KEY) {
    services.configured.push('SendGrid (Email)');
  } else if (isProduction()) {
    services.missing.push('SendGrid (Email)');
  }
  
  if (process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY) {
    const lobKey = process.env.LOB_TEST_KEY ? 'Test' : 'Production';
    services.configured.push(`Lob (Mail Service - ${lobKey})`);
  } else {
    services.missing.push('Lob (Mail Service)');
  }
  
  if (process.env.AWS_S3_IAM_ACCESS_KEY && process.env.AWS_S3_IAM_SECRET_KEY) {
    services.configured.push('AWS S3 (File Storage)');
  } else {
    services.missing.push('AWS S3 (File Storage)');
  }
  
  // Optional services
  if (process.env.SENTRY_DSN) {
    services.configured.push('Sentry (Error Tracking)');
  } else {
    services.optional.push('Sentry (Error Tracking)');
  }
  
  if (process.env.OPENAI_API_KEY) {
    services.configured.push('OpenAI (AI Features)');
  } else {
    services.optional.push('OpenAI (AI Features)');
  }
  
  if (process.env.GOOGLE_ANALYTICS_CLIENT_EMAIL && process.env.GOOGLE_ANALYTICS_PRIVATE_KEY) {
    services.configured.push('Google Analytics');
  } else {
    services.optional.push('Google Analytics');
  }
  
  // Feature status
  const features = {
    enabled: [] as string[],
    disabled: [] as string[]
  };
  
  // Auth features
  features.enabled.push('Email Authentication');
  if (process.env.GOOGLE_CLIENT_ID) {
    features.enabled.push('Google OAuth');
  } else {
    features.disabled.push('Google OAuth');
  }
  
  // Core features
  features.enabled.push('File Upload');
  features.enabled.push('Address Management');
  features.enabled.push('Mail Creation');
  features.enabled.push('Admin Dashboard');
  
  if (process.env.STRIPE_SECRET_KEY) {
    features.enabled.push('Payment Processing');
  } else {
    features.disabled.push('Payment Processing');
  }
  
  if (process.env.LOB_TEST_KEY || process.env.LOB_PROD_KEY) {
    features.enabled.push('Physical Mail Service');
  } else {
    features.disabled.push('Physical Mail Service');
  }
  
  return {
    environment,
    nodeVersion,
    waspVersion,
    databaseProvider,
    ports: {
      client: 3000,
      server: 3001
    },
    services,
    features,
    startupTime: startTime
  };
}

/**
 * Displays a quick status summary for production
 */
export function displayProductionStatus(): void {
  console.log('\n🚀 POSTMARKR - PRODUCTION SERVER');
  console.log('='.repeat(50));
  console.log(`📋 Environment: ${process.env.NODE_ENV?.toUpperCase() || 'PRODUCTION'}`);
  console.log(`🔧 Node.js: ${process.version}`);
  console.log(`🗄️ Database: ${process.env.DATABASE_URL?.includes('postgresql') || process.env.DATABASE_URL?.includes('postgres') ? 'PostgreSQL' : 'SQLite'}`);
  console.log(`🌐 Server: http://localhost:${process.env.PORT || 3001}`);
  console.log('='.repeat(50) + '\n');
}
