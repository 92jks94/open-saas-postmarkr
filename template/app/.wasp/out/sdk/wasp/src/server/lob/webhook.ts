import { HttpError } from 'wasp/server';
import { updateMailPieceStatus } from '../../mail/operations';
import crypto from 'crypto';

/**
 * Handle Lob webhook for mail piece status updates
 */
export async function handleLobWebhook(req: any, res: any, context: any) {
  try {
    const payload = req.body;
    const signature = req.headers['x-lob-signature'];
    
    // Verify webhook signature for security
    if (process.env.NODE_ENV === 'production' && !verifyWebhookSignature(payload, signature)) {
      console.warn('Invalid Lob webhook signature received');
      throw new HttpError(401, 'Invalid webhook signature');
    }

    // Log webhook receipt for debugging
    console.log('Lob webhook received:', {
      lobId: payload.id,
      status: payload.status,
      type: payload.type,
      timestamp: new Date().toISOString(),
    });

    // Extract mail piece data from webhook payload
    const { 
      id: lobId, 
      status, 
      tracking_number,
      events,
      type: mailType,
      expected_delivery_date,
      price,
      url
    } = payload;

    if (!lobId) {
      throw new HttpError(400, 'Missing required webhook data: lobId');
    }

    // Map Lob status to internal status
    const statusMapping: Record<string, string> = {
      'delivered': 'delivered',
      'returned': 'returned',
      'in_transit': 'in_transit',
      'processing': 'submitted',
      'printed': 'submitted',
      'mailed': 'submitted',
      'created': 'submitted',
      'cancelled': 'failed',
      'failed': 'failed',
    };

    const internalStatus = statusMapping[status] || status || 'unknown';

    // Prepare Lob data for storage
    const lobData = {
      status,
      tracking_number,
      events,
      type: mailType,
      expected_delivery_date,
      price,
      url,
      webhook_received_at: new Date().toISOString(),
    };

    // Update mail piece status in database
    await updateMailPieceStatus({
      lobId,
      lobStatus: internalStatus,
      lobTrackingNumber: tracking_number,
      lobData: lobData,
    }, context);

    console.log(`Successfully updated mail piece ${lobId} to status: ${internalStatus}`);

    res.status(200).json({ 
      received: true, 
      lobId, 
      status: internalStatus,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lob webhook error:', error);
    
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ 
        error: error.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  }
}

/**
 * Verify Lob webhook signature using HMAC-SHA256
 */
function verifyWebhookSignature(payload: any, signature: string): boolean {
  try {
    if (!signature) {
      console.warn('No webhook signature provided');
      return false;
    }

    const webhookSecret = process.env.LOB_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.warn('LOB_WEBHOOK_SECRET not configured, skipping signature verification');
      return true; // Allow in development
    }

    // Lob uses HMAC-SHA256 for webhook signatures
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    // Compare signatures securely
    const providedSignature = signature.replace('sha256=', '');
    const isValid = crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(providedSignature, 'hex')
    );

    if (!isValid) {
      console.warn('Webhook signature verification failed', {
        expected: expectedSignature,
        provided: providedSignature,
      });
    }

    return isValid;
  } catch (error) {
    console.error('Error verifying webhook signature:', error);
    return false;
  }
}
