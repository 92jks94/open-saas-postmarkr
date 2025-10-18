import { HttpError } from 'wasp/server';
import type { ConfirmMailPayment } from 'wasp/server/operations';
import { verifyStripePaymentStatus, markMailPieceAsPaid } from './helpers/paymentHelpers';
import { scheduleLobSubmissionWithRetry } from './helpers/jobHelpers';
import { createLobLogger } from '../server/lob/logger';

/**
 * Client-side payment confirmation operation
 * This can be called from the frontend after successful payment to ensure processing
 */
type ConfirmMailPaymentInput = {
  mailPieceId: string;
};

export const confirmMailPayment: ConfirmMailPayment<ConfirmMailPaymentInput, { success: boolean; message: string }> = async (args, context) => {
  const logger = createLobLogger('PaymentConfirmation');
  
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    logger.info('Client-side payment confirmation requested', {
      mailPieceId: args.mailPieceId,
      userId: context.user.id,
    });

    // Find the mail piece and verify ownership
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId, userId: context.user.id },
    });

    if (!mailPiece) {
      throw new HttpError(404, 'Mail piece not found');
    }

    // Verify payment with Stripe using centralized helper
    if (!mailPiece.paymentIntentId) {
      throw new HttpError(400, 'No payment intent found for this mail piece');
    }

    const paymentVerification = await verifyStripePaymentStatus(mailPiece.paymentIntentId);

    if (!paymentVerification.isPaid) {
      logger.warn('Payment not completed', {
        mailPieceId: args.mailPieceId,
        stripeStatus: paymentVerification.status,
        paymentType: paymentVerification.paymentType,
      });
      throw new HttpError(400, `Payment not completed. Stripe status: ${paymentVerification.status}`);
    }

    logger.info('Payment verified with Stripe', {
      mailPieceId: args.mailPieceId,
      stripeStatus: paymentVerification.status,
      paymentType: paymentVerification.paymentType,
    });

    // Mark mail piece as paid using centralized helper
    const updateResult = await markMailPieceAsPaid(
      {
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        source: 'client',
        description: 'Payment confirmed via client-side verification',
        additionalData: {
          stripeStatus: paymentVerification.status,
          paymentType: paymentVerification.paymentType,
        },
      },
      context
    );

    // Handle update results
    if (!updateResult.updated) {
      if (updateResult.reason === 'already_processed') {
        logger.info('Mail piece already processed', { mailPieceId: args.mailPieceId });
        return { 
          success: true, 
          message: 'Payment already confirmed and processed' 
        };
      } else if (updateResult.reason === 'race_condition') {
        logger.info('Race condition - processed by another process', { mailPieceId: args.mailPieceId });
        return { 
          success: true, 
          message: 'Mail piece was already processed by another process' 
        };
      }
    }

    // ✅ FIX #2: Use retry helper and throw error on failure for client operations
    // Schedule Lob submission job with automatic retries
    const jobResult = await scheduleLobSubmissionWithRetry(args.mailPieceId, context, 3);
    
    if (!jobResult.success) {
      logger.critical('Failed to schedule Lob submission job after retries', {
        mailPieceId: args.mailPieceId,
        error: jobResult.error,
      });
      
      // For client operations, throw error immediately
      throw new HttpError(
        503, 
        'Payment confirmed but unable to schedule mail processing. Our team has been notified and will process your order manually within 1 hour.'
      );
    }

    logger.info('Payment confirmation completed successfully', { mailPieceId: args.mailPieceId });

    return { 
      success: true, 
      message: 'Payment confirmed and mail piece submitted for processing' 
    };

  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    logger.error('Failed to confirm mail payment', {
      mailPieceId: args.mailPieceId,
      error: error instanceof Error ? error.message : String(error),
    });
    throw new HttpError(500, 'Failed to confirm payment due to an internal error.');
  }
};
