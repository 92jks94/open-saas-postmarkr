#!/usr/bin/env node
/**
 * Production Readiness Check
 * 
 * This script validates that all required environment variables and configurations
 * are properly set for production deployment. Run this before deploying to catch
 * configuration issues early.
 * 
 * Usage: npm run check:production
 */

import { z } from 'zod';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

interface CheckResult {
  category: string;
  name: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  critical: boolean;
}

const results: CheckResult[] = [];

/**
 * Add a check result
 */
function addResult(
  category: string,
  name: string,
  status: 'pass' | 'fail' | 'warning',
  message: string,
  critical: boolean = false
): void {
  results.push({ category, name, status, message, critical });
}

/**
 * Check if an environment variable exists and optionally validate its format
 */
function checkEnvVar(
  name: string,
  options: {
    required: boolean;
    critical?: boolean;
    validator?: (value: string) => boolean;
    validationMessage?: string;
  }
): boolean {
  const value = process.env[name];
  const critical = options.critical ?? options.required;

  if (!value) {
    if (options.required) {
      addResult(
        'Environment Variables',
        name,
        'fail',
        `Required environment variable ${name} is not set`,
        critical
      );
      return false;
    } else {
      addResult(
        'Environment Variables',
        name,
        'warning',
        `Optional environment variable ${name} is not set`,
        false
      );
      return false;
    }
  }

  // Validate format if validator is provided
  if (options.validator && !options.validator(value)) {
    addResult(
      'Environment Variables',
      name,
      'fail',
      options.validationMessage || `Environment variable ${name} has invalid format`,
      critical
    );
    return false;
  }

  addResult('Environment Variables', name, 'pass', `✓ ${name} is configured`, false);
  return true;
}

/**
 * Check Core Application Environment Variables
 */
function checkCoreEnvironment(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Core Environment...${colors.reset}`);

  checkEnvVar('NODE_ENV', {
    required: true,
    critical: true,
    validator: (v) => v === 'production',
    validationMessage: 'NODE_ENV must be set to "production" for production deployment',
  });

  checkEnvVar('DATABASE_URL', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('postgresql://') || v.startsWith('postgres://'),
    validationMessage: 'DATABASE_URL must be a valid PostgreSQL connection string',
  });

  checkEnvVar('JWT_SECRET', {
    required: true,
    critical: true,
    validator: (v) => v.length >= 32,
    validationMessage: 'JWT_SECRET must be at least 32 characters long',
  });

  checkEnvVar('WASP_WEB_CLIENT_URL', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('https://'),
    validationMessage: 'WASP_WEB_CLIENT_URL must use HTTPS in production',
  });

  checkEnvVar('WASP_SERVER_URL', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('https://'),
    validationMessage: 'WASP_SERVER_URL must use HTTPS in production',
  });
}

/**
 * Check Email Service Configuration (SendGrid)
 */
function checkEmailConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Email Configuration...${colors.reset}`);

  checkEnvVar('SENDGRID_API_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('SG.'),
    validationMessage: 'SENDGRID_API_KEY must start with "SG."',
  });

  checkEnvVar('SENDGRID_FROM_EMAIL', {
    required: true,
    critical: true,
    validator: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
    validationMessage: 'SENDGRID_FROM_EMAIL must be a valid email address',
  });

  checkEnvVar('SENDGRID_FROM_NAME', {
    required: true,
    critical: false,
  });
}

/**
 * Check Payment Processing Configuration (Stripe)
 */
function checkPaymentConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Payment Configuration...${colors.reset}`);

  const stripeKeySet = checkEnvVar('STRIPE_SECRET_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('sk_live_'),
    validationMessage: 'STRIPE_SECRET_KEY must be a live key (starts with "sk_live_") for production',
  });

  checkEnvVar('STRIPE_PUBLISHABLE_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('pk_live_'),
    validationMessage: 'STRIPE_PUBLISHABLE_KEY must be a live key (starts with "pk_live_") for production',
  });

  checkEnvVar('STRIPE_WEBHOOK_SECRET', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('whsec_'),
    validationMessage: 'STRIPE_WEBHOOK_SECRET must start with "whsec_"',
  });

  if (stripeKeySet) {
    addResult(
      'Payment Configuration',
      'Stripe Test Mode Check',
      'warning',
      '⚠️  Ensure you are using LIVE Stripe keys, not test keys',
      false
    );
  }
}

/**
 * Check Mail Service Configuration (Lob)
 */
function checkMailServiceConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Mail Service Configuration...${colors.reset}`);

  checkEnvVar('LOB_PROD_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('live_'),
    validationMessage: 'LOB_PROD_KEY must be a live key (starts with "live_") for production',
  });

  checkEnvVar('LOB_ENVIRONMENT', {
    required: true,
    critical: true,
    validator: (v) => v === 'live' || v === 'prod',
    validationMessage: 'LOB_ENVIRONMENT must be set to "live" or "prod" for production',
  });

  checkEnvVar('LOB_WEBHOOK_SECRET', {
    required: true,
    critical: true,
    validator: (v) => v !== 'secret',
    validationMessage: 'LOB_WEBHOOK_SECRET must not be the default value "secret"',
  });
}

