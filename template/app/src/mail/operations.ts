// ============================================================================
// MAIL SYSTEM OPERATIONS
// ============================================================================
// This file contains all server-side operations for the physical mail system.
// It handles the complete mail lifecycle from creation to delivery tracking.
//
// Key Integration Points:
// - Stripe API: Payment processing for mail pieces
// - Lob API: Physical mail printing and delivery services
// - Prisma: Database operations for mail pieces, addresses, and files
// - Wasp: Authentication, validation, and operation framework
//
// Mail Lifecycle Flow:
// 1. createMailPiece -> createMailPaymentIntent -> confirmMailPayment -> submitMailPieceToLob
// 2. updateMailPieceStatus (webhook) -> syncMailPieceStatus

import { HttpError } from 'wasp/server';
import type { 
  GetMailPieces, 
  CreateMailPiece, 
  UpdateMailPieceStatus, 
  BulkDeleteMailPieces, 
  GetMailPiece,
  UpdateMailPiece,
  DeleteMailPiece,
  CreateMailPaymentIntent,
  CreateMailCheckoutSession,
  ConfirmMailPayment,
  RefundMailPayment,
  SubmitMailPieceToLob,
  SyncMailPieceStatus
} from 'wasp/server/operations';
import type { MailPiece, MailAddress, File, MailPieceStatusHistory, User } from 'wasp/entities';
import type { MailPieceWithRelations } from './types';
import { hasFullAccess, hasBetaAccess } from '../beta/accessHelpers';
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
import { 
  createMailPaymentIntent as createMailPaymentIntentService, 
  confirmMailPayment as confirmMailPaymentService, 
  refundMailPayment as refundMailPaymentService 
} from '../server/mail/payments';
import { 
  calculatePricingTier, 
  validateAndCalculatePricing,
  getPageCountErrorMessage 
} from '../server/pricing/pageBasedPricing';
import { createMailPiece as createLobMailPiece, getMailPieceStatus as getLobMailPieceStatus, calculateCost } from '../server/lob/services';

// ============================================================================
// MAIL PIECE CRUD OPERATIONS
// ============================================================================

/**
 * Get all mail pieces for the current user with pagination and filtering support
 * 
 * Supports filtering by status, mail type, and text search across description and addresses.
 * Returns paginated results with metadata for UI pagination controls.
 * 
 * @param args - Query parameters for filtering and pagination
 * @param args.page - Page number (default: 1)
 * @param args.limit - Items per page (max: 100, default: 20)
 * @param args.status - Filter by mail piece status ('all' for no filter)
 * @param args.mailType - Filter by mail type ('all' for no filter)
 * @param args.search - Text search in description and address names
 * @param context - Wasp context with user authentication and entity access
 * @returns Paginated mail pieces with metadata
 * 
 * @throws {HttpError} 401 - If user is not authenticated
 */
type GetMailPiecesInput = {
  page?: number;
  limit?: number;
  status?: string;
  mailType?: string;
  search?: string;
};

export const getMailPieces: GetMailPieces<GetMailPiecesInput, { 
  mailPieces: MailPieceWithRelations[]; 
  total: number; 
  page: number; 
  totalPages: number; 
  hasNext: boolean; 
  hasPrev: boolean; 
}> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  const page = args.page || 1;
  const limit = Math.min(args.limit || 20, 100); // Max 100 items per page
  const skip = (page - 1) * limit;

  // Build where clause
  const where: any = { userId: context.user.id };
  
  if (args.status && args.status !== 'all') {
    where.status = args.status;
  }
  
  if (args.mailType && args.mailType !== 'all') {
    where.mailType = args.mailType;
  }
  
  if (args.search) {
    where.OR = [
      { description: { contains: args.search, mode: 'insensitive' } },
      { senderAddress: { contactName: { contains: args.search, mode: 'insensitive' } } },
      { recipientAddress: { contactName: { contains: args.search, mode: 'insensitive' } } }
    ];
  }

  // Get total count for pagination
  const total = await context.entities.MailPiece.count({ where });

  // Get paginated results
  const mailPieces = await context.entities.MailPiece.findMany({
    where,
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
    skip,
    take: limit,
  });

  const totalPages = Math.ceil(total / limit);
  const hasNext = page < totalPages;
  const hasPrev = page > 1;

  return {
    mailPieces,
    total,
    page,
    totalPages,
    hasNext,
    hasPrev
  };
};

