/**
 * Payment Helper Functions
 * 
 * Centralized payment verification and status management to eliminate code duplication
 * across webhook, payment confirmation, and verification job flows.
 */

import { stripe } from '../../payment/stripe/stripeClient';
import { HttpError, prisma } from 'wasp/server';
import { createLobLogger } from '../../server/lob/logger';

const logger = createLobLogger('PaymentHelpers');

/**
 * Payment verification result
 */
export interface PaymentVerificationResult {
  isPaid: boolean;
  status: string;
  paymentType: 'payment_intent' | 'checkout_session' | 'unknown';
}

/**
 * Verify payment status with Stripe
 * 
 * Tries to verify payment as both a Payment Intent and Checkout Session.
 * This handles both payment flows gracefully.
 * 
 * @param paymentId - Stripe Payment Intent ID or Checkout Session ID
 * @returns Payment verification result
 * @throws {HttpError} If payment cannot be verified with Stripe
 */
export async function verifyStripePaymentStatus(
  paymentId: string
): Promise<PaymentVerificationResult> {
  logger.debug('Verifying payment status with Stripe', { paymentId });
  
  let isPaid = false;
  let stripeStatus = 'unknown';
  let paymentType: PaymentVerificationResult['paymentType'] = 'unknown';

  // First try as payment intent
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentId);
    stripeStatus = paymentIntent.status;
    isPaid = paymentIntent.status === 'succeeded';
    paymentType = 'payment_intent';
    
    logger.debug('Payment Intent verification result', {
      paymentId,
      status: stripeStatus,
      isPaid,
    });
    
    return { isPaid, status: stripeStatus, paymentType };
  } catch (paymentIntentError) {
    logger.debug('Not a Payment Intent, trying Checkout Session', { paymentId });
    
    // If that fails, try as checkout session
    try {
      const session = await stripe.checkout.sessions.retrieve(paymentId);
      stripeStatus = session.payment_status;
      isPaid = session.payment_status === 'paid';
      paymentType = 'checkout_session';
      
      logger.debug('Checkout Session verification result', {
        paymentId,
        status: stripeStatus,
        isPaid,
      });
      
      return { isPaid, status: stripeStatus, paymentType };
    } catch (sessionError) {
      logger.error('Failed to verify payment with Stripe', {
        paymentId,
        paymentIntentError: paymentIntentError instanceof Error ? paymentIntentError.message : String(paymentIntentError),
        sessionError: sessionError instanceof Error ? sessionError.message : String(sessionError),
      });
      
      throw new HttpError(400, 'Could not verify payment status with Stripe');
    }
  }
}

/**
 * Mail piece payment update options
 */
export interface MailPiecePaymentUpdateOptions {
  mailPieceId: string;
  userId?: string;
  source: 'webhook' | 'client' | 'system';
  description?: string;
  additionalData?: Record<string, any>;
  paymentIntentId?: string;  // Stripe payment intent or checkout session ID
}

/**
 * Mail piece payment update result
 */
export interface MailPiecePaymentUpdateResult {
  updated: boolean;
  reason?: 'already_processed' | 'race_condition' | 'not_found' | 'success';
  mailPiece?: any;
}

/**
 * Mark mail piece as paid with race condition prevention
 * 
 * Uses conditional update to prevent duplicate processing.
 * This is the centralized implementation used by webhook, client confirmation,
 * and verification job.
 * 
 * @param options - Update options
 * @param context - Wasp context with entities
 * @returns Update result indicating success or reason for failure
 */
