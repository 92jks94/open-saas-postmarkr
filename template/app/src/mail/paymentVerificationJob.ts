import { HttpError } from 'wasp/server';
import { stripe } from '../payment/stripe/stripeClient';
import { submitPaidMailToLob } from 'wasp/server/jobs';

/**
 * Background job to verify payment status for stuck mail pieces
 * This runs every 5 minutes to catch webhook failures
 */
export async function verifyPaymentStatus(
  args: {},
  context: any
) {
  try {
    console.log('🔍 Starting payment verification job...');
    
    // Find mail pieces that are stuck in pending_payment status
    // but have a payment intent ID (indicating payment was attempted)
    const stuckMailPieces = await context.entities.MailPiece.findMany({
      where: {
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentIntentId: {
          not: null
        },
        createdAt: {
          // Only check pieces created in the last 24 hours to avoid old stuck pieces
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    console.log(`📊 Found ${stuckMailPieces.length} potentially stuck mail pieces`);

    let verifiedCount = 0;
    let errorCount = 0;

    for (const mailPiece of stuckMailPieces) {
      try {
        console.log(`🔍 Verifying payment for mail piece ${mailPiece.id} (Payment ID: ${mailPiece.paymentIntentId})`);
        
        let isPaid = false;
        let stripeStatus = 'unknown';

        // Check if it's a checkout session or payment intent
        try {
          // First try as payment intent
          const paymentIntent = await stripe.paymentIntents.retrieve(mailPiece.paymentIntentId!);
          stripeStatus = paymentIntent.status;
          isPaid = paymentIntent.status === 'succeeded';
        } catch (paymentIntentError) {
          // If that fails, try as checkout session
          try {
            const session = await stripe.checkout.sessions.retrieve(mailPiece.paymentIntentId!);
            stripeStatus = session.payment_status;
            isPaid = session.payment_status === 'paid';
          } catch (sessionError) {
            console.error(`❌ Failed to retrieve Stripe data for ${mailPiece.id}:`, sessionError);
            errorCount++;
            continue;
          }
        }

        if (isPaid) {
          console.log(`✅ Payment verified for mail piece ${mailPiece.id} (Stripe status: ${stripeStatus})`);
          
          // Check if already processed to prevent duplicate processing
          if (mailPiece.paymentStatus === 'paid' && mailPiece.status === 'paid') {
            console.log(`ℹ️ Mail piece ${mailPiece.id} already processed, skipping`);
            continue;
          }

          // Update mail piece to paid status using conditional update to prevent race conditions
          const updateResult = await context.entities.MailPiece.updateMany({
            where: { 
              id: mailPiece.id,
              paymentStatus: 'pending', // Only update if still pending
              status: 'pending_payment' // Only update if still pending
            },
            data: {
              paymentStatus: 'paid',
              status: 'paid',
            },
          });

          // Check if the update succeeded (count will be 0 if already processed)
          if (updateResult.count === 0) {
            console.log(`ℹ️ Mail piece ${mailPiece.id} was already processed by another process, skipping`);
            continue;
          }

          // Create status history entry
          await context.entities.MailPieceStatusHistory.create({
            data: {
              mailPieceId: mailPiece.id,
              status: 'paid',
              previousStatus: 'pending_payment',
              description: `Payment verified via background job (Stripe status: ${stripeStatus})`,
              source: 'system',
            },
          });

          // Schedule Lob submission job
          try {
            await submitPaidMailToLob.submit(
              { mailPieceId: mailPiece.id },
              { 
                retryLimit: 3,
                retryDelay: 60,
                retryBackoff: true
              }
            );
            console.log(`📋 Scheduled Lob submission for mail piece ${mailPiece.id}`);
          } catch (jobError) {
            console.error(`❌ Error scheduling Lob submission for ${mailPiece.id}:`, jobError);
          }

          verifiedCount++;
        } else {
          console.log(`⏳ Payment not yet completed for mail piece ${mailPiece.id} (Stripe status: ${stripeStatus})`);
        }
      } catch (error) {
        console.error(`❌ Error verifying payment for mail piece ${mailPiece.id}:`, error);
        errorCount++;
      }
    }

    console.log(`✅ Payment verification job completed: ${verifiedCount} verified, ${errorCount} errors`);
    
    return {
      verifiedCount,
      errorCount,
      totalChecked: stuckMailPieces.length
    };
  } catch (error) {
    console.error('❌ Payment verification job failed:', error);
    throw error;
  }
}
