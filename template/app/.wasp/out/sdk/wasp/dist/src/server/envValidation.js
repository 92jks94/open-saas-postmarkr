import { z } from 'zod';
/**
 * Environment variable validation schema for production environment variables
 * This ensures all required production environment variables are present and valid
 */
// Core application environment variables
const coreEnvSchema = z.object({
    DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
    WASP_WEB_CLIENT_URL: z.string().url('WASP_WEB_CLIENT_URL must be a valid URL'),
    WASP_SERVER_URL: z.string().url('WASP_SERVER_URL must be a valid URL'),
});
// Email service (SendGrid) environment variables
const emailEnvSchema = z.object({
    SENDGRID_API_KEY: z.string().min(1, 'SENDGRID_API_KEY is required'),
    SENDGRID_FROM_EMAIL: z.string().email('SENDGRID_FROM_EMAIL must be a valid email'),
    SENDGRID_FROM_NAME: z.string().min(1, 'SENDGRID_FROM_NAME is required'),
});
// Payment processing (Stripe) environment variables
const stripeEnvSchema = z.object({
    STRIPE_SECRET_KEY: z.string().min(1, 'STRIPE_SECRET_KEY is required'),
    STRIPE_PUBLISHABLE_KEY: z.string().min(1, 'STRIPE_PUBLISHABLE_KEY is required'),
    STRIPE_WEBHOOK_SECRET: z.string().min(1, 'STRIPE_WEBHOOK_SECRET is required'),
    STRIPE_CUSTOMER_PORTAL_URL: z.string().url('STRIPE_CUSTOMER_PORTAL_URL must be a valid URL'),
});
// Mail service (Lob) environment variables
const lobEnvSchema = z.object({
    LOB_PROD_KEY: z.string().min(1, 'LOB_PROD_KEY is required for production'),
    LOB_ENVIRONMENT: z.enum(['test', 'live', 'prod'], {
        errorMap: () => ({ message: 'LOB_ENVIRONMENT must be one of: test, live, prod' })
    }),
    LOB_WEBHOOK_SECRET: z.string().min(1, 'LOB_WEBHOOK_SECRET is required'),
});
// File storage (AWS S3) environment variables
const awsEnvSchema = z.object({
    AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS_ACCESS_KEY_ID is required'),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS_SECRET_ACCESS_KEY is required'),
    AWS_REGION: z.string().min(1, 'AWS_REGION is required'),
    AWS_S3_BUCKET: z.string().min(1, 'AWS_S3_BUCKET is required'),
});
// Monitoring & Analytics environment variables
const monitoringEnvSchema = z.object({
    SENTRY_DSN: z.string().url('SENTRY_DSN must be a valid URL'),
    SENTRY_RELEASE: z.string().min(1, 'SENTRY_RELEASE is required'),
    SENTRY_SERVER_NAME: z.string().min(1, 'SENTRY_SERVER_NAME is required'),
});
// Optional environment variables (with defaults)
const optionalEnvSchema = z.object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    PORT: z.string().transform(Number).pipe(z.number().positive()).default('3000'),
    GOOGLE_ANALYTICS_ID: z.string().optional(),
    LOB_TEST_KEY: z.string().optional(),
});
// Development-only environment variables (not required in production)
const developmentEnvSchema = z.object({
    LOB_TEST_KEY: z.string().optional(),
}).optional();
// Complete environment schema
const envSchema = z.object({
    ...coreEnvSchema.shape,
    ...emailEnvSchema.shape,
    ...stripeEnvSchema.shape,
    ...lobEnvSchema.shape,
    ...awsEnvSchema.shape,
    ...monitoringEnvSchema.shape,
    ...optionalEnvSchema.shape,
});
/**
 * Validates all environment variables and returns them in a typed object
 * Throws an error if any required variables are missing or invalid
 */
export function validateEnvironmentVariables() {
    try {
        return envSchema.parse(process.env);
    }
    catch (error) {
        if (error instanceof z.ZodError) {
            const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
            throw new Error(`Environment variable validation failed:\n${errorMessages}`);
        }
        throw error;
    }
}
/**
 * Validates environment variables for a specific environment
 * @param environment - The target environment ('development' | 'production' | 'test')
 */
