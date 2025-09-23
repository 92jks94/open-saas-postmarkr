import { HttpError } from 'wasp/server';
import { createMailPieceSchema, updateMailPieceSchema, lobWebhookStatusSchema, validationErrors } from './validation';
import { createMailPaymentIntent as createMailPaymentIntentService, confirmMailPayment as confirmMailPaymentService, refundMailPayment as refundMailPaymentService } from '../server/mail/payments';
import { createMailPiece as createLobMailPiece, getMailPieceStatus as getLobMailPieceStatus } from '../server/lob/services';
/**
 * Get all mail pieces for the current user
 */
export const getMailPieces = async (_args, context) => {
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
export const createMailPiece = async (args, context) => {
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
    }
    catch (error) {
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
export const updateMailPieceStatus = async (args, context) => {
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
            const statusMapping = {
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
    }
    catch (error) {
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
export const updateMailPiece = async (args, context) => {
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
    }
    catch (error) {
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
export const deleteMailPiece = async (args, context) => {
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
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to delete mail piece:', error);
        throw new HttpError(500, 'Failed to delete mail piece due to an internal error.');
    }
};
export const getMailPiece = async (args, context) => {
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
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to get mail piece:', error);
        throw new HttpError(500, 'Failed to get mail piece due to an internal error.');
    }
};
export const createMailPaymentIntent = async (args, context) => {
    try {
        // Authentication check
        if (!context.user) {
            throw new HttpError(401, validationErrors.UNAUTHORIZED);
        }
        // Find the mail piece and verify ownership
        const mailPiece = await context.entities.MailPiece.findFirst({
            where: { id: args.mailPieceId, userId: context.user.id },
            include: {
                senderAddress: true,
                recipientAddress: true,
            },
        });
        if (!mailPiece) {
            throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
        }
        // Only allow payment creation for draft status
        if (mailPiece.status !== 'draft') {
            throw new HttpError(400, 'Payment can only be created for draft mail pieces');
        }
        // Create payment intent
        const paymentData = await createMailPaymentIntentService({
            mailType: mailPiece.mailType,
            mailClass: mailPiece.mailClass,
            mailSize: mailPiece.mailSize,
            toAddress: mailPiece.recipientAddress,
            fromAddress: mailPiece.senderAddress,
        }, context.user.id, context);
        // Update payment intent metadata with mailPieceId
        const stripeClient = require('../../payment/stripe/stripeClient').stripe;
        await stripeClient.paymentIntents.update(paymentData.paymentIntentId, {
            metadata: {
                mailPieceId: args.mailPieceId,
                userId: context.user.id,
                mailType: mailPiece.mailType,
                mailClass: mailPiece.mailClass,
                mailSize: mailPiece.mailSize,
                type: 'mail_payment',
            },
        });
        // Update mail piece with payment intent
        await context.entities.MailPiece.update({
            where: { id: args.mailPieceId },
            data: {
                paymentIntentId: paymentData.paymentIntentId,
                cost: paymentData.cost / 100, // Convert to USD for display
                status: 'pending_payment',
            },
        });
        // Create status history entry
        await context.entities.MailPieceStatusHistory.create({
            data: {
                mailPieceId: args.mailPieceId,
                status: 'pending_payment',
                previousStatus: 'draft',
                description: 'Payment intent created',
                source: 'system',
            },
        });
        // Get client secret from Stripe
        const paymentIntent = await stripeClient.paymentIntents.retrieve(paymentData.paymentIntentId);
        return {
            paymentIntentId: paymentData.paymentIntentId,
            cost: paymentData.cost,
            clientSecret: paymentIntent.client_secret,
        };
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to create mail payment intent:', error);
        throw new HttpError(500, 'Failed to create payment intent due to an internal error.');
    }
};
export const confirmMailPayment = async (args, context) => {
    try {
        // Authentication check
        if (!context.user) {
            throw new HttpError(401, validationErrors.UNAUTHORIZED);
        }
        // Find the mail piece and verify ownership
        const mailPiece = await context.entities.MailPiece.findFirst({
            where: { id: args.mailPieceId, userId: context.user.id },
        });
        if (!mailPiece) {
            throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
        }
        // Verify payment intent matches
        if (mailPiece.paymentIntentId !== args.paymentIntentId) {
            throw new HttpError(400, 'Payment intent does not match mail piece');
        }
        // Confirm payment
        const success = await confirmMailPaymentService(args.paymentIntentId, args.mailPieceId, context);
        return { success };
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to confirm mail payment:', error);
        throw new HttpError(500, 'Failed to confirm payment due to an internal error.');
    }
};
export const refundMailPayment = async (args, context) => {
    try {
        // Authentication check
        if (!context.user) {
            throw new HttpError(401, validationErrors.UNAUTHORIZED);
        }
        // Find the mail piece and verify ownership
        const mailPiece = await context.entities.MailPiece.findFirst({
            where: { id: args.mailPieceId, userId: context.user.id },
        });
        if (!mailPiece) {
            throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
        }
        // Only allow refunds for paid mail pieces
        if (mailPiece.paymentStatus !== 'paid') {
            throw new HttpError(400, 'Refund can only be processed for paid mail pieces');
        }
        if (!mailPiece.paymentIntentId) {
            throw new HttpError(400, 'No payment intent found for this mail piece');
        }
        // Process refund
        const success = await refundMailPaymentService(mailPiece.paymentIntentId, args.mailPieceId, args.reason, context);
        return { success };
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to refund mail payment:', error);
        throw new HttpError(500, 'Failed to process refund due to an internal error.');
    }
};
export const submitMailPieceToLob = async (args, context) => {
    try {
        // Authentication check
        if (!context.user) {
            throw new HttpError(401, validationErrors.UNAUTHORIZED);
        }
        // Find the mail piece and verify ownership
        const mailPiece = await context.entities.MailPiece.findFirst({
            where: { id: args.mailPieceId, userId: context.user.id },
            include: {
                senderAddress: true,
                recipientAddress: true,
                file: true,
            },
        });
        if (!mailPiece) {
            throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
        }
        // Only allow submission for paid mail pieces
        if (mailPiece.paymentStatus !== 'paid') {
            throw new HttpError(400, 'Mail piece must be paid before submission to Lob');
        }
        // Check if already submitted to Lob
        if (mailPiece.lobId) {
            throw new HttpError(400, 'Mail piece already submitted to Lob');
        }
        // Prepare data for Lob API
        const lobMailData = {
            to: mailPiece.recipientAddress,
            from: mailPiece.senderAddress,
            mailType: mailPiece.mailType,
            mailClass: mailPiece.mailClass,
            mailSize: mailPiece.mailSize,
            fileUrl: mailPiece.file?.uploadUrl,
            description: mailPiece.description || `Mail piece created via Postmarkr - ${mailPiece.mailType}`,
        };
        // Submit to Lob API
        const lobResponse = await createLobMailPiece(lobMailData);
        // Update mail piece with Lob information
        await context.entities.MailPiece.update({
            where: { id: args.mailPieceId },
            data: {
                lobId: lobResponse.id,
                lobStatus: lobResponse.status,
                lobTrackingNumber: lobResponse.trackingNumber,
                status: 'submitted',
                cost: lobResponse.cost / 100, // Convert to USD for display
                metadata: {
                    lobData: lobResponse.lobData,
                    submittedAt: new Date().toISOString(),
                },
            },
        });
        // Create status history entry
        await context.entities.MailPieceStatusHistory.create({
            data: {
                mailPieceId: args.mailPieceId,
                status: 'submitted',
                previousStatus: 'paid',
                description: `Submitted to Lob API - ID: ${lobResponse.id}`,
                source: 'system',
                lobData: {
                    lobId: lobResponse.id,
                    lobStatus: lobResponse.status,
                    trackingNumber: lobResponse.trackingNumber,
                    submittedAt: new Date().toISOString(),
                },
            },
        });
        console.log(`Successfully submitted mail piece ${args.mailPieceId} to Lob with ID: ${lobResponse.id}`);
        return {
            success: true,
            lobId: lobResponse.id
        };
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to submit mail piece to Lob:', error);
        throw new HttpError(500, 'Failed to submit mail piece to Lob due to an internal error.');
    }
};
export const syncMailPieceStatus = async (args, context) => {
    try {
        // Authentication check
        if (!context.user) {
            throw new HttpError(401, validationErrors.UNAUTHORIZED);
        }
        // Find the mail piece and verify ownership
        const mailPiece = await context.entities.MailPiece.findFirst({
            where: { id: args.mailPieceId, userId: context.user.id },
        });
        if (!mailPiece) {
            throw new HttpError(404, validationErrors.MAIL_PIECE_NOT_FOUND);
        }
        // Check if mail piece has been submitted to Lob
        if (!mailPiece.lobId) {
            throw new HttpError(400, 'Mail piece has not been submitted to Lob yet');
        }
        // Get current status from Lob API
        const lobStatus = await getLobMailPieceStatus(mailPiece.lobId);
        // Map Lob status to internal status
        const statusMapping = {
            'delivered': 'delivered',
            'returned': 'returned',
            'in_transit': 'in_transit',
            'processing': 'submitted',
            'printed': 'submitted',
            'mailed': 'submitted',
            'created': 'submitted',
            'cancelled': 'failed',
            'failed': 'failed',
        };
        const newStatus = statusMapping[lobStatus.status] || lobStatus.status || mailPiece.status;
        // Update mail piece if status has changed
        if (newStatus !== mailPiece.status) {
            await context.entities.MailPiece.update({
                where: { id: args.mailPieceId },
                data: {
                    status: newStatus,
                    lobStatus: lobStatus.status,
                    lobTrackingNumber: lobStatus.trackingNumber,
                    metadata: {
                        ...mailPiece.metadata,
                        lastSyncedAt: new Date().toISOString(),
                        lobData: lobStatus.lobData,
                    },
                },
            });
            // Create status history entry
            await context.entities.MailPieceStatusHistory.create({
                data: {
                    mailPieceId: args.mailPieceId,
                    status: newStatus,
                    previousStatus: mailPiece.status,
                    description: `Status synced from Lob: ${lobStatus.status}`,
                    source: 'system',
                    lobData: {
                        lobStatus: lobStatus.status,
                        trackingNumber: lobStatus.trackingNumber,
                        syncedAt: new Date().toISOString(),
                    },
                },
            });
            console.log(`Successfully synced mail piece ${args.mailPieceId} status: ${mailPiece.status} -> ${newStatus}`);
        }
        return {
            success: true,
            status: newStatus
        };
    }
    catch (error) {
        if (error instanceof HttpError) {
            throw error;
        }
        // Log unexpected errors
        console.error('Failed to sync mail piece status from Lob:', error);
        throw new HttpError(500, 'Failed to sync mail piece status from Lob due to an internal error.');
    }
};