/**
 * Check File Storage Configuration (AWS S3)
 */
function checkFileStorageConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking File Storage Configuration...${colors.reset}`);

  checkEnvVar('AWS_S3_REGION', {
    required: true,
    critical: true,
  });

  checkEnvVar('AWS_S3_IAM_ACCESS_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.length >= 16,
    validationMessage: 'AWS_S3_IAM_ACCESS_KEY appears to be invalid',
  });

  checkEnvVar('AWS_S3_IAM_SECRET_KEY', {
    required: true,
    critical: true,
    validator: (v) => v.length >= 32,
    validationMessage: 'AWS_S3_IAM_SECRET_KEY appears to be invalid',
  });

  checkEnvVar('AWS_S3_FILES_BUCKET', {
    required: true,
    critical: true,
  });
}

/**
 * Check Monitoring & Error Tracking Configuration (Sentry)
 */
function checkMonitoringConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Monitoring Configuration...${colors.reset}`);

  checkEnvVar('SENTRY_DSN', {
    required: true,
    critical: true,
    validator: (v) => v.startsWith('https://'),
    validationMessage: 'SENTRY_DSN must be a valid HTTPS URL',
  });

  checkEnvVar('SENTRY_RELEASE', {
    required: false,
    critical: false,
  });

  checkEnvVar('SENTRY_SERVER_NAME', {
    required: false,
    critical: false,
  });
}

/**
 * Check Optional Service Configuration
 */
function checkOptionalServices(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Optional Services...${colors.reset}`);

  checkEnvVar('OPENAI_API_KEY', {
    required: false,
    critical: false,
    validator: (v) => v.startsWith('sk-'),
    validationMessage: 'OPENAI_API_KEY should start with "sk-"',
  });

  checkEnvVar('GOOGLE_ANALYTICS_CLIENT_EMAIL', {
    required: false,
    critical: false,
  });

  checkEnvVar('GOOGLE_ANALYTICS_PRIVATE_KEY', {
    required: false,
    critical: false,
  });

  checkEnvVar('GOOGLE_ANALYTICS_PROPERTY_ID', {
    required: false,
    critical: false,
  });
}

/**
 * Check Admin Configuration
 */
function checkAdminConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Admin Configuration...${colors.reset}`);

  const adminEmails = process.env.ADMIN_EMAILS;
  if (!adminEmails) {
    addResult(
      'Admin Configuration',
      'ADMIN_EMAILS',
      'warning',
      'ADMIN_EMAILS not set - no users will have admin access by default',
      false
    );
  } else {
    const emails = adminEmails.split(',').map((e) => e.trim());
    const validEmails = emails.every((email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email));
    
    if (validEmails) {
      addResult(
        'Admin Configuration',
        'ADMIN_EMAILS',
        'pass',
        `✓ ${emails.length} admin email(s) configured`,
        false
      );
    } else {
      addResult(
        'Admin Configuration',
        'ADMIN_EMAILS',
        'fail',
        'ADMIN_EMAILS contains invalid email addresses',
        false
      );
    }
  }
}

/**
 * Check Security Configuration
 */
function checkSecurityConfiguration(): void {
  console.log(`\n${colors.cyan}${colors.bold}Checking Security Configuration...${colors.reset}`);

  // Check that we're not using development values
  if (process.env.JWT_SECRET === 'your-super-secret-jwt-key-min-32-characters-long') {
    addResult(
      'Security Configuration',
      'JWT_SECRET',
      'fail',
      'JWT_SECRET is using the development default value - CHANGE THIS!',
      true
    );
  }

  // Check that skip email verification is not set
  if (process.env.SKIP_EMAIL_VERIFICATION === 'true') {
    addResult(
      'Security Configuration',
      'Email Verification',
      'fail',
      'SKIP_EMAIL_VERIFICATION is enabled - email verification is disabled!',
      true
    );
  } else {
    addResult(
      'Security Configuration',
      'Email Verification',
      'pass',
      '✓ Email verification is enabled',
      false
    );
  }

  // Check NODE_ENV
  if (process.env.NODE_ENV !== 'production') {
    addResult(
      'Security Configuration',
      'NODE_ENV',
      'fail',
      `NODE_ENV is "${process.env.NODE_ENV}" but should be "production"`,
      true
    );
  }
}