/**
 * Create a new mail piece with comprehensive validation and ownership checks
 * 
 * Validates all inputs, ensures user owns addresses and files, creates mail piece in 'draft' status.
 * This is the first step in the mail creation workflow - payment and Lob submission happen separately.
 * 
 * @param args - Mail piece creation data
 * @param args.mailType - Type of mail (postcard, letter, check, etc.)
 * @param args.mailClass - USPS mail class (first_class, standard, express, priority)
 * @param args.mailSize - Physical dimensions (4x6, 6x9, etc.)
 * @param args.senderAddressId - UUID of sender address (must belong to user)
 * @param args.recipientAddressId - UUID of recipient address (must belong to user)
 * @param args.fileId - Optional UUID of file attachment (must belong to user)
 * @param args.description - Optional description text (max 500 chars)
 * @param context - Wasp context with user authentication and entity access
 * @returns Created mail piece in 'draft' status
 * 
 * @throws {HttpError} 401 - If user is not authenticated
 * @throws {HttpError} 400 - If validation fails or addresses/files not found/owned by user
 * @throws {HttpError} 500 - If database operation fails
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

    // Beta access check
    if (!hasBetaAccess(context.user)) {
      throw new HttpError(403, 'Beta access required to create mail pieces. Please contact support for access.');
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

    // Validate file if provided and get page count
    let pageCount: number | undefined;
    if (validatedInput.fileId) {
      const file = await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user.id },
      });

      if (!file) {
        throw new HttpError(400, validationErrors.FILE_NOT_FOUND);
      }

      // Get page count from file
      pageCount = file.pageCount || undefined;
      
      // Validate page count for pricing
      if (pageCount) {
        const pricingValidation = validateAndCalculatePricing(pageCount);
        if (!pricingValidation.isValid) {
          throw new HttpError(400, pricingValidation.error || 'Invalid page count');
        }
      }
    }

    // Calculate pricing tier and envelope type if page count is available
    let pricingTier: string | undefined;
    let envelopeType: string | undefined;
    let customerPrice: number | undefined;
    
    if (pageCount) {
      const pricing = calculatePricingTier(pageCount);
      pricingTier = pricing.tier;
      envelopeType = pricing.envelopeType;
      customerPrice = pricing.price / 100; // Convert cents to dollars
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
        pageCount: pageCount,
        pricingTier: pricingTier,
        envelopeType: envelopeType,
        customerPrice: customerPrice,
        // Set printing preferences with MVP defaults
        colorPrinting: false, // Default to black & white for MVP
        doubleSided: true,    // Default to double-sided for MVP
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
 * Update mail piece status from Lob webhook notifications
 * 
 * Processes status updates from Lob API webhooks, mapping Lob statuses to internal statuses.
 * Creates status history entries for tracking. Used by webhook endpoint for real-time updates.
 * 
 * @param args - Webhook data from Lob
 * @param args.lobId - Lob's internal ID for the mail piece
 * @param args.lobStatus - Current status from Lob (delivered, returned, in_transit, etc.)
 * @param args.lobTrackingNumber - USPS tracking number if available
 * @param args.lobData - Additional metadata from Lob webhook
 * @param context - Wasp context with entity access
 * @returns Updated mail piece with new status
 * 
 * @throws {HttpError} 404 - If mail piece with lobId not found
 * @throws {HttpError} 400 - If webhook data validation fails
 * @throws {HttpError} 500 - If database update fails
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

export const updateMailPiece: UpdateMailPiece<UpdateMailPieceInput, MailPiece> = async (args, context) => {
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

export const deleteMailPiece: DeleteMailPiece<DeleteMailPieceInput, { success: boolean }> = async (args, context) => {
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

export const getMailPiece: GetMailPiece<GetMailPieceInput, MailPieceWithRelations | null> = async (args, context) => {
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

// ============================================================================
// PAYMENT PROCESSING OPERATIONS
// ============================================================================
// Handles Stripe payment integration for mail pieces:
// - Payment intent creation with cost calculation
// - Payment confirmation and status updates
// - Refund processing for failed or cancelled mail pieces

/**
 * Create Stripe payment intent for mail piece processing
 * 
 * Calculates cost based on mail type, class, and size, then creates a Stripe payment intent.
 * Only works for mail pieces in 'draft' status. Updates mail piece to 'pending_payment' status.
 * 
 * @param args - Payment intent creation data
 * @param args.mailPieceId - UUID of mail piece to create payment for
 * @param context - Wasp context with user authentication and entity access
 * @returns Payment intent details for client-side Stripe integration
 * 
 * @throws {HttpError} 401 - If user is not authenticated
 * @throws {HttpError} 404 - If mail piece not found or not owned by user
 * @throws {HttpError} 400 - If mail piece not in 'draft' status
 * @throws {HttpError} 500 - If Stripe API or cost calculation fails
 */
type CreateMailPaymentIntentInput = {
  mailPieceId: string;
};

export const createMailPaymentIntent: CreateMailPaymentIntent<CreateMailPaymentIntentInput, { paymentIntentId: string; cost: number; clientSecret: string }> = async (args, context) => {
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

    // Validate page count is available
    if (!mailPiece.pageCount) {
      throw new HttpError(400, 'Page count is required for pricing calculation');
    }

    // Create payment intent with page count
    const paymentData = await createMailPaymentIntentService({
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      toAddress: mailPiece.recipientAddress,
      fromAddress: mailPiece.senderAddress,
      pageCount: mailPiece.pageCount,
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to create mail payment intent:', error);
    throw new HttpError(500, 'Failed to create payment intent due to an internal error.');
  }
};

/**
 * Create Stripe Checkout Session for mail piece payment
 * 
 * Creates a Stripe Checkout Session that redirects the user to Stripe's hosted payment page.
 * This is the recommended approach for mail payments as it handles all payment UI and security.
 * 
 * @param args - Checkout session creation data
 * @param args.mailPieceId - UUID of mail piece to create checkout for
 * @param context - Wasp context with user authentication and entity access
 * @returns Checkout session URL for redirect
 * 
 * @throws {HttpError} 401 - If user is not authenticated
 * @throws {HttpError} 404 - If mail piece not found or not owned by user
 * @throws {HttpError} 400 - If mail piece not in 'draft' status
 * @throws {HttpError} 500 - If Stripe API or cost calculation fails
 */
type CreateMailCheckoutSessionInput = {
  mailPieceId: string;
};

export const createMailCheckoutSession: CreateMailCheckoutSession<CreateMailCheckoutSessionInput, { sessionUrl: string; sessionId: string }> = async (args, context) => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Beta access check
    if (!hasBetaAccess(context.user)) {
      throw new HttpError(403, 'Beta access required to create mail pieces. Please contact support for access.');
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

    // Only allow checkout creation for draft status
    if (mailPiece.status !== 'draft') {
      throw new HttpError(400, 'Checkout can only be created for draft mail pieces');
    }

    // Validate page count is available for pricing calculation
    if (!mailPiece.pageCount) {
      throw new HttpError(400, 'Page count is required for pricing calculation');
    }

    // Calculate cost using cost calculation service
    const costData = await calculateCost({
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      toAddress: mailPiece.recipientAddress,
      fromAddress: mailPiece.senderAddress,
      pageCount: mailPiece.pageCount,
    });

    // Create Stripe Checkout Session
    const stripe = require('../../payment/stripe/stripeClient').stripe;
    const DOMAIN = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Mail Piece - ${mailPiece.mailType}`,
              description: `Send ${mailPiece.mailType} via ${mailPiece.mailClass} mail`,
            },
            unit_amount: costData.cost, // Amount in cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${DOMAIN}/mail/checkout?status=success&mail_piece_id=${args.mailPieceId}`,
      cancel_url: `${DOMAIN}/mail/checkout?status=canceled&mail_piece_id=${args.mailPieceId}`,
      metadata: {
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        type: 'mail_payment',
      },
      customer_email: context.user.email ?? undefined,
    });

    if (!session.url) {
      throw new HttpError(500, 'Failed to create checkout session URL');
    }

    // Update mail piece with checkout session ID
    await context.entities.MailPiece.update({
      where: { id: args.mailPieceId },
      data: {
        paymentIntentId: session.id, // Store session ID for reference
        status: 'pending_payment',
      },
    });

    // Create status history entry
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: args.mailPieceId,
        status: 'pending_payment',
        previousStatus: 'draft',
        description: 'Checkout session created',
        source: 'system',
      },
    });

    return {
      sessionUrl: session.url,
      sessionId: session.id,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to create mail checkout session:', error);
    throw new HttpError(500, 'Failed to create checkout session due to an internal error.');
  }
};

/**
 * Confirm payment for mail piece
 */
type ConfirmMailPaymentInput = {
  mailPieceId: string;
  paymentIntentId: string;
};

export const confirmMailPayment: ConfirmMailPayment<ConfirmMailPaymentInput, { success: boolean }> = async (args, context) => {
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to confirm mail payment:', error);
    throw new HttpError(500, 'Failed to confirm payment due to an internal error.');
  }
};

/**
 * Refund payment for mail piece
 */
type RefundMailPaymentInput = {
  mailPieceId: string;
  reason: string;
};

export const refundMailPayment: RefundMailPayment<RefundMailPaymentInput, { success: boolean }> = async (args, context) => {
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to refund mail payment:', error);
    throw new HttpError(500, 'Failed to process refund due to an internal error.');
  }
};

// ============================================================================
// LOB API INTEGRATION OPERATIONS
// ============================================================================
// Handles integration with Lob API for physical mail services:
// - Mail piece submission to Lob for printing and mailing
// - Status synchronization and webhook processing
// - Real-time tracking updates from Lob webhooks

/**
 * Submit mail piece to Lob API for physical mail processing
 * 
 * Sends mail piece data to Lob API for printing and mailing. Only works for mail pieces
 * in 'paid' status. Updates status to 'submitted' and stores Lob ID for tracking.
 * 
 * @param args - Submission data
 * @param args.mailPieceId - UUID of mail piece to submit to Lob
 * @param context - Wasp context with user authentication and entity access
 * @returns Success status and Lob ID for tracking
 * 
 * @throws {HttpError} 401 - If user is not authenticated
 * @throws {HttpError} 404 - If mail piece not found or not owned by user
 * @throws {HttpError} 400 - If mail piece not in 'paid' status
 * @throws {HttpError} 500 - If Lob API submission fails
 */
type SubmitMailPieceToLobInput = {
  mailPieceId: string;
};

export const submitMailPieceToLob: SubmitMailPieceToLob<SubmitMailPieceToLobInput, { success: boolean; lobId?: string }> = async (args, context) => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }

    // Beta access check
    if (!hasBetaAccess(context.user)) {
      throw new HttpError(403, 'Beta access required to create mail pieces. Please contact support for access.');
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
      envelopeType: mailPiece.envelopeType || undefined,
      colorPrinting: mailPiece.colorPrinting ?? false, // Default to black & white for MVP
      doubleSided: mailPiece.doubleSided ?? true, // Default to double-sided for MVP
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to submit mail piece to Lob:', error);
    throw new HttpError(500, 'Failed to submit mail piece to Lob due to an internal error.');
  }
};

/**
 * Sync mail piece status from Lob API
 */
type SyncMailPieceStatusInput = {
  mailPieceId: string;
};

export const syncMailPieceStatus: SyncMailPieceStatus<SyncMailPieceStatusInput, { success: boolean; status?: string }> = async (args, context) => {
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
    const statusMapping: Record<string, string> = {
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
            ...(mailPiece.metadata && typeof mailPiece.metadata === 'object' ? mailPiece.metadata : {}),
            lastSyncedAt: new Date().toISOString(),
            lobData: lobStatus.lobData || {},
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
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to sync mail piece status from Lob:', error);
    throw new HttpError(500, 'Failed to sync mail piece status from Lob due to an internal error.');
  }
};

/**
 * Bulk delete mail pieces (only draft status allowed)
 */
type BulkDeleteMailPiecesInput = {
  mailPieceIds: string[];
};

export const bulkDeleteMailPieces: BulkDeleteMailPieces<BulkDeleteMailPiecesInput, { 
  deletedCount: number; 
  failedIds: string[]; 
}> = async (args, context) => {
  try {
    if (!context.user) {
      throw new HttpError(401, 'Not authorized');
    }

    if (!args.mailPieceIds || args.mailPieceIds.length === 0) {
      throw new HttpError(400, 'No mail piece IDs provided');
    }

    if (args.mailPieceIds.length > 50) {
      throw new HttpError(400, 'Cannot delete more than 50 mail pieces at once');
    }

    const deletedIds: string[] = [];
    const failedIds: string[] = [];

    // Process each mail piece individually to handle errors gracefully
    for (const mailPieceId of args.mailPieceIds) {
      try {
        // Verify ownership and status
        const mailPiece = await context.entities.MailPiece.findFirst({
          where: { 
            id: mailPieceId, 
            userId: context.user.id,
            status: 'draft' // Only allow deletion of draft mail pieces
          }
        });

        if (!mailPiece) {
          failedIds.push(mailPieceId);
          continue;
        }

        // Delete the mail piece (cascade will handle status history)
        await context.entities.MailPiece.delete({
          where: { id: mailPieceId }
        });

        deletedIds.push(mailPieceId);
      } catch (error) {
        console.error(`Failed to delete mail piece ${mailPieceId}:`, error);
        failedIds.push(mailPieceId);
      }
    }

    return {
      deletedCount: deletedIds.length,
      failedIds
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }
    
    // Log unexpected errors
    console.error('Failed to bulk delete mail pieces:', error);
    throw new HttpError(500, 'Failed to bulk delete mail pieces due to an internal error.');
  }
};
