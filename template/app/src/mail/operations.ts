import { HttpError } from 'wasp/server';
import type { GetMailPieces, CreateMailPiece, UpdateMailPieceStatus } from 'wasp/server/operations';
import type { MailPiece, MailAddress, File, MailPieceStatusHistory } from 'wasp/entities';

/**
 * Get all mail pieces for the current user
 */
export const getMailPieces: GetMailPieces<void, MailPiece[]> = async (_args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  return context.entities.MailPiece.findMany({
    where: { userId: context.user.id },
    include: {
      senderAddress: true,
      recipientAddress: true,
      file: true,
      statusHistory: {
        orderBy: { createdAt: 'desc' },
        take: 5, // Get last 5 status updates
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

/**
 * Create a new mail piece
 */
type CreateMailPieceInput = {
  mailType: string;
  mailClass: string;
  mailSize: string;
  senderAddressId: string;
  recipientAddressId: string;
  fileId?: string;
  description?: string;
};

export const createMailPiece: CreateMailPiece<CreateMailPieceInput, MailPiece> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Validate that addresses belong to the user
  const senderAddress = await context.entities.MailAddress.findFirst({
    where: { id: args.senderAddressId, userId: context.user.id },
  });

  if (!senderAddress) {
    throw new HttpError(400, 'Sender address not found or not owned by user');
  }

  const recipientAddress = await context.entities.MailAddress.findFirst({
    where: { id: args.recipientAddressId, userId: context.user.id },
  });

  if (!recipientAddress) {
    throw new HttpError(400, 'Recipient address not found or not owned by user');
  }

  // Validate file if provided
  if (args.fileId) {
    const file = await context.entities.File.findFirst({
      where: { id: args.fileId, userId: context.user.id },
    });

    if (!file) {
      throw new HttpError(400, 'File not found or not owned by user');
    }
  }

  // Create the mail piece
  const mailPiece = await context.entities.MailPiece.create({
    data: {
      userId: context.user.id,
      mailType: args.mailType,
      mailClass: args.mailClass,
      mailSize: args.mailSize,
      senderAddressId: args.senderAddressId,
      recipientAddressId: args.recipientAddressId,
      fileId: args.fileId,
      description: args.description,
      status: 'draft',
      paymentStatus: 'pending',
    },
  });

  // Create initial status history entry
  await context.entities.MailPieceStatusHistory.create({
    data: {
      mailPieceId: mailPiece.id,
      status: 'draft',
      description: 'Mail piece created',
      source: 'system',
    },
  });

  return mailPiece;
};

/**
 * Update mail piece status (used by webhook)
 */
type UpdateMailPieceStatusInput = {
  lobId: string;
  lobStatus?: string;
  lobTrackingNumber?: string;
  lobData?: any;
};

export const updateMailPieceStatus: UpdateMailPieceStatus<UpdateMailPieceStatusInput, MailPiece> = async (args, context) => {
  // Find the mail piece by Lob ID
  const mailPiece = await context.entities.MailPiece.findFirst({
    where: { lobId: args.lobId },
  });

  if (!mailPiece) {
    throw new HttpError(404, 'Mail piece not found');
  }

  // Update the mail piece
  const updatedMailPiece = await context.entities.MailPiece.update({
    where: { id: mailPiece.id },
    data: {
      lobStatus: args.lobStatus,
      lobTrackingNumber: args.lobTrackingNumber,
      metadata: args.lobData,
      // Update status based on Lob status
      status: args.lobStatus === 'delivered' ? 'delivered' : 
              args.lobStatus === 'returned' ? 'returned' :
              args.lobStatus === 'in_transit' ? 'in_transit' :
              mailPiece.status,
    },
  });

  // Create status history entry
  await context.entities.MailPieceStatusHistory.create({
    data: {
      mailPieceId: mailPiece.id,
      status: args.lobStatus || mailPiece.status,
      previousStatus: mailPiece.status,
      description: `Status updated from Lob: ${args.lobStatus}`,
      source: 'webhook',
      lobData: args.lobData,
    },
  });

  return updatedMailPiece;
};
