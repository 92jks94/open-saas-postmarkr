import { HttpError } from 'wasp/server';

/**
 * Background job to monitor webhook health and alert on failures
 * This runs every hour to check for webhook processing issues
 */
export async function monitorWebhookHealth(
  args: {},
  context: any
) {
  try {
    console.log('🔍 Starting webhook health monitoring...');
    
    // Find mail pieces that have been stuck in pending_payment for more than 30 minutes
    const stuckMailPieces = await context.entities.MailPiece.findMany({
      where: {
        status: 'pending_payment',
        paymentStatus: 'pending',
        paymentIntentId: {
          not: null
        },
        createdAt: {
          // Check pieces created more than 30 minutes ago
          lte: new Date(Date.now() - 30 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    if (stuckMailPieces.length > 0) {
      console.warn(`⚠️ Found ${stuckMailPieces.length} mail pieces stuck in pending_payment for >30 minutes`);
      
      // Log details for debugging
      for (const mailPiece of stuckMailPieces) {
        console.warn(`⚠️ Stuck mail piece: ${mailPiece.id}, Payment ID: ${mailPiece.paymentIntentId}, User: ${mailPiece.user.email || 'No email'}, Created: ${mailPiece.createdAt}`);
      }
      
      // In production, you would send alerts here (email, Slack, etc.)
      // For now, we'll just log the issue
    }

    // Check for failed Lob submissions (paid but not submitted)
    const paidButNotSubmitted = await context.entities.MailPiece.findMany({
      where: {
        status: 'paid',
        paymentStatus: 'paid',
        lobId: null,
        createdAt: {
          // Check pieces paid more than 10 minutes ago
          lte: new Date(Date.now() - 10 * 60 * 1000)
        }
      },
      include: {
        user: {
          select: { email: true }
        }
      }
    });

    if (paidButNotSubmitted.length > 0) {
      console.warn(`⚠️ Found ${paidButNotSubmitted.length} paid mail pieces not submitted to Lob for >10 minutes`);
      
      // Log details for debugging
      for (const mailPiece of paidButNotSubmitted) {
        console.warn(`⚠️ Paid but not submitted: ${mailPiece.id}, User: ${mailPiece.user.email || 'No email'}, Paid: ${mailPiece.updatedAt}`);
      }
    }

    console.log(`✅ Webhook health monitoring completed: ${stuckMailPieces.length} stuck payments, ${paidButNotSubmitted.length} unsubmitted`);
    
    return {
      stuckPayments: stuckMailPieces.length,
      unsubmittedPaid: paidButNotSubmitted.length,
      totalChecked: stuckMailPieces.length + paidButNotSubmitted.length
    };
  } catch (error) {
    console.error('❌ Webhook health monitoring failed:', error);
    throw error;
  }
}
