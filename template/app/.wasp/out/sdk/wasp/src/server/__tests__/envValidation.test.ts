/**
 * Environment validation tests
 * Tests the environment variable validation functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { 
  validateEnvironmentVariables, 
  getRequiredEnvironmentVariables,
  validateEnvironmentVariablesFor,
  getOptionalEnvironmentVariables 
} from '../envValidation';

describe('Environment Validation', () => {
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    // Store original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  it('should return correct required environment variables', () => {
    const requiredVars = getRequiredEnvironmentVariables();
    expect(requiredVars).toBeDefined();
    expect(Array.isArray(requiredVars)).toBe(true);
    
    // Check that all expected variables are included
    const expectedVars = [
      'DATABASE_URL',
      'JWT_SECRET', 
      'WASP_WEB_CLIENT_URL',
      'WASP_SERVER_URL',
      'SENDGRID_API_KEY',
      'SENDGRID_FROM_EMAIL',
      'SENDGRID_FROM_NAME',
      'STRIPE_SECRET_KEY',
      'STRIPE_PUBLISHABLE_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'STRIPE_CUSTOMER_PORTAL_URL',
      'LOB_PROD_KEY',
      'LOB_ENVIRONMENT',
      'LOB_WEBHOOK_SECRET',
      'AWS_ACCESS_KEY_ID',
      'AWS_SECRET_ACCESS_KEY',
      'AWS_REGION',
      'AWS_S3_BUCKET',
      'SENTRY_DSN',
      'SENTRY_RELEASE',
      'SENTRY_SERVER_NAME'
    ];
    
    expectedVars.forEach(varName => {
      expect(requiredVars).toContain(varName);
    });
  });

  it('should return optional environment variables', () => {
    const optionalVars = getOptionalEnvironmentVariables();
    expect(optionalVars).toBeDefined();
    expect(Array.isArray(optionalVars)).toBe(true);
    expect(optionalVars).toContain('NODE_ENV');
    expect(optionalVars).toContain('PORT');
  });

  it('should validate environment variables in production mode', () => {
    process.env.NODE_ENV = 'production';
    
    // Set up valid production environment
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
    process.env.WASP_WEB_CLIENT_URL = 'http://localhost:3000';
    process.env.WASP_SERVER_URL = 'http://localhost:3001';
    process.env.SENDGRID_API_KEY = 'test-sendgrid-key';
    process.env.SENDGRID_FROM_EMAIL = 'test@example.com';
    process.env.SENDGRID_FROM_NAME = 'Test App';
    process.env.STRIPE_SECRET_KEY = 'sk_test_123';
    process.env.STRIPE_PUBLISHABLE_KEY = 'pk_test_123';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_123';
    process.env.STRIPE_CUSTOMER_PORTAL_URL = 'https://billing.stripe.com/test';
    process.env.LOB_PROD_KEY = 'test-lob-key';
    process.env.LOB_ENVIRONMENT = 'test';
    process.env.LOB_WEBHOOK_SECRET = 'test-lob-webhook-secret';
    process.env.AWS_ACCESS_KEY_ID = 'test-aws-key';
    process.env.AWS_SECRET_ACCESS_KEY = 'test-aws-secret';
    process.env.AWS_REGION = 'us-east-1';
    process.env.AWS_S3_BUCKET = 'test-bucket';
    process.env.SENTRY_DSN = 'https://test@sentry.io/test';
    process.env.SENTRY_RELEASE = 'test-release';
    process.env.SENTRY_SERVER_NAME = 'test-server';

    expect(() => validateEnvironmentVariablesFor('production')).not.toThrow();
  });

  it('should handle missing variables gracefully in development mode', () => {
    process.env.NODE_ENV = 'development';
    
    // Only set core required variables
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
    process.env.WASP_WEB_CLIENT_URL = 'http://localhost:3000';
    process.env.WASP_SERVER_URL = 'http://localhost:3001';

    expect(() => validateEnvironmentVariablesFor('development')).not.toThrow();
  });

  it('should throw error for invalid JWT_SECRET length', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'short'; // Too short
    process.env.WASP_WEB_CLIENT_URL = 'http://localhost:3000';
    process.env.WASP_SERVER_URL = 'http://localhost:3001';

    expect(() => validateEnvironmentVariablesFor('production')).toThrow();
  });

  it('should throw error for invalid URL format', () => {
    process.env.NODE_ENV = 'production';
    process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
    process.env.JWT_SECRET = 'test-secret-that-is-at-least-32-characters-long';
    process.env.WASP_WEB_CLIENT_URL = 'invalid-url'; // Invalid URL
    process.env.WASP_SERVER_URL = 'http://localhost:3001';

    expect(() => validateEnvironmentVariablesFor('production')).toThrow();
  });
});
