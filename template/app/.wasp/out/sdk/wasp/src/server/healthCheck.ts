import { getServiceHealthStatus } from './startupValidation';
import { getRequiredEnvironmentVariables, getOptionalEnvironmentVariables } from './envValidation';

/**
 * Health check endpoint for monitoring environment variables and external services
 */

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: string;
  environment: string;
  version: string;
  services: Record<string, { status: 'healthy' | 'unhealthy' | 'unknown'; message?: string }>;
  environmentVariables: {
    required: Record<string, { configured: boolean; message?: string }>;
    optional: Record<string, { configured: boolean; value?: string }>;
  };
  uptime: number;
}

/**
 * Performs a comprehensive health check
 */
export function performHealthCheck(): HealthCheckResponse {
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
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasUnhealthyServices) {
    overallStatus = 'unhealthy';
  } else if (hasUnknownServices) {
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
function checkEnvironmentVariables(): {
  required: Record<string, { configured: boolean; message?: string }>;
  optional: Record<string, { configured: boolean; value?: string }>;
} {
  const requiredVars = getRequiredEnvironmentVariables();
  const optionalVars = getOptionalEnvironmentVariables();
  
  const required: Record<string, { configured: boolean; message?: string }> = {};
  const optional: Record<string, { configured: boolean; value?: string }> = {};
  
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
function maskSensitiveValue(varName: string, value: string): string {
  const sensitiveKeys = [
    'SECRET', 'KEY', 'PASSWORD', 'TOKEN', 'DSN'
  ];
  
  const isSensitive = sensitiveKeys.some(key => 
    varName.toUpperCase().includes(key)
  );
  
  if (isSensitive) {
    if (value.length <= 8) {
      return '*'.repeat(value.length);
    } else {
      return value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4);
    }
  }
  
  return value;
}

/**
 * Simple health check for basic monitoring
 */
export function simpleHealthCheck(): { status: 'ok' | 'error'; timestamp: string } {
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
  } catch (error) {
    return {
      status: 'error',
      timestamp: new Date().toISOString()
    };
  }
}
