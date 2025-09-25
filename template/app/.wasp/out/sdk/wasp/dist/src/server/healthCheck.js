import { getServiceHealthStatus } from './startupValidation';
import { getRequiredEnvironmentVariables, getOptionalEnvironmentVariables } from './envValidation';
/**
 * Performs a comprehensive health check
 */
export function performHealthCheck() {
    const startTime = process.hrtime();
    const uptime = process.uptime();
    // Check environment variables
    const envStatus = checkEnvironmentVariables();
    // Check external services
    const services = getServiceHealthStatus();
    // Determine overall status
    const serviceStatuses = Object.values(services);
    const hasUnhealthyServices = serviceStatuses.some(s => s.status === 'unhealthy');
    const hasUnknownServices = serviceStatuses.some(s => s.status === 'unknown');
    let overallStatus = 'healthy';
    if (hasUnhealthyServices) {
        overallStatus = 'unhealthy';
    }
    else if (hasUnknownServices) {
        overallStatus = 'degraded';
    }
    return {
        status: overallStatus,
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        version: process.env.SENTRY_RELEASE || 'unknown',
        services,
        environmentVariables: envStatus,
        uptime: Math.floor(uptime),
    };
}
/**
 * Checks the status of all environment variables
 */
function checkEnvironmentVariables() {
    const requiredVars = getRequiredEnvironmentVariables();
    const optionalVars = getOptionalEnvironmentVariables();
    const required = {};
    const optional = {};
    // Check required variables
    for (const varName of requiredVars) {
        const value = process.env[varName];
        required[varName] = {
            configured: !!value,
            message: value ? undefined : `Required environment variable ${varName} is not set`
        };
    }
    // Check optional variables
    for (const varName of optionalVars) {
        const value = process.env[varName];
        optional[varName] = {
            configured: !!value,
            value: value ? maskSensitiveValue(varName, value) : undefined
        };
    }
    return { required, optional };
}
/**
 * Masks sensitive values in environment variables for security
 */
function maskSensitiveValue(varName, value) {
    const sensitiveKeys = [
        'SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'DSN'
    ];
    const isSensitive = sensitiveKeys.some(key => varName.toUpperCase().includes(key));
    if (isSensitive) {
        if (value.length <= 8) {
            return '*'.repeat(value.length);
        }
        else {
            return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
        }
    }
    return value;
}
/**
 * Simple health check for basic monitoring
 */
export function simpleHealthCheck() {
    try {
        // Basic checks
        const hasDatabase = !!process.env.DATABASE_URL;
        const hasJwtSecret = !!process.env.JWT_SECRET;
        if (!hasDatabase || !hasJwtSecret) {
            return {
                status: 'error',
                timestamp: new Date().toISOString()
            };
        }
        return {
            status: 'ok',
            timestamp: new Date().toISOString()
        };
    }
    catch (error) {
        return {
            status: 'error',
            timestamp: new Date().toISOString()
        };
    }
}
//# sourceMappingURL=healthCheck.js.map