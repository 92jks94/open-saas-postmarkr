import { performHealthCheck, simpleHealthCheck } from './healthCheck';

/**
 * Health check API endpoint
 * GET /health - Returns comprehensive health status
 * GET /health/simple - Returns simple health status
 * GET /health/detailed - Returns health status with system metrics
 */

export async function healthCheckEndpoint(req: any, res: any, context: any) {
  try {
    const { path } = req;
    
    if (path === '/health/simple') {
      // Simple health check for basic monitoring
      const health = simpleHealthCheck();
      res.status(health.status === 'ok' ? 200 : 500).json(health);
    } else if (path === '/health/detailed') {
      // Detailed health check with system metrics
      const health = await performHealthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 500;
      
      // Add system metrics
      const systemMetrics = {
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime(),
        nodeVersion: process.version,
        platform: process.platform,
      };
      
      res.status(statusCode).json({
        ...health,
        system: systemMetrics
      });
    } else {
      // Comprehensive health check - format for monitoring dashboard
      const health = await performHealthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 500;
      
      // Transform to match monitoring dashboard expectations
      const dashboardFormat = {
        status: health.status,
        timestamp: health.timestamp,
        services: health.services,
        uptime: health.uptime,
        version: health.version,
        environment: health.environment,
        environmentVariables: health.environmentVariables,
        connectivity: health.connectivity,
        monitoring: health.monitoring
      };
      
      res.status(statusCode).json(dashboardFormat);
    }
  } catch (error) {
    console.error('Health check error:', error);
    res.status(500).json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: 'Internal server error during health check'
    });
  }
}
