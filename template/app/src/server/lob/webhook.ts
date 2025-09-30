import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { updateMailPieceStatus } from '../../mail/operations';
import express from 'express';
import crypto from 'crypto';
import { requireNodeEnvVar } from '../utils';

// Webhook processing metrics
interface WebhookMetrics {
  totalEvents: number;
  successfulEvents: number;
  failedEvents: number;
  averageProcessingTime: number;
  eventsByType: Record<string, number>;
  lastProcessedAt: Date | null;
}

let webhookMetrics: WebhookMetrics = {
  totalEvents: 0,
  successfulEvents: 0,
  failedEvents: 0,
  averageProcessingTime: 0,
  eventsByType: {},
  lastProcessedAt: null,
};

/**
 * Verify Lob webhook signature using HMAC-SHA256
 */
function verifyLobSignature(
  payload: string,
  signature: string,
  secret: string,
  timestamp: string
): boolean {
  try {
    // Lob uses format: timestamp + "." + raw_body
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(timestamp + '.' + payload)
      .digest('hex');

    // Use constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex')
    );
  } catch (error) {
    console.error('Error verifying Lob signature:', error);
    return false;
  }
}

/**
 * Validate webhook timestamp to prevent replay attacks
 */
function validateTimestamp(timestamp: string): boolean {
  try {
    const webhookTime = parseInt(timestamp, 10) * 1000; // Convert to milliseconds
    const currentTime = Date.now();
    const timeDifference = Math.abs(currentTime - webhookTime);
    
    // Allow 5-minute tolerance (300,000 milliseconds)
    return timeDifference <= 300000;
  } catch (error) {
    console.error('Error validating timestamp:', error);
    return false;
  }
}

/**
 * Handle Lob webhook for mail piece status updates
 */
