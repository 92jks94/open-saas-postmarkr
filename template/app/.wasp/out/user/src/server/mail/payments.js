import { stripe } from '../../payment/stripe/stripeClient';
import { calculateCost } from '../lob/services';
import { HttpError } from 'wasp/server';
/**
 * Create payment intent for mail cost
 */
export async function createMailPaymentIntent(mailSpecs, userId, context) {
    try {
        // Calculate cost using Lob API
        const costData = await calculateCost(mailSpecs);
        // Create Stripe payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: costData.cost, // Amount in cents
            currency: costData.currency.toLowerCase(),
            metadata: {
                userId,
                mailType: mailSpecs.mailType,
                mailClass: mailSpecs.mailClass,
                mailSize: mailSpecs.mailSize,
                type: 'mail_payment',
                // Note: mailPieceId will be added by the calling operation
            },
            automatic_payment_methods: {
                enabled: true,
            },
        });
        return {
            paymentIntentId: paymentIntent.id,
            cost: costData.cost,
        };
    }
    catch (error) {
        console.error('Error creating mail payment intent:', error);
        throw new HttpError(500, 'Failed to create payment intent');
    }
}
/**
 * Confirm payment before Lob submission
 */
export async function confirmMailPayment(paymentIntentId, mailPieceId, context) {
    try {
        // Retrieve payment intent from Stripe
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        if (paymentIntent.status !== 'succeeded') {
            throw new HttpError(400, 'Payment not completed');
        }
        // Update mail piece with payment confirmation
        await context.entities.MailPiece.update({
            where: { id: mailPieceId },
            data: {
                paymentStatus: 'paid',
                paymentIntentId: paymentIntentId,
                status: 'paid',
            },
        });
        // Create status history entry
        await context.entities.MailPieceStatusHistory.create({
            data: {
                mailPieceId: mailPieceId,
                status: 'paid',
                previousStatus: 'pending_payment',
                description: 'Payment confirmed',
                source: 'system',
            },
        });
        return true;
    }
    catch (error) {
        console.error('Error confirming mail payment:', error);
        throw new HttpError(500, 'Failed to confirm payment');
    }
}
/**
 * Handle refunds for failed mail processing
 */
export async function refundMailPayment(paymentIntentId, mailPieceId, reason, context) {
    try {
        // Create refund in Stripe
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            reason: 'requested_by_customer',
            metadata: {
                mailPieceId,
                reason,
            },
        });
        // Update mail piece with refund information
        await context.entities.MailPiece.update({
            where: { id: mailPieceId },
            data: {
                paymentStatus: 'refunded',
                status: 'failed',
            },
        });
        // Create status history entry
        await context.entities.MailPieceStatusHistory.create({
            data: {
                mailPieceId: mailPieceId,
                status: 'failed',
                previousStatus: 'paid',
                description: `Payment refunded: ${reason}`,
                source: 'system',
            },
        });
        return true;
    }
    catch (error) {
        console.error('Error processing mail refund:', error);
        throw new HttpError(500, 'Failed to process refund');
    }
}
