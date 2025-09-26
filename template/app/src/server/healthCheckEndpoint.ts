import { Request, Response } from 'express';
import { performHealthCheck, simpleHealthCheck } from './healthCheck';

/**
 * Health check API endpoint
 * GET /health - Returns comprehensive health status
 * GET /health/simple - Returns simple health status
 */

export async function healthCheckEndpoint(req: Request, res: Response) {
  try {
    const { path } = req;
    
    if (path === '/health/simple') {
      // Simple health check for basic monitoring
      const health = simpleHealthCheck();
      res.status(health.status === 'ok' ? 200 : 500).json(health);
    } else {
      // Comprehensive health check
      const health = await performHealthCheck();
      const statusCode = health.status === 'healthy' ? 200 : 
                        health.status === 'degraded' ? 200 : 500;
      res.status(statusCode).json(health);
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