export const lobWebhook = async (request: express.Request, response: express.Response, context: any) => {
  const startTime = Date.now();
  let webhookId: string | null = null;
  let lobId: string | null = null;
  let eventType: string | null = null;

  try {
    // Get webhook headers
    const signature = request.headers['lob-signature'] as string;
    const timestamp = request.headers['lob-signature-timestamp'] as string;
    const rawBody = request.body.toString();

    // Validate required headers
    if (!signature || !timestamp) {
      throw new HttpError(400, 'Missing required webhook headers: lob-signature, lob-signature-timestamp');
    }

    // Get webhook secret from environment
    const webhookSecret = requireNodeEnvVar('LOB_WEBHOOK_SECRET');

    // Verify signature
    if (!verifyLobSignature(rawBody, signature, webhookSecret, timestamp)) {
      throw new HttpError(401, 'Invalid webhook signature');
    }

    // Validate timestamp
    if (!validateTimestamp(timestamp)) {
      throw new HttpError(401, 'Webhook timestamp too old or invalid');
    }

    // Parse payload
    const payload = JSON.parse(rawBody);
    const { id, status, tracking_number, object } = payload;

    webhookId = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    lobId = id;
    eventType = object ? `${object}.${status}` : 'unknown';

    if (!lobId) {
      throw new HttpError(400, 'Missing required webhook data: id');
    }

    // Check for duplicate processing (idempotency)
    const existingStatus = await context.entities.MailPieceStatusHistory.findFirst({
      where: {
        mailPiece: { lobId },
        status: status,
        source: 'webhook',
        createdAt: {
          gte: new Date(Date.now() - 60000) // Within last minute
        }
      }
    });

    if (existingStatus) {
      console.log(`Webhook ${webhookId}: Duplicate event detected for ${lobId}, skipping`);
      return response.status(200).json({ 
        received: true, 
        webhookId,
        lobId,
        eventType,
        status: 'duplicate',
        message: 'Event already processed'
      });
    }

    // Map Lob status to internal status
    const statusMapping: Record<string, string> = {
      'delivered': 'delivered',
      'returned': 'returned',
      'returned_to_sender': 'returned',
      're-routed': 'in_transit',
      'in_transit': 'in_transit',
      'processing': 'submitted',
      'printed': 'submitted',
      'mailed': 'submitted',
      'created': 'submitted',
      'cancelled': 'failed',
      'failed': 'failed',
    };

    const internalStatus = statusMapping[status] || status || 'unknown';

    // Update mail piece status in database
    await updateMailPieceStatus({
      lobId,
      lobStatus: internalStatus,
      lobTrackingNumber: tracking_number,
      lobData: payload,
    }, context);

    // Update metrics
    const processingTime = Date.now() - startTime;
    webhookMetrics.totalEvents++;
    webhookMetrics.successfulEvents++;
    webhookMetrics.averageProcessingTime = 
      (webhookMetrics.averageProcessingTime * (webhookMetrics.totalEvents - 1) + processingTime) / webhookMetrics.totalEvents;
    webhookMetrics.eventsByType[eventType] = (webhookMetrics.eventsByType[eventType] || 0) + 1;
    webhookMetrics.lastProcessedAt = new Date();

    console.log(`Webhook ${webhookId}: Updated mail piece ${lobId} to status: ${internalStatus} (${processingTime}ms)`);

    return response.status(200).json({ 
      received: true, 
      webhookId,
      lobId,
      eventType,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

  } catch (err) {
    const processingTime = Date.now() - startTime;
    
    // Update metrics
    webhookMetrics.totalEvents++;
    webhookMetrics.failedEvents++;
    webhookMetrics.averageProcessingTime = 
      (webhookMetrics.averageProcessingTime * (webhookMetrics.totalEvents - 1) + processingTime) / webhookMetrics.totalEvents;

    console.error(`Webhook ${webhookId || 'unknown'} error:`, {
      error: err,
      lobId,
      eventType,
      processingTimeMs: processingTime,
      timestamp: new Date().toISOString()
    });

    if (err instanceof HttpError) {
      return response.status(err.statusCode).json({ 
        error: err.message,
        webhookId,
        lobId,
        eventType,
        processingTimeMs: processingTime
      });
    } else {
      return response.status(500).json({ 
        error: 'Internal server error processing webhook',
        webhookId,
        lobId,
        eventType,
        processingTimeMs: processingTime
      });
    }
  }
};


/**
 * Webhook health check endpoint
 */
export const webhookHealthCheck = async (request: express.Request, response: express.Response, context?: any) => {
  try {
    const healthStatus = webhookMetrics.totalEvents > 0 ? 'healthy' : 'degraded';
    const errorRate = webhookMetrics.totalEvents > 0 
      ? (webhookMetrics.failedEvents / webhookMetrics.totalEvents) * 100 
      : 0;

    const status = errorRate > 50 ? 'unhealthy' : healthStatus;

    return response.status(200).json({
      status,
      message: status === 'healthy' ? 'Webhook system is operating normally' : 
               status === 'degraded' ? 'Webhook system is operational but no events processed' :
               'Webhook system has high error rate',
      timestamp: new Date().toISOString(),
      metrics: {
        totalEvents: webhookMetrics.totalEvents,
        successfulEvents: webhookMetrics.successfulEvents,
        failedEvents: webhookMetrics.failedEvents,
        errorRate: Math.round(errorRate * 100) / 100,
        averageProcessingTime: Math.round(webhookMetrics.averageProcessingTime),
        eventsByType: webhookMetrics.eventsByType,
        lastProcessedAt: webhookMetrics.lastProcessedAt
      }
    });
  } catch (error) {
    console.error('Health check error:', error);
    return response.status(500).json({
      status: 'unhealthy',
      message: 'Health check failed',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * Webhook metrics endpoint
 */
export const webhookMetricsEndpoint = async (request: express.Request, response: express.Response, context?: any) => {
  try {
    return response.status(200).json({
      metrics: webhookMetrics,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Metrics endpoint error:', error);
    return response.status(500).json({
      error: 'Failed to retrieve metrics',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Webhook events endpoint (for debugging)
 */
export const webhookEventsEndpoint = async (request: express.Request, response: express.Response, context: any) => {
  try {
    const { limit = 50, lobId, eventType, success } = request.query;
    
    const whereClause: any = {
      source: 'webhook'
    };

    if (lobId) {
      whereClause.mailPiece = { lobId };
    }

    if (eventType) {
      whereClause.description = { contains: eventType };
    }

    if (success !== undefined) {
      const isSuccess = success === 'true';
      if (isSuccess) {
        whereClause.status = { not: 'failed' };
      } else {
        whereClause.status = 'failed';
      }
    }

    const events = await context.entities.MailPieceStatusHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string, 10),
      include: {
        mailPiece: {
          select: {
            id: true,
            lobId: true,
            description: true
          }
        }
      }
    });

    return response.status(200).json({
      events,
      count: events.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Events endpoint error:', error);
    return response.status(500).json({
      error: 'Failed to retrieve events',
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Lob webhook middleware configuration
 */
export const lobMiddlewareConfigFn: MiddlewareConfigFn = (middlewareConfig) => {
  middlewareConfig.delete('express.json');
  middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
  return middlewareConfig;
};
