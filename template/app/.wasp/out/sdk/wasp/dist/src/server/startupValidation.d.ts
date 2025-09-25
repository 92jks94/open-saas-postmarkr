/**
 * Server startup validation
 * This module handles all validation that should happen when the server starts up
 */
/**
 * Validates the server environment on startup
 * This should be called early in the server initialization process
 */
export declare function validateServerStartup(): void;
/**
 * Health check endpoint data
 * Returns the status of all external services
 */
export declare function getServiceHealthStatus(): Record<string, {
    status: 'healthy' | 'unhealthy' | 'unknown';
    message?: string;
}>;
//# sourceMappingURL=startupValidation.d.ts.map