/**
 * Health check endpoint for monitoring environment variables and external services
 */
export interface HealthCheckResponse {
    status: 'healthy' | 'unhealthy' | 'degraded';
    timestamp: string;
    environment: string;
    version: string;
    services: Record<string, {
        status: 'healthy' | 'unhealthy' | 'unknown';
        message?: string;
    }>;
    environmentVariables: {
        required: Record<string, {
            configured: boolean;
            message?: string;
        }>;
        optional: Record<string, {
            configured: boolean;
            value?: string;
        }>;
    };
    uptime: number;
}
/**
 * Performs a comprehensive health check
 */
export declare function performHealthCheck(): HealthCheckResponse;
/**
 * Simple health check for basic monitoring
 */
export declare function simpleHealthCheck(): {
    status: 'ok' | 'error';
    timestamp: string;
};
//# sourceMappingURL=healthCheck.d.ts.map