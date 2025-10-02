import { getServiceHealthStatus } from './startupValidation';
import { getRequiredEnvironmentVariables, getOptionalEnvironmentVariables } from './envValidation';
import { runAllConnectivityTests } from './apiConnectivityTests';
import { runMonitoringChecks, quickHealthCheck } from './monitoringAlerts';

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
  connectivity?: {
    overall: 'healthy' | 'unhealthy' | 'degraded';
    tests: Array<{
      service: string;
      status: 'healthy' | 'unhealthy' | 'unknown';
      responseTime?: number;
      error?: string;
    }>;
  };
  monitoring?: {
    alerts: number;
    criticalAlerts: number;
    lastCheck: string;
  };
}

/**
 * Performs a comprehensive health check
 */
export async function performHealthCheck(): Promise<HealthCheckResponse> {
  const startTime = process.hrtime();
  const uptime = process.uptime();
  
  // Check environment variables
  const envStatus = checkEnvironmentVariables();
  
  // Check external services
  const services = await getServiceHealthStatus();
  
  // Run API connectivity tests (async)
  let connectivityResults: HealthCheckResponse['connectivity'];
  try {
    const connectivityTests = await runAllConnectivityTests();
    connectivityResults = {
      overall: connectivityTests.overallStatus as 'healthy' | 'unhealthy' | 'degraded',
      tests: connectivityTests.results.map(result => ({
        service: result.service,
        status: result.status as 'healthy' | 'unhealthy' | 'unknown',
        responseTime: result.responseTime,
        error: result.error
      }))
    };
  } catch (error) {
    connectivityResults = {
      overall: 'unhealthy',
      tests: [{
        service: 'connectivity-tests',
        status: 'unhealthy' as 'healthy' | 'unhealthy' | 'unknown',
        error: error instanceof Error ? error.message : 'Connectivity tests failed'
      }]
    };
  }
  
  // Get monitoring status
  let monitoringStatus;
  try {
    const quickCheck = quickHealthCheck();
    monitoringStatus = {
      alerts: quickCheck.alerts,
      criticalAlerts: quickCheck.alerts, // Simplified for now
      lastCheck: quickCheck.timestamp
    };
  } catch (error) {
    monitoringStatus = {
      alerts: 0,
      criticalAlerts: 0,
      lastCheck: new Date().toISOString()
    };
  }
  
  // Determine overall status
  const serviceStatuses = Object.values(services);
  const hasUnhealthyServices = serviceStatuses.some(s => s.status === 'unhealthy');
  const hasUnknownServices = serviceStatuses.some(s => s.status === 'unknown');
  
  let overallStatus: 'healthy' | 'unhealthy' | 'degraded' = 'healthy';
  if (hasUnhealthyServices || connectivityResults.overall === 'unhealthy') {
    overallStatus = 'unhealthy';
  } else if (hasUnknownServices || connectivityResults.overall === 'degraded') {
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
    connectivity: connectivityResults,
    monitoring: monitoringStatus,
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

/**
 * Health check endpoint handler for Express routes
 */
export async function healthCheckEndpoint(req: any, res: any, context: any) {
  try {
    const healthData = await performHealthCheck();
    res.status(200).json(healthData);
  } catch (error) {
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      message: 'Health check failed'
    });
  }
}