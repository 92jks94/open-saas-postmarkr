import { HttpError } from 'wasp/server';
import type { GetMailPieces, CreateMailPiece, UpdateMailPieceStatus } from 'wasp/server/operations';
import type { MailPiece, MailAddress, File, MailPieceStatusHistory } from 'wasp/entities';
import { 
  createMailPieceSchema, 
  updateMailPieceSchema, 
  updateMailPieceStatusSchema,
  lobWebhookStatusSchema,
  validateStatusTransition,
  validateMailPieceOwnership,
  validateAddressOwnership,
  validateFileOwnership,
  validationErrors
} from './validation';

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
 * Create a new mail piece with comprehensive validation
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
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Input validation using Zod schema
    const validatedInput = createMailPieceSchema.parse(args);

    // Validate that addresses belong to the user
    const senderAddress = await context.entities.MailAddress.findFirst({
      where: { id: validatedInput.senderAddressId, userId: context.user.id },
    });

    if (!senderAddress) {
      throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
    }

    const recipientAddress = await context.entities.MailAddress.findFirst({
      where: { id: validatedInput.recipientAddressId, userId: context.user.id },
    });

    if (!recipientAddress) {
      throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
    }

    // Validate file if provided
    if (validatedInput.fileId) {
      const file = await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user.id },
      });

      if (!file) {
        throw new HttpError(400, validationErrors.FILE_NOT_FOUND);
      }
    }

    // Create the mail piece
    const mailPiece = await context.entities.MailPiece.create({
      data: {
        userId: context.user.id,
        mailType: validatedInput.mailType,
        mailClass: validatedInput.mailClass,
        mailSize: validatedInput.mailSize,
        senderAddressId: validatedInput.senderAddressId,
        recipientAddressId: validatedInput.recipientAddressId,
        fileId: validatedInput.fileId,
        description: validatedInput.description,
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    
    // Log unexpected errors
    console.error('Failed to create mail piece:', error);
    throw new HttpError(500, 'Failed to create mail piece due to an internal error.');
  }
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
  try {
    // Validate webhook input
    const validatedInput = lobWebhookStatusSchema.parse(args);

    // Find the mail piece by Lob ID
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { lobId: validatedInput.lobId },
    });

    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }

    // Determine new status based on Lob status
    let newStatus = mailPiece.status;
    if (validatedInput.lobStatus) {
      // Map Lob statuses to internal statuses
      const statusMapping: Record<string, string> = {
        'delivered': 'delivered',
        'returned': 'returned',
        'in_transit': 'in_transit',
        'processing': 'submitted',
        'printed': 'submitted',
        'mailed': 'submitted',
      };
      newStatus = statusMapping[validatedInput.lobStatus] || mailPiece.status;
    }

    // Update the mail piece
    const updatedMailPiece = await context.entities.MailPiece.update({
      where: { id: mailPiece.id },
      data: {
        lobStatus: validatedInput.lobStatus,
        lobTrackingNumber: validatedInput.lobTrackingNumber,
        metadata: validatedInput.lobData,
        status: newStatus,
      },
    });

    // Create status history entry
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: mailPiece.id,
        status: newStatus,
        previousStatus: mailPiece.status,
        description: `Status updated from Lob: ${validatedInput.lobStatus}`,
        source: 'webhook',
        lobData: validatedInput.lobData,
      },
    });

    return updatedMailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    
    // Log unexpected errors
    console.error('Failed to update mail piece status:', error);
    throw new HttpError(500, 'Failed to update mail piece status due to an internal error.');
  }
};

/**
 * Update a mail piece (user operation)
 */
type UpdateMailPieceInput = {
  id: string;
  mailType?: string;
  mailClass?: string;
  mailSize?: string;
  senderAddressId?: string;
  recipientAddressId?: string;
  fileId?: string;
  description?: string;
};

export const updateMailPiece = async (args: UpdateMailPieceInput, context: any): Promise<MailPiece> => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Input validation using Zod schema
    const validatedInput = updateMailPieceSchema.parse(args);

    // Find the mail piece and verify ownership
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: validatedInput.id, userId: context.user.id },
    });

    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }

    // Only allow updates for draft status
    if (mailPiece.status !== 'draft') {
      throw new HttpError(400, 'Mail piece can only be updated in draft status');
    }

    // Validate addresses if provided
    if (validatedInput.senderAddressId) {
      const senderAddress = await context.entities.MailAddress.findFirst({
        where: { id: validatedInput.senderAddressId, userId: context.user.id },
      });
      if (!senderAddress) {
        throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
      }
    }

    if (validatedInput.recipientAddressId) {
      const recipientAddress = await context.entities.MailAddress.findFirst({
        where: { id: validatedInput.recipientAddressId, userId: context.user.id },
      });
      if (!recipientAddress) {
        throw new HttpError(400, validationErrors.ADDRESS_NOT_FOUND);
      }
    }

    // Validate file if provided
    if (validatedInput.fileId) {
      const file = await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user.id },
      });
      if (!file) {
        throw new HttpError(400, validationErrors.FILE_NOT_FOUND);
      }
    }

    // Update the mail piece
    const updatedMailPiece = await context.entities.MailPiece.update({
      where: { id: validatedInput.id },
      data: {
        mailType: validatedInput.mailType,
        mailClass: validatedInput.mailClass,
        mailSize: validatedInput.mailSize,
        senderAddressId: validatedInput.senderAddressId,
        recipientAddressId: validatedInput.recipientAddressId,
        fileId: validatedInput.fileId,
        description: validatedInput.description,
      },
    });

    // Create status history entry
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: updatedMailPiece.id,
        status: 'draft',
        description: 'Mail piece updated',
        source: 'user',
      },
    });

    return updatedMailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      throw new HttpError(400, `Validation error: ${error.message}`);
    }
    
    // Log unexpected errors
    console.error('Failed to update mail piece:', error);
    throw new HttpError(500, 'Failed to update mail piece due to an internal error.');
  }
};

/**
 * Delete a mail piece
 */
type DeleteMailPieceInput = {
  id: string;
};

export const deleteMailPiece = async (args: DeleteMailPieceInput, context: any): Promise<{ success: boolean }> => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Find the mail piece and verify ownership
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.id, userId: context.user.id },
    });

    if (!mailPiece) {
      throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
    }

    // Only allow deletion for draft status
    if (mailPiece.status !== 'draft') {
      throw new HttpError(400, 'Mail piece can only be deleted in draft status');
    }

    // Delete the mail piece (status history will be cascade deleted)
    await context.entities.MailPiece.delete({
      where: { id: args.id },
    });

    return { success: true };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to delete mail piece:', error);
    throw new HttpError(500, 'Failed to delete mail piece due to an internal error.');
  }
};

/**
 * Get a single mail piece by ID
 */
type GetMailPieceInput = {
  id: string;
};

export const getMailPiece = async (args: GetMailPieceInput, context: any): Promise<MailPiece | null> => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Find the mail piece and verify ownership
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: args.id, userId: context.user.id },
      include: {
        senderAddress: true,
        recipientAddress: true,
        file: true,
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return mailPiece;
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to get mail piece:', error);
    throw new HttpError(500, 'Failed to get mail piece due to an internal error.');
  }
};
