import { validateEnvironmentVariables, validateEnvironmentVariablesFor } from '../envValidation';

// Mock process.env
const originalEnv = process.env;

beforeEach(() => {
  jest.resetModules();
  process.env = { ...originalEnv };
});

afterAll(() => {
  process.env = originalEnv;
});

describe('Environment Variable Validation', () => {
  describe('validateEnvironmentVariables', () => {
    it('should validate all required environment variables', () => {
      // Set up minimal required environment variables
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@host:port/db',
        JWT_SECRET: 'your-super-secret-jwt-key-here-32-chars',
        WASP_WEB_CLIENT_URL: 'https://postmarkr.com',
        WASP_SERVER_URL: 'https://api.postmarkr.com',
        SENDGRID_API_KEY: 'SG.your_sendgrid_api_key_here',
        SENDGRID_FROM_EMAIL: 'noreply@postmarkr.com',
        SENDGRID_FROM_NAME: 'Postmarkr',
        STRIPE_SECRET_KEY: 'sk_live_your_stripe_secret_key_here',
        STRIPE_PUBLISHABLE_KEY: 'pk_live_your_stripe_publishable_key_here',
        STRIPE_WEBHOOK_SECRET: 'whsec_your_stripe_webhook_secret_here',
        STRIPE_CUSTOMER_PORTAL_URL: 'https://billing.stripe.com/p/login/...',
        LOB_PROD_KEY: 'live_your_lob_production_api_key_here',
        LOB_ENVIRONMENT: 'live',
        LOB_WEBHOOK_SECRET: 'your_lob_webhook_secret_here',
        AWS_ACCESS_KEY_ID: 'AKIAIOSFODNN7EXAMPLE',
        AWS_SECRET_ACCESS_KEY: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
        AWS_REGION: 'us-east-1',
        AWS_S3_BUCKET: 'postmarkr-files',
        SENTRY_DSN: 'https://your-dsn@sentry.io/project-id',
        SENTRY_RELEASE: 'v1.0.0',
        SENTRY_SERVER_NAME: 'postmarkr-production',
      };

      expect(() => validateEnvironmentVariables()).not.toThrow();
    });

    it('should throw error for missing required variables', () => {
      process.env = {};

      expect(() => validateEnvironmentVariables()).toThrow('Environment variable validation failed');
    });

    it('should throw error for invalid email format', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@host:port/db',
        JWT_SECRET: 'your-super-secret-jwt-key-here-32-chars',
        WASP_WEB_CLIENT_URL: 'https://postmarkr.com',
        WASP_SERVER_URL: 'https://api.postmarkr.com',
        SENDGRID_API_KEY: 'SG.your_sendgrid_api_key_here',
        SENDGRID_FROM_EMAIL: 'invalid-email',
        SENDGRID_FROM_NAME: 'Postmarkr',
        // ... other required vars
      };

      expect(() => validateEnvironmentVariables()).toThrow('SENDGRID_FROM_EMAIL must be a valid email');
    });

    it('should throw error for invalid URL format', () => {
      process.env = {
        DATABASE_URL: 'postgresql://user:pass@host:port/db',
        JWT_SECRET: 'your-super-secret-jwt-key-here-32-chars',
        WASP_WEB_CLIENT_URL: 'not-a-valid-url',
        WASP_SERVER_URL: 'https://api.postmarkr.com',
        // ... other required vars
      };

      expect(() => validateEnvironmentVariables()).toThrow('WASP_WEB_CLIENT_URL must be a valid URL');
    });
  });

  describe('validateEnvironmentVariablesFor', () => {
    it('should be more lenient for development environment', () => {
      process.env = {
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://user:pass@host:port/db',
        JWT_SECRET: 'your-super-secret-jwt-key-here-32-chars',
        WASP_WEB_CLIENT_URL: 'http://localhost:3000',
        WASP_SERVER_URL: 'http://localhost:3001',
      };

      expect(() => validateEnvironmentVariablesFor('development')).not.toThrow();
    });

    it('should require all variables for production environment', () => {
      process.env = {
        NODE_ENV: 'production',
        DATABASE_URL: 'postgresql://user:pass@host:port/db',
        JWT_SECRET: 'your-super-secret-jwt-key-here-32-chars',
        WASP_WEB_CLIENT_URL: 'https://postmarkr.com',
        WASP_SERVER_URL: 'https://api.postmarkr.com',
        // Missing other required variables
      };

      expect(() => validateEnvironmentVariablesFor('production')).toThrow();
    });
  });
});
