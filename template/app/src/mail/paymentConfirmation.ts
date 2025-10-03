import { HttpError } from 'wasp/server';
import { stripe } from '../payment/stripe/stripeClient';
import { submitPaidMailToLob } from './jobs';

/**
 * Client-side payment confirmation operation
 * This can be called from the frontend after successful payment to ensure processing
 */
type ConfirmMailPaymentInput = {
  mailPieceId: string;
};

export const confirmMailPayment: ConfirmMailPayment<ConfirmMailPaymentInput, { success: boolean; message: string }> = async (args, context) => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    // Find the mail piece and verify ownership
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id },
    });

    if (!mailPiece) {
      throw new HttpError(404, 'Mail piece not found');
    }

    // Check if already processed
    if (mailPiece.paymentStatus === 'paid' && mailPiece.status === 'paid') {
      return { 
        success: true, 
        message: 'Payment already confirmed and processed' 
      };
    }

    // Check if already submitted to Lob
    if (mailPiece.lobId) {
      return { 
        success: true, 
        message: 'Mail piece already submitted to Lob' 
      };
    }

    // Verify payment with Stripe
    if (!mailPiece.paymentIntentId) {
      throw new HttpError(400, 'No payment intent found for this mail piece');
    }

    let isPaid = false;
    let stripeStatus = 'unknown';

    try {
      // First try as payment intent
      const paymentIntent = await stripe.paymentIntents.retrieve(mailPiece.paymentIntentId);
      stripeStatus = paymentIntent.status;
      isPaid = paymentIntent.status === 'succeeded';
    } catch (paymentIntentError) {
      // If that fails, try as checkout session
      try {
        const session = await stripe.checkout.sessions.retrieve(mailPiece.paymentIntentId);
        stripeStatus = session.payment_status;
        isPaid = session.payment_status === 'paid';
      } catch (sessionError) {
        throw new HttpError(400, 'Could not verify payment status with Stripe');
      }
    }

    if (!isPaid) {
      throw new HttpError(400, `Payment not completed. Stripe status: ${stripeStatus}`);
    }

    // Update mail piece to paid status using conditional update to prevent race conditions
    const updateResult = await context.entities.MailPiece.updateMany({
      where: { 
        id: args.mailPieceId,
        userId: context.user.id,
        paymentStatus: 'pending', // Only update if still pending
        status: 'pending_payment', // Only update if still pending
        lobId: null // Only update if not already submitted to Lob
      },
      data: {
        paymentStatus: 'paid',
        status: 'paid',
      },
    });

    // Check if the update succeeded (count will be 0 if already processed)
    if (updateResult.count === 0) {
      return { 
        success: true, 
        message: 'Mail piece was already processed by another process' 
      };
    }

    // Create status history entry
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: args.mailPieceId,
        status: 'paid',
        previousStatus: mailPiece.status,
        description: 'Payment confirmed via client-side verification',
        source: 'client',
      },
    });

    // Schedule Lob submission job
    try {
      await submitPaidMailToLob.submit(
        { mailPieceId: args.mailPieceId },
        { 
          retryLimit: 3,
          retryDelay: 60,
          retryBackoff: true
        }
      );
    } catch (jobError) {
      console.error(`Error scheduling Lob submission for ${args.mailPieceId}:`, jobError);
      // Don't fail the operation - job will be retried by background job
    }

    return { 
      success: true, 
      message: 'Payment confirmed and mail piece submitted for processing' 
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    console.error('Failed to confirm mail payment:', error);
    throw new HttpError(500, 'Failed to confirm payment due to an internal error.');
  }
};
