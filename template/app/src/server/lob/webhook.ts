import { type MiddlewareConfigFn, HttpError } from 'wasp/server';
import { updateMailPieceStatus } from '../../mail/operations';
import { emailSender } from 'wasp/server/email';
import express from 'express';
import crypto from 'crypto';
import { requireNodeEnvVar } from '../utils';
import { mapLobStatus } from '../../shared/statusMapping';

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

// Error tracking for alerting
const WEBHOOK_ERROR_THRESHOLD = 5; // Alert after 5 consecutive failures
let consecutiveErrors = 0;

// Metrics persistence configuration
const METRICS_PERSIST_INTERVAL = 10; // Persist metrics every 10 events
let eventsSinceLastPersist = 0;

/**
 * Persist webhook metrics to database
 * Called periodically to avoid losing metrics on server restart
 */
async function persistWebhookMetrics(context: any) {
  try {
    const metricsData = {
      source: 'lob',
      totalEvents: webhookMetrics.totalEvents,
      successfulEvents: webhookMetrics.successfulEvents,
      failedEvents: webhookMetrics.failedEvents,
      averageProcessingTime: webhookMetrics.averageProcessingTime,
      eventsByType: webhookMetrics.eventsByType,
      lastProcessedAt: webhookMetrics.lastProcessedAt,
    };

    // Upsert metrics (update if exists for 'lob', create if not)
    const existingMetrics = await context.entities.WebhookMetrics.findFirst({
      where: { source: 'lob' }
    });

    if (existingMetrics) {
      await context.entities.WebhookMetrics.update({
        where: { id: existingMetrics.id },
        data: metricsData
      });
    } else {
      await context.entities.WebhookMetrics.create({
        data: metricsData
      });
    }
    
    console.log('📊 Webhook metrics persisted to database');
  } catch (error) {
    console.error('Failed to persist webhook metrics:', error);
    // Don't throw - metrics persistence failure shouldn't break webhook processing
  }
}

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
    const internalStatus = mapLobStatus(status, 'unknown');

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
    
    // Reset consecutive errors on success
    consecutiveErrors = 0;
    
    // Persist metrics periodically
    eventsSinceLastPersist++;
    if (eventsSinceLastPersist >= METRICS_PERSIST_INTERVAL) {
      await persistWebhookMetrics(context);
      eventsSinceLastPersist = 0;
    }

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
    
    // Track consecutive errors for alerting
    consecutiveErrors++;
    
    // Send alert email if error threshold is reached
    if (consecutiveErrors >= WEBHOOK_ERROR_THRESHOLD) {
      const adminEmail = process.env.ADMIN_ALERT_EMAIL || 'nathan@postmarkr.com';
      const errorRate = Math.round((webhookMetrics.failedEvents / webhookMetrics.totalEvents) * 100);
      
      try {
        await emailSender.send({
          to: adminEmail,
          subject: '🚨 Lob Webhook Failures Detected',
          text: `
WARNING: ${consecutiveErrors} consecutive Lob webhook failures detected.

Error Rate: ${errorRate}%
Total Events: ${webhookMetrics.totalEvents}
Failed Events: ${webhookMetrics.failedEvents}

Latest Error: ${err instanceof Error ? err.message : String(err)}

Check logs for details and investigate immediately.
          `,
          html: `
<h2>🚨 Lob Webhook Failures Detected</h2>
<p><strong>WARNING:</strong> ${consecutiveErrors} consecutive webhook failures.</p>
<ul>
  <li><strong>Error Rate:</strong> ${errorRate}%</li>
  <li><strong>Total Events:</strong> ${webhookMetrics.totalEvents}</li>
  <li><strong>Failed Events:</strong> ${webhookMetrics.failedEvents}</li>
</ul>
<p><strong>Latest Error:</strong> ${err instanceof Error ? err.message : String(err)}</p>
<p>Check server logs for details and investigate immediately.</p>
          `
        });
        
        console.log(`📧 Alert email sent to ${adminEmail} after ${consecutiveErrors} consecutive webhook failures`);
        
        // Reset counter after sending alert to avoid spam
        consecutiveErrors = 0;
      } catch (emailError) {
        console.error('Failed to send webhook error alert email:', emailError);
      }
    }

    console.error(`Webhook ${webhookId || 'unknown'} error (${consecutiveErrors} consecutive):`, {
      error: err,
      lobId,
      eventType,
      processingTimeMs: processingTime,
      consecutiveErrors,
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
 * Webhook metrics endpoint (admin only)
 * Returns both in-memory and persisted metrics
 */
export const webhookMetricsEndpoint = async (request: express.Request, response: express.Response, context?: any) => {
  try {
    // Require admin authentication
    if (!context?.user?.isAdmin) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required to view webhook metrics'
      });
    }
    
    // Get persisted metrics from database
    const persistedMetrics = await context.entities.WebhookMetrics.findFirst({
      where: { source: 'lob' }
    });
    
    return response.status(200).json({
      current: webhookMetrics, // In-memory metrics (current session)
      persisted: persistedMetrics, // Database metrics (historical)
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
 * Webhook events endpoint (admin only, for debugging)
 */
export const webhookEventsEndpoint = async (request: express.Request, response: express.Response, context: any) => {
  try {
    // Require admin authentication
    if (!context?.user?.isAdmin) {
      return response.status(403).json({
        error: 'Forbidden',
        message: 'Admin access required to view webhook events'
      });
    }
    
    const { limit, offset, lobId, eventType, success } = request.query;
    
    // Parse and validate pagination parameters
    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100); // Max 100 items
    const parsedOffset = parseInt(offset as string, 10) || 0;
    
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

    // Get total count for pagination metadata
    const totalCount = await context.entities.MailPieceStatusHistory.count({
      where: whereClause
    });

    const events = await context.entities.MailPieceStatusHistory.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      skip: parsedOffset,
      take: parsedLimit,
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
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount,
        currentPage: Math.floor(parsedOffset / parsedLimit) + 1,
        totalPages: Math.ceil(totalCount / parsedLimit)
      },
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
