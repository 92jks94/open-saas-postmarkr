import { HttpError } from 'wasp/server';
import type { GetAppSettings, UpdateAppSetting, DebugMailPieces, FixPaidOrders } from 'wasp/server/operations';
import type { AppSettings, MailPiece } from 'wasp/entities';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

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

  // Count draft orders with payment intents (these are the broken ones)
  const draftWithPaymentCount = await context.entities.MailPiece.count({
    where: {
      status: 'draft',
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
  // These are pieces that have a payment intent ID but are still in draft status
  const draftOrdersWithPayment = await context.entities.MailPiece.findMany({
    where: {
      status: 'draft',
      paymentIntentId: {
        not: null
      }
    }
  });

  const results: FixResult[] = [];

  for (const order of draftOrdersWithPayment) {
    try {
      // Update the order
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
          previousStatus: 'draft',
          description: 'Payment status fixed via admin operation',
          source: 'system'
        }
      });

      results.push({
        id: order.id,
        status: 'fixed',
        message: 'Successfully updated to paid status'
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