export function validateEnvironmentVariablesFor(environment) {
    const env = process.env.NODE_ENV || 'development';
    if (environment === 'production') {
        // In production, all variables are required
        return validateEnvironmentVariables();
    }
    else {
        // In development/test, some variables are optional
        const developmentSchema = z.object({
            ...coreEnvSchema.shape,
            ...emailEnvSchema.shape,
            ...stripeEnvSchema.shape,
            ...lobEnvSchema.shape,
            ...awsEnvSchema.shape,
            ...monitoringEnvSchema.shape,
            ...optionalEnvSchema.shape,
        }).partial({
            // Make these optional in development
            SENDGRID_API_KEY: true,
            SENDGRID_FROM_EMAIL: true,
            SENDGRID_FROM_NAME: true,
            STRIPE_SECRET_KEY: true,
            STRIPE_PUBLISHABLE_KEY: true,
            STRIPE_WEBHOOK_SECRET: true,
            STRIPE_CUSTOMER_PORTAL_URL: true,
            LOB_PROD_KEY: true,
            LOB_ENVIRONMENT: true,
            LOB_WEBHOOK_SECRET: true,
            AWS_ACCESS_KEY_ID: true,
            AWS_SECRET_ACCESS_KEY: true,
            AWS_REGION: true,
            AWS_S3_BUCKET: true,
            SENTRY_DSN: true,
            SENTRY_RELEASE: true,
            SENTRY_SERVER_NAME: true,
        });
        try {
            return developmentSchema.parse(process.env);
        }
        catch (error) {
            if (error instanceof z.ZodError) {
                const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n');
                console.warn(`Environment variable validation warnings (${environment}):\n${errorMessages}`);
                // Return partial validation for development
                return process.env;
            }
            throw error;
        }
    }
}
/**
 * Gets a validated environment variable with type safety
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not set
 */
export function getEnvVar(key, defaultValue) {
    const value = process.env[key];
    if (value === undefined) {
        if (defaultValue !== undefined) {
            return defaultValue;
        }
        throw new Error(`Environment variable ${key} is not set and no default value provided`);
    }
    return value;
}
/**
 * Checks if we're running in production
 */
export function isProduction() {
    return process.env.NODE_ENV === 'production';
}
/**
 * Checks if we're running in development
 */
export function isDevelopment() {
    return process.env.NODE_ENV === 'development' || process.env.NODE_ENV === undefined;
}
/**
 * Validates environment variables on server startup
 * Should be called early in the application lifecycle
 */
export function validateEnvironmentOnStartup() {
    try {
        const environment = process.env.NODE_ENV || 'development';
        console.log(`Validating environment variables for ${environment}...`);
        validateEnvironmentVariablesFor(environment);
        console.log('✅ Environment variables validated successfully');
    }
    catch (error) {
        console.error('❌ Environment variable validation failed:', error);
        process.exit(1);
    }
}
/**
 * Gets a list of all required environment variables for documentation
 */
export function getRequiredEnvironmentVariables() {
    return [
        // Core
        'DATABASE_URL',
        'JWT_SECRET',
        'WASP_WEB_CLIENT_URL',
        'WASP_SERVER_URL',
        // Email (SendGrid)
        'SENDGRID_API_KEY',
        'SENDGRID_FROM_EMAIL',
        'SENDGRID_FROM_NAME',
        // Payment (Stripe)
        'STRIPE_SECRET_KEY',
        'STRIPE_PUBLISHABLE_KEY',
        'STRIPE_WEBHOOK_SECRET',
        'STRIPE_CUSTOMER_PORTAL_URL',
        // Mail (Lob)
        'LOB_PROD_KEY',
        'LOB_ENVIRONMENT',
        'LOB_WEBHOOK_SECRET',
        // File Storage (AWS S3)
        'AWS_ACCESS_KEY_ID',
        'AWS_SECRET_ACCESS_KEY',
        'AWS_REGION',
        'AWS_S3_BUCKET',
        // Monitoring (Sentry)
        'SENTRY_DSN',
        'SENTRY_RELEASE',
        'SENTRY_SERVER_NAME',
    ];
}
/**
 * Gets a list of optional environment variables
 */
export function getOptionalEnvironmentVariables() {
    return [
        'NODE_ENV',
        'PORT',
        'GOOGLE_ANALYTICS_ID',
        'LOB_TEST_KEY',
    ];
}
//# sourceMappingURL=envValidation.js.map