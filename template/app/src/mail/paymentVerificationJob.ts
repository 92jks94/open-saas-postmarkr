import { HttpError } from 'wasp/server';
import { verifyStripePaymentStatus, markMailPieceAsPaid } from './helpers/paymentHelpers';
import { scheduleLobSubmission } from './helpers/jobHelpers';
import { getLobJobConfig } from '../server/lob/config';
import { createLobLogger } from '../server/lob/logger';

/**
 * Background job to verify payment status for stuck mail pieces
 * This runs every 5 minutes to catch webhook failures
 */
export async function verifyPaymentStatus(
  args: {},
  context: any
) {
  const logger = createLobLogger('PaymentVerificationJob');
  const config = getLobJobConfig('paymentVerification');
  
  try {
    logger.info('Starting payment verification job');
    
    // Find mail pieces that are stuck in pending_payment status
    // but have a payment intent ID (indicating payment was attempted)
    const lookbackTime = new Date(Date.now() - ('lookbackHours' in config ? config.lookbackHours : 24) * 60 * 60 * 1000);
    
    const stuckMailPieces = await context.entities.MailPiece.findMany({
      where: {
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentIntentId: {
          not: null
        },
        createdAt: {
          gte: lookbackTime
        }
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    logger.info(`Found potentially stuck mail pieces`, {
      count: stuckMailPieces.length,
      lookbackHours: 'lookbackHours' in config ? config.lookbackHours : 24,
    });

    let verifiedCount = 0;
    let errorCount = 0;

    for (const mailPiece of stuckMailPieces) {
      try {
        logger.debug('Verifying payment for mail piece', {
          mailPieceId: mailPiece.id,
          paymentIntentId: mailPiece.paymentIntentId,
        });
        
        // Verify payment status using centralized helper
        const paymentVerification = await verifyStripePaymentStatus(mailPiece.paymentIntentId!);

        if (paymentVerification.isPaid) {
          logger.paymentVerification(mailPiece.id, 'verified', {
            stripeStatus: paymentVerification.status,
            paymentType: paymentVerification.paymentType,
          });
          
          // Mark mail piece as paid using centralized helper
          const updateResult = await markMailPieceAsPaid(
            {
              mailPieceId: mailPiece.id,
              source: 'system',
              description: `Payment verified via background job (Stripe status: ${paymentVerification.status})`,
              additionalData: {
                stripeStatus: paymentVerification.status,
                paymentType: paymentVerification.paymentType,
                verificationJobRun: new Date().toISOString(),
              },
            },
            context
          );

          if (updateResult.updated) {
            // Schedule Lob submission job using centralized helper
            const jobResult = await scheduleLobSubmission(mailPiece.id, context);
            
            if (!jobResult.success) {
              logger.nonCriticalError('Failed to schedule Lob submission', jobResult.error, {
                mailPieceId: mailPiece.id,
              });
            }

            verifiedCount++;
          } else {
            logger.info('Mail piece already processed', {
              mailPieceId: mailPiece.id,
              reason: updateResult.reason,
            });
          }
        } else {
          logger.paymentVerification(mailPiece.id, 'pending', {
            stripeStatus: paymentVerification.status,
            paymentType: paymentVerification.paymentType,
          });
        }
      } catch (error) {
        logger.error('Error verifying payment for mail piece', {
          mailPieceId: mailPiece.id,
          error: error instanceof Error ? error.message : String(error),
        });
        errorCount++;
      }
    }

    logger.info('Payment verification job completed', {
      verifiedCount,
      errorCount,
      totalChecked: stuckMailPieces.length,
    });
    
    return {
      verifiedCount,
      errorCount,
      totalChecked: stuckMailPieces.length
    };
  } catch (error) {
    logger.error('Payment verification job failed', {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
