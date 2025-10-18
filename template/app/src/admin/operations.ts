import { HttpError } from 'wasp/server';
import type { GetAppSettings, UpdateAppSetting, DebugMailPieces, FixPaidOrders, DebugMailPieceStatus } from 'wasp/server/operations';
import type { AppSettings, MailPiece } from 'wasp/entities';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
import { stripe } from '../payment/stripe/stripeClient';
import { getDownloadFileSignedURLFromS3 } from '../file-upload/s3Utils';
import { createMailPiece } from '../server/lob/services';

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
  status: 'fixed' | 'error' | 'submitted_to_lob';
  message: string;
  lobId?: string;
};

export const fixPaidOrders: FixPaidOrders<void, { fixedCount: number; errorCount: number; submittedToLobCount: number; results: FixResult[] }> = async (_args, context) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins are allowed to perform this operation');
  }

  // Find mail pieces that need fixing:
  // 1. Pieces with payment intent ID but still in draft or pending_payment status (payment fix needed)
  // 2. Pieces that are paid but haven't been submitted to Lob yet (Lob submission needed)
  const ordersWithPayment = await context.entities.MailPiece.findMany({
    where: {
      OR: [
        // Payment fix needed
        {
          status: {
            in: ['draft', 'pending_payment']
          },
          paymentIntentId: {
            not: null
          }
        },
        // Lob submission needed
        {
          status: 'paid',
          paymentStatus: 'paid',
          lobId: null
        }
      ]
    },
    include: {
      senderAddress: true,
      recipientAddress: true,
      file: true,
    }
  });

  const results: FixResult[] = [];

  for (const order of ordersWithPayment) {
    try {
      // Determine what type of fix is needed
      const needsPaymentFix = ['draft', 'pending_payment'].includes(order.status) && order.paymentIntentId;
      const needsLobSubmission = order.status === 'paid' && order.paymentStatus === 'paid' && !order.lobId;

      let isPaid = order.status === 'paid' && order.paymentStatus === 'paid';
      let stripeStatus = 'unknown';

      if (needsPaymentFix) {
        // Handle payment status fix
        
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
      }

      if (needsLobSubmission || (needsPaymentFix && isPaid)) {
        // Handle Lob submission for paid orders
        try {
          // Generate download URL for file (upload URLs are write-only and expire quickly)
          let fileUrl: string | undefined;
          if (order.file?.key) {
            try {
              fileUrl = await getDownloadFileSignedURLFromS3({ key: order.file.key });
              console.log(`📎 [Admin] Generated download URL for file: ${order.file.name}`);
            } catch (error) {
              console.error(`❌ [Admin] Failed to generate download URL for file ${order.file.key}:`, error);
              throw new Error('Failed to prepare file for mailing');
            }
          }
          
          // Prepare data for Lob API
          const lobMailData = {
            to: order.recipientAddress,
            from: order.senderAddress,
            mailType: order.mailType,
            mailClass: order.mailClass,
            mailSize: order.mailSize,
            fileUrl,
            description: order.description || `Mail piece created via Postmarkr - ${order.mailType}`,
            envelopeType: order.envelopeType || undefined,
            colorPrinting: order.colorPrinting ?? false,
            doubleSided: order.doubleSided ?? true,
          };

          // Submit to Lob API
          const lobResponse = await createMailPiece(lobMailData);

          // Update mail piece with Lob information
          await context.entities.MailPiece.update({
            where: { id: order.id },
            data: {
              lobId: lobResponse.id,
              lobStatus: lobResponse.status,
              lobTrackingNumber: lobResponse.trackingNumber,
              status: 'submitted',
              cost: lobResponse.cost / 100,
              metadata: {
                // ✅ PHASE 2 #3: Remove JSON.parse overhead - Prisma handles JSON serialization automatically
                lobData: (lobResponse.lobData || null) as any,
                submittedAt: new Date().toISOString(),
              },
            },
          });

          // Create status history entry
          await context.entities.MailPieceStatusHistory.create({
            data: {
              mailPieceId: order.id,
              status: 'submitted',
              previousStatus: 'paid',
              description: `Submitted to Lob API via admin - ID: ${lobResponse.id}`,
              source: 'system',
              lobData: {
                lobId: lobResponse.id,
                lobStatus: lobResponse.status,
                trackingNumber: lobResponse.trackingNumber,
                submittedAt: new Date().toISOString(),
              },
            },
          });

          results.push({
            id: order.id,
            status: 'submitted_to_lob',
            message: `Successfully submitted to Lob API with ID: ${lobResponse.id}`,
            lobId: lobResponse.id
          });
        } catch (lobError: unknown) {
          const errorMessage = lobError instanceof Error ? lobError.message : 'Unknown error';
          results.push({
            id: order.id,
            status: 'error',
            message: `Lob submission failed: ${errorMessage}`
          });
        }
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      results.push({
        id: order.id,
        status: 'error',
        message: errorMessage
      });
    }
  }

  return {
    fixedCount: results.filter(r => r.status === 'fixed').length,
    errorCount: results.filter(r => r.status === 'error').length,
    submittedToLobCount: results.filter(r => r.status === 'submitted_to_lob').length,
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
