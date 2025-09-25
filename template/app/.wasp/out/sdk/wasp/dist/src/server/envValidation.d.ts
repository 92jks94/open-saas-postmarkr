import { z } from 'zod';
declare const envSchema: z.ZodObject<{
    NODE_ENV: z.ZodDefault<z.ZodEnum<["development", "production", "test"]>>;
    PORT: z.ZodDefault<z.ZodPipeline<z.ZodEffects<z.ZodString, number, string>, z.ZodNumber>>;
    GOOGLE_ANALYTICS_ID: z.ZodOptional<z.ZodString>;
    LOB_TEST_KEY: z.ZodOptional<z.ZodString>;
    SENTRY_DSN: z.ZodString;
    SENTRY_RELEASE: z.ZodString;
    SENTRY_SERVER_NAME: z.ZodString;
    AWS_ACCESS_KEY_ID: z.ZodString;
    AWS_SECRET_ACCESS_KEY: z.ZodString;
    AWS_REGION: z.ZodString;
    AWS_S3_BUCKET: z.ZodString;
    LOB_PROD_KEY: z.ZodString;
    LOB_ENVIRONMENT: z.ZodEnum<["test", "live", "prod"]>;
    LOB_WEBHOOK_SECRET: z.ZodString;
    STRIPE_SECRET_KEY: z.ZodString;
    STRIPE_PUBLISHABLE_KEY: z.ZodString;
    STRIPE_WEBHOOK_SECRET: z.ZodString;
    STRIPE_CUSTOMER_PORTAL_URL: z.ZodString;
    SENDGRID_API_KEY: z.ZodString;
    SENDGRID_FROM_EMAIL: z.ZodString;
    SENDGRID_FROM_NAME: z.ZodString;
    DATABASE_URL: z.ZodString;
    JWT_SECRET: z.ZodString;
    WASP_WEB_CLIENT_URL: z.ZodString;
    WASP_SERVER_URL: z.ZodString;
}, "strip", z.ZodTypeAny, {
    PORT: number;
    DATABASE_URL: string;
    NODE_ENV: "development" | "production" | "test";
    WASP_SERVER_URL: string;
    WASP_WEB_CLIENT_URL: string;
    JWT_SECRET: string;
    SENDGRID_API_KEY: string;
    SENDGRID_FROM_EMAIL: string;
    SENDGRID_FROM_NAME: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_CUSTOMER_PORTAL_URL: string;
    LOB_PROD_KEY: string;
    LOB_ENVIRONMENT: "test" | "live" | "prod";
    LOB_WEBHOOK_SECRET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET: string;
    SENTRY_DSN: string;
    SENTRY_RELEASE: string;
    SENTRY_SERVER_NAME: string;
    GOOGLE_ANALYTICS_ID?: string | undefined;
    LOB_TEST_KEY?: string | undefined;
}, {
    DATABASE_URL: string;
    WASP_SERVER_URL: string;
    WASP_WEB_CLIENT_URL: string;
    JWT_SECRET: string;
    SENDGRID_API_KEY: string;
    SENDGRID_FROM_EMAIL: string;
    SENDGRID_FROM_NAME: string;
    STRIPE_SECRET_KEY: string;
    STRIPE_PUBLISHABLE_KEY: string;
    STRIPE_WEBHOOK_SECRET: string;
    STRIPE_CUSTOMER_PORTAL_URL: string;
    LOB_PROD_KEY: string;
    LOB_ENVIRONMENT: "test" | "live" | "prod";
    LOB_WEBHOOK_SECRET: string;
    AWS_ACCESS_KEY_ID: string;
    AWS_SECRET_ACCESS_KEY: string;
    AWS_REGION: string;
    AWS_S3_BUCKET: string;
    SENTRY_DSN: string;
    SENTRY_RELEASE: string;
    SENTRY_SERVER_NAME: string;
    PORT?: string | undefined;
    NODE_ENV?: "development" | "production" | "test" | undefined;
    GOOGLE_ANALYTICS_ID?: string | undefined;
    LOB_TEST_KEY?: string | undefined;
}>;
export type ValidatedEnv = z.infer<typeof envSchema>;
/**
 * Validates all environment variables and returns them in a typed object
 * Throws an error if any required variables are missing or invalid
 */
export declare function validateEnvironmentVariables(): ValidatedEnv;
/**
 * Validates environment variables for a specific environment
 * @param environment - The target environment ('development' | 'production' | 'test')
 */
export declare function validateEnvironmentVariablesFor(environment: 'development' | 'production' | 'test'): any;
/**
 * Gets a validated environment variable with type safety
 * @param key - The environment variable key
 * @param defaultValue - Optional default value if not set
 */
export declare function getEnvVar<K extends keyof ValidatedEnv>(key: K, defaultValue?: ValidatedEnv[K]): ValidatedEnv[K];
/**
 * Checks if we're running in production
 */
export declare function isProduction(): boolean;
/**
 * Checks if we're running in development
 */
export declare function isDevelopment(): boolean;
/**
 * Validates environment variables on server startup
 * Should be called early in the application lifecycle
 */
export declare function validateEnvironmentOnStartup(): void;
/**
 * Gets a list of all required environment variables for documentation
 */
export declare function getRequiredEnvironmentVariables(): string[];
/**
 * Gets a list of optional environment variables
 */
export declare function getOptionalEnvironmentVariables(): string[];
export {};
//# sourceMappingURL=envValidation.d.ts.map