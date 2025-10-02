import { HttpError } from 'wasp/server';
import type { GetAppSettings, UpdateAppSetting, DebugMailPieces, FixPaidOrders, DebugMailPieceStatus } from 'wasp/server/operations';
import type { AppSettings, MailPiece } from 'wasp/entities';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { stripe } from '../payment/stripe/stripeClient';

const updateAppSettingInputSchema = z.object({
  key: z.string().nonempty(),
  value: z.string().nonempty(),
});

type UpdateAppSettingInput = z.infer<typeof updateAppSettingInputSchema>;

export const updateAppSetting: UpdateAppSetting<UpdateAppSettingInput, AppSettings> = async (
  rawArgs,
  context
) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  const { key, value } = ensureArgsSchemaOrThrowHttpError(updateAppSettingInputSchema, rawArgs);

  // Upsert the setting
  return context.entities.AppSettings.upsert({
    where: { key },
    update: { value },
    create: {
      key,
      value,
      description: getSettingDescription(key),
    },
  });
};

export const getAppSettings: GetAppSettings<void, AppSettings[]> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  return context.entities.AppSettings.findMany({
    orderBy: { key: 'asc' },
  });
};

function getSettingDescription(key: string): string {
  const descriptions: Record<string, string> = {
    'beta_access_code': 'Beta access code required for new user signups',
    'maintenance_mode': 'Enable/disable maintenance mode for the application',
    'max_file_size_mb': 'Maximum file upload size in megabytes',
    'email_from_name': 'Default sender name for emails',
    'email_from_address': 'Default sender email address',
  };

  return descriptions[key] || 'Application setting';
}

// Admin operation to get mail pieces overview (all users)
type AdminMailPiecesResult = {
  recentMailPieces: any[];
  statusCounts: { status: string; count: number }[];
  paymentCounts: { paymentStatus: string; count: number }[];
  totalCount: number;
  draftWithPaymentCount: number;
};

export const debugMailPieces: DebugMailPieces<void, AdminMailPiecesResult> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  // Get recent mail pieces with details (admin can see all users)
  const recentMailPieces = await context.entities.MailPiece.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      user: {
        select: { email: true }
      },
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 2
      }
    }
  });

  // Get status counts
  const statusCounts = await context.entities.MailPiece.groupBy({
    by: ['status'],
    _count: { status: true }
  });

  // Get payment status counts
  const paymentCounts = await context.entities.MailPiece.groupBy({
    by: ['paymentStatus'],
    _count: { paymentStatus: true }
  });

  // Count draft or pending_payment orders with payment intents (these are the broken ones)
  const draftWithPaymentCount = await context.entities.MailPiece.count({
    where: {
      status: {
        in: ['draft', 'pending_payment']
      },
      paymentIntentId: {
        not: null
      }
    }
  });

  return {
    recentMailPieces,
    statusCounts: statusCounts.map(sc => ({ status: sc.status, count: sc._count.status })),
    paymentCounts: paymentCounts.map(pc => ({ paymentStatus: pc.paymentStatus, count: pc._count.paymentStatus })),
    totalCount: await context.entities.MailPiece.count(),
    draftWithPaymentCount
  };
};

type FixResult = {
  id: string;
  status: 'fixed' | 'error';
  message: string;
};

export const fixPaidOrders: FixPaidOrders<void, { fixedCount: number; errorCount: number; results: FixResult[] }> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  // Find mail pieces that should be marked as paid
  // These are pieces that have a payment intent ID but are still in draft or pending_payment status
  const ordersWithPayment = await context.entities.MailPiece.findMany({
    where: {
      status: {
        in: ['draft', 'pending_payment']
      },
      paymentIntentId: {
        not: null
      }
    }
  });

  const results: FixResult[] = [];

  for (const order of ordersWithPayment) {
    try {
      // Check the actual payment status in Stripe
      let isPaid = false;
      let stripeStatus = 'unknown';
      
      try {
        const paymentIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId!);
        stripeStatus = paymentIntent.status;
        isPaid = paymentIntent.status === 'succeeded';
      } catch (stripeError) {
        // If payment intent lookup fails, try as a checkout session
        try {
          const session = await stripe.checkout.sessions.retrieve(order.paymentIntentId!);
          stripeStatus = session.payment_status;
          isPaid = session.payment_status === 'paid';
        } catch (sessionError) {
          console.error(`Failed to retrieve Stripe data for ${order.id}:`, sessionError);
          results.push({
            id: order.id,
            status: 'error',
            message: 'Could not verify payment status in Stripe'
          });
          continue;
        }
      }

      if (!isPaid) {
        results.push({
          id: order.id,
          status: 'error',
          message: `Payment not completed in Stripe (status: ${stripeStatus})`
        });
        continue;
      }

      // Update the order to paid status
      await context.entities.MailPiece.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentStatus: 'paid'
        }
      });

      // Create status history
      await context.entities.MailPieceStatusHistory.create({
        data: {
          mailPieceId: order.id,
          status: 'paid',
          previousStatus: order.status,
          description: `Payment status fixed via admin operation (Stripe status: ${stripeStatus})`,
          source: 'system'
        }
      });

      results.push({
        id: order.id,
        status: 'fixed',
        message: `Successfully updated to paid status (verified in Stripe: ${stripeStatus})`
      });

    } catch (error: any) {
      results.push({
        id: order.id,
        status: 'error',
        message: error?.message || 'Unknown error occurred'
      });
    }
  }

  return {
    fixedCount: results.filter(r => r.status === 'fixed').length,
    errorCount: results.filter(r => r.status === 'error').length,
    results
  };
};

// Debug operation to check specific mail piece status
type DebugMailPieceStatusInput = {
  mailPieceId: string;
};

type DebugMailPieceStatusResult = {
  mailPiece: any;
  stripeStatus: any;
  webhookLogs: any[];
};

export const debugMailPieceStatus: DebugMailPieceStatus<DebugMailPieceStatusInput, DebugMailPieceStatusResult> = async (args, context) => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    // Admin check
    if (!context.user.isAdmin) {
      throw new HttpError(403, 'Admin access required');
    }

    // Get mail piece details
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.mailPieceId },
      include: {
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        user: {
          select: { email: true }
        }
      },
    });

    if (!mailPiece) {
      throw new HttpError(404, 'Mail piece not found');
    }

    let stripeStatus: any = null;
    if (mailPiece.paymentIntentId) {
      try {
        stripeStatus = await stripe.paymentIntents.retrieve(mailPiece.paymentIntentId);
      } catch (error) {
        console.error('Failed to retrieve Stripe payment intent:', error);
        stripeStatus = { error: error instanceof Error ? error.message : 'Unknown error' };
      }
    }

    // Get recent webhook logs (this would need to be implemented based on your logging system)
    const webhookLogs: any[] = [];

    return {
      mailPiece,
      stripeStatus,
      webhookLogs,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    console.error('Failed to debug mail piece status:', error);
    throw new HttpError(500, 'Failed to debug mail piece status due to an internal error.');
  }
};
