import { HttpError } from 'wasp/server';
import { updateMailPieceStatus } from '../../mail/operations';
import express from 'express';
/**
 * Handle Lob webhook for mail piece status updates
 */
export const lobWebhook = async (request, response, context) => {
    try {
        const payload = JSON.parse(request.body);
        const { id: lobId, status, tracking_number } = payload;
        if (!lobId) {
            throw new HttpError(400, 'Missing required webhook data: lobId');
        }
        // Map Lob status to internal status
        const statusMapping = {
            'delivered': 'delivered',
            'returned': 'returned',
            'returned_to_sender': 'returned',
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
        console.log(`Updated mail piece ${lobId} to status: ${internalStatus}`);
        return response.status(200).json({ received: true });
    }
    catch (err) {
        console.error('Lob webhook error:', err);
        if (err instanceof HttpError) {
            return response.status(err.statusCode).json({ error: err.message });
        }
        else {
            return response.status(400).json({ error: 'Error processing Lob webhook event' });
        }
    }
};
/**
 * Lob webhook middleware configuration
 */
export const lobMiddlewareConfigFn = (middlewareConfig) => {
    middlewareConfig.delete('express.json');
    middlewareConfig.set('express.raw', express.raw({ type: 'application/json' }));
    return middlewareConfig;
};