export async function markMailPieceAsPaid(
  options: MailPiecePaymentUpdateOptions,
  context: any
): Promise<MailPiecePaymentUpdateResult> {
  const { mailPieceId, userId, source, description, additionalData, paymentIntentId } = options;
  
  logger.info('Marking mail piece as paid', {
    mailPieceId,
    userId,
    source,
    paymentIntentId,
  });
  
  // Get current mail piece to check status
  const currentMailPiece = await context.entities.MailPiece.findFirst({
    where: userId ? { id: mailPieceId, userId } : { id: mailPieceId }
  });
  
  if (!currentMailPiece) {
    logger.warn('Mail piece not found', { mailPieceId, userId });
    return { updated: false, reason: 'not_found' };
  }
  
  // Check if already processed
  if (currentMailPiece.paymentStatus === 'paid' && currentMailPiece.status === 'paid') {
    logger.info('Mail piece already marked as paid', { mailPieceId });
    return {
      updated: false,
      reason: 'already_processed',
      mailPiece: currentMailPiece,
    };
  }
  
  // Check if already submitted to Lob
  if (currentMailPiece.lobId) {
    logger.warn('Mail piece already submitted to Lob', {
      mailPieceId,
      lobId: currentMailPiece.lobId,
    });
    return {
      updated: false,
      reason: 'already_processed',
      mailPiece: currentMailPiece,
    };
  }
  
  // ✅ FIX #3: Use transaction for atomic updates
  // Perform conditional update with race condition prevention in a transaction
  try {
    await prisma.$transaction(async (tx: any) => {
      const whereClause: any = {
        id: mailPieceId,
        paymentStatus: 'pending',    // Only update if still pending
        status: 'pending_payment',    // Only update if still pending payment
        lobId: null,                  // Only update if not already submitted to Lob
      };
      
      // Add userId if provided (for user-initiated operations)
      if (userId) {
        whereClause.userId = userId;
      }
      
      // Build update data object
      const updateData: any = {
        paymentStatus: 'paid',
        status: 'paid',
      };
      
      // Add paymentIntentId if provided (maintains audit trail to Stripe)
      if (paymentIntentId) {
        updateData.paymentIntentId = paymentIntentId;
      }
      
      const updateResult = await tx.MailPiece.updateMany({
        where: whereClause,
        data: updateData,
      });
      
      // Check if the update succeeded
      if (updateResult.count === 0) {
        throw new Error('RACE_CONDITION');
      }
      
      // Create status history entry (same transaction - atomic)
      await tx.MailPieceStatusHistory.create({
        data: {
          mailPieceId,
          status: 'paid',
          previousStatus: currentMailPiece.status,
          description: description || `Payment confirmed via ${source}`,
          source,
          lobData: additionalData || null,
        },
      });
    });
    
    logger.info('Mail piece marked as paid successfully', {
      mailPieceId,
      previousStatus: currentMailPiece.status,
      source,
    });
    
    // Get updated mail piece
    const updatedMailPiece = await context.entities.MailPiece.findFirst({
      where: { id: mailPieceId }
    });
    
    return {
      updated: true,
      reason: 'success',
      mailPiece: updatedMailPiece,
    };
    
  } catch (error) {
    if (error instanceof Error && error.message === 'RACE_CONDITION') {
      logger.warn('Conditional update failed - mail piece already processed', {
        mailPieceId,
        currentPaymentStatus: currentMailPiece.paymentStatus,
        currentStatus: currentMailPiece.status,
        currentLobId: currentMailPiece.lobId,
      });
      
      return {
        updated: false,
        reason: 'race_condition',
        mailPiece: currentMailPiece,
      };
    }
    
    throw error; // Re-throw unexpected errors
  }
}

/**
 * Check if a mail piece is ready for Lob submission
 * 
 * Validates that all requirements are met before submitting to Lob.
 * 
 * @param mailPieceId - Mail piece ID to check
 * @param context - Wasp context with entities
 * @returns Object with isReady flag and validation errors
 */
export async function validateMailPieceReadyForLob(
  mailPieceId: string,
  context: any
): Promise<{ isReady: boolean; errors: string[] }> {
  const errors: string[] = [];
  
  const mailPiece = await context.entities.MailPiece.findFirst({
    where: { id: mailPieceId },
    include: {
      senderAddress: true,
      recipientAddress: true,
      file: true,
    },
  });
  
  if (!mailPiece) {
    errors.push('Mail piece not found');
    return { isReady: false, errors };
  }
  
  // Check payment status
  if (mailPiece.paymentStatus !== 'paid') {
    errors.push('Payment not completed');
  }
  
  // Check if already submitted
  if (mailPiece.lobId) {
    errors.push('Already submitted to Lob');
  }
  
  // Check required addresses
  if (!mailPiece.senderAddress) {
    errors.push('Sender address missing');
  }
  
  if (!mailPiece.recipientAddress) {
    errors.push('Recipient address missing');
  }
  
  // Check file if required
  if (!mailPiece.file?.key) {
    errors.push('File missing');
  }
  
  return {
    isReady: errors.length === 0,
    errors,
  };
}