/**
 * Print summary report
 */
function printSummary(): void {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`${colors.bold}${colors.cyan}PRODUCTION READINESS CHECK SUMMARY${colors.reset}`);
  console.log('='.repeat(80));

  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const warnings = results.filter((r) => r.status === 'warning').length;
  const criticalFailures = results.filter((r) => r.status === 'fail' && r.critical).length;

  console.log(`\n${colors.green}✓ Passed:${colors.reset} ${passed}`);
  console.log(`${colors.red}✗ Failed:${colors.reset} ${failed} (${criticalFailures} critical)`);
  console.log(`${colors.yellow}⚠ Warnings:${colors.reset} ${warnings}`);

  // Group results by category
  const categories = [...new Set(results.map((r) => r.category))];

  for (const category of categories) {
    const categoryResults = results.filter((r) => r.category === category);
    const categoryFailed = categoryResults.filter((r) => r.status === 'fail').length;
    const categoryWarnings = categoryResults.filter((r) => r.status === 'warning').length;

    if (categoryFailed > 0 || categoryWarnings > 0) {
      console.log(`\n${colors.bold}${category}:${colors.reset}`);
      
      for (const result of categoryResults) {
        if (result.status === 'fail') {
          const marker = result.critical ? '🔴 CRITICAL' : '❌';
          console.log(`  ${marker} ${result.message}`);
        } else if (result.status === 'warning') {
          console.log(`  ${colors.yellow}⚠️  ${result.message}${colors.reset}`);
        }
      }
    }
  }

  console.log('\n' + '='.repeat(80));

  if (criticalFailures > 0) {
    console.log(`\n${colors.red}${colors.bold}❌ CRITICAL FAILURES DETECTED!${colors.reset}`);
    console.log(`${colors.red}Production deployment is NOT recommended.${colors.reset}`);
    console.log(`\nFix ${criticalFailures} critical issue(s) before deploying to production.\n`);
    process.exit(1);
  } else if (failed > 0) {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  NON-CRITICAL FAILURES DETECTED${colors.reset}`);
    console.log(`${colors.yellow}Production deployment is possible but not recommended.${colors.reset}`);
    console.log(`\nConsider fixing ${failed} issue(s) before deploying to production.\n`);
    process.exit(1);
  } else if (warnings > 0) {
    console.log(`\n${colors.yellow}${colors.bold}⚠️  WARNINGS DETECTED${colors.reset}`);
    console.log(`${colors.green}Production deployment is ready with minor warnings.${colors.reset}`);
    console.log(`\nReview ${warnings} warning(s) but deployment can proceed.\n`);
    process.exit(0);
  } else {
    console.log(`\n${colors.green}${colors.bold}✅ ALL CHECKS PASSED!${colors.reset}`);
    console.log(`${colors.green}Your application is ready for production deployment.${colors.reset}\n`);
    process.exit(0);
  }
}

/**
 * Main execution
 */
function main(): void {
  console.log(`${colors.bold}${colors.cyan}
╔══════════════════════════════════════════════════════════════════════╗
║                   PRODUCTION READINESS CHECK                         ║
║                        Postmarkr v1.0.0                              ║
╚══════════════════════════════════════════════════════════════════════╝
${colors.reset}`);

  console.log(`\n${colors.yellow}This script validates that your environment is properly configured for production.${colors.reset}`);
  console.log(`${colors.yellow}It checks required environment variables, validates formats, and ensures security settings.${colors.reset}\n`);

  try {
    checkCoreEnvironment();
    checkEmailConfiguration();
    checkPaymentConfiguration();
    checkMailServiceConfiguration();
    checkFileStorageConfiguration();
    checkMonitoringConfiguration();
    checkOptionalServices();
    checkAdminConfiguration();
    checkSecurityConfiguration();

    printSummary();
  } catch (error) {
    console.error(`\n${colors.red}${colors.bold}ERROR: Production readiness check failed${colors.reset}`);
    console.error(error);
    process.exit(1);
  }
}

// Run the check
main();

