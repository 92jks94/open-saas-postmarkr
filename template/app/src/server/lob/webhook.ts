import { HttpError } from 'wasp/server';
import { updateMailPieceStatus } from '../../mail/operations';

/**
 * Handle Lob webhook for mail piece status updates
 */
export async function handleLobWebhook(req: any, res: any, context: any) {
  try {
    const payload = req.body;
    
    // Verify webhook signature (TODO: implement signature verification)
    // const signature = req.headers['x-lob-signature'];
    // if (!verifyWebhookSignature(payload, signature)) {
    //   throw new HttpError(401, 'Invalid webhook signature');
    // }

    // Extract mail piece data from webhook payload
    const { 
      id: lobId, 
      status, 
      tracking_number,
      events 
    } = payload;

    if (!lobId || !status) {
      throw new HttpError(400, 'Missing required webhook data');
    }

    // Update mail piece status in database
    await updateMailPieceStatus({
      lobId,
      lobStatus: status,
      lobTrackingNumber: tracking_number,
      lobData: events,
    }, context);

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Lob webhook error:', error);
    
    if (error instanceof HttpError) {
      res.status(error.statusCode).json({ error: error.message });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}

/**
 * Verify Lob webhook signature
 * TODO: Implement signature verification
 */
function verifyWebhookSignature(payload: any, signature: string): boolean {
  // TODO: Implement Lob webhook signature verification
  // This should verify the webhook came from Lob using their signing secret
  return true; // For now, always return true
}
