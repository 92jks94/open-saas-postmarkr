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
import { AddressPlacement } from '@prisma/client';
import type { MailPieceWithRelations } from './types';
import { hasFullAccess } from '../shared/accessHelpers';
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
import { getThumbnailSignedUrl } from '../file-upload/s3ThumbnailUtils';
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
import { getDownloadFileSignedURLFromS3 } from '../file-upload/s3Utils';
import { stripe } from '../payment/stripe/stripeClient';
import { checkOperationRateLimit } from '../server/rate-limiting/operationRateLimiter';
import { mapLobStatus } from '../shared/statusMapping';
import { sendMailSubmittedEmail, fetchMailPieceForEmail } from '../server/email/mailNotifications';

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
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
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
  
  // Text search with case-insensitive matching
  // NOTE: The 'mode: insensitive' option requires PostgreSQL or MongoDB.
  // It will not work with SQLite. This app uses PostgreSQL (see schema.prisma).
  if (args.search) {
    where.OR = [
      { description: { contains: args.search, mode: 'insensitive' } },
      { senderAddress: { contactName: { contains: args.search, mode: 'insensitive' } } },
      { recipientAddress: { contactName: { contains: args.search, mode: 'insensitive' } } }
    ];
  }

  // Build orderBy clause for server-side sorting
  const validSortFields = ['description', 'status', 'mailType', 'cost', 'createdAt'];
  const orderBy: any = args.sortBy && validSortFields.includes(args.sortBy)
    ? { [args.sortBy]: args.sortDirection || 'asc' }
    : { createdAt: 'desc' }; // Default: newest first

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
    orderBy,
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
  addressPlacement?: 'top_first_page' | 'insert_blank_page';
};

export const createMailPiece: CreateMailPiece<CreateMailPieceInput, MailPiece> = async (args, context) => {
  try {
    // Authentication check
    if (!context.user) {
      throw new HttpError(401, validationErrors.UNAUTHORIZED);
    }


    // Rate limiting: 10 mail pieces per hour
    checkOperationRateLimit('createMailPiece', 'mail', context.user.id);

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
        const pricingValidation = validateAndCalculatePricing(pageCount, validatedInput.addressPlacement);
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
      const pricing = calculatePricingTier(pageCount, validatedInput.addressPlacement);
      pricingTier = pricing.tier;
      envelopeType = pricing.envelopeType;
      customerPrice = pricing.price / 100; // Convert cents to dollars
    }

    // Generate default description if none provided
    const generateDefaultDescription = async () => {
      const file = validatedInput.fileId ? await context.entities.File.findFirst({
        where: { id: validatedInput.fileId, userId: context.user!.id },
      }) : null;
      
      if (file?.name) {
        return `${file.name} to ${recipientAddress.contactName || recipientAddress.companyName || 'recipient'}`;
      }
      
      if (recipientAddress.contactName || recipientAddress.companyName) {
        return `Mail to ${recipientAddress.contactName || recipientAddress.companyName}`;
      }
      
      return `Mail piece (${validatedInput.mailType})`;
    };

    const finalDescription = validatedInput.description || await generateDefaultDescription();

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
        description: finalDescription,
        status: 'draft',
        paymentStatus: 'pending',
        pageCount: pageCount,
        pricingTier: pricingTier,
        envelopeType: envelopeType,
        customerPrice: customerPrice,
        // Set printing preferences with MVP defaults
        colorPrinting: false, // Default to black & white for MVP
        doubleSided: true,    // Default to double-sided for MVP
        addressPlacement: validatedInput.addressPlacement === 'top_first_page' ? AddressPlacement.TOP_FIRST_PAGE : AddressPlacement.INSERT_BLANK_PAGE, // Convert frontend format to enum
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
  trackingData?: {
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    carrier?: string;
    location?: string;
    daysInTransit?: number;
  };
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
      newStatus = mapLobStatus(validatedInput.lobStatus, mailPiece.status);
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

    // Create status history entry with enhanced tracking data
    await context.entities.MailPieceStatusHistory.create({
      data: {
        mailPieceId: mailPiece.id,
        status: newStatus,
        previousStatus: mailPiece.status,
        description: `Status updated from Lob: ${validatedInput.lobStatus}`,
        source: 'webhook',
        lobData: validatedInput.lobData,
        expectedDeliveryDate: validatedInput.trackingData?.expectedDeliveryDate,
        actualDeliveryDate: validatedInput.trackingData?.actualDeliveryDate,
        carrier: validatedInput.trackingData?.carrier,
        location: validatedInput.trackingData?.location,
        daysInTransit: validatedInput.trackingData?.daysInTransit,
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

    // Rate limiting: 5 payment requests per minute
    checkOperationRateLimit('createMailPaymentIntent', 'payment', context.user.id);

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
    await stripe.paymentIntents.update(paymentData.paymentIntentId, {
      metadata: {
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        type: 'mail_payment',
      },
    });

    // Update mail piece with payment intent using conditional update to prevent race conditions
    // This will only update if the status is still 'draft', preventing duplicate payment intents
    const updateResult = await context.entities.MailPiece.updateMany({
      where: { 
        id: args.mailPieceId,
        userId: context.user.id,
        status: 'draft' // Only update if still in draft status
      },
      data: {
        paymentIntentId: paymentData.paymentIntentId,
        cost: paymentData.cost / 100, // Convert to USD for display
        status: 'pending_payment',
      },
    });

    // Check if the update succeeded (count will be 0 if status changed between checks)
    if (updateResult.count === 0) {
      throw new HttpError(409, 'Mail piece status changed during payment creation. Please try again.');
    }

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
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentData.paymentIntentId);

    if (!paymentIntent.client_secret) {
      throw new HttpError(500, 'Failed to retrieve payment intent client secret');
    }

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
// Helper function to display mail class in readable format
function getMailClassDisplay(mailClass: string): string {
  const classes: Record<string, string> = {
    'usps_first_class': 'USPS First Class',
    'usps_express': 'USPS Express',
    'usps_priority': 'USPS Priority',
    'usps_standard': 'USPS Standard',
  };
  return classes[mailClass] || mailClass;
}

type CreateMailCheckoutSessionInput = {
  mailPieceId: string;
};

export const createMailCheckoutSession: CreateMailCheckoutSession<CreateMailCheckoutSessionInput, { sessionUrl: string; sessionId: string }> = async (args, context) => {
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
        file: true, // Include file for thumbnail
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

    // Get thumbnail URL for Stripe product image (if available)
    let thumbnailUrl: string | undefined;
    
    // Enhanced debugging for thumbnail generation
    console.log('📸 Thumbnail Debug:', {
      hasFile: !!mailPiece.file,
      fileId: mailPiece.fileId,
      fileName: mailPiece.file?.name,
      hasThumbnailKey: !!mailPiece.file?.thumbnailKey,
      thumbnailKey: mailPiece.file?.thumbnailKey,
      thumbnailGeneratedAt: mailPiece.file?.thumbnailGeneratedAt
    });
    
    if (mailPiece.file?.thumbnailKey) {
      try {
        thumbnailUrl = await getThumbnailSignedUrl(mailPiece.file.thumbnailKey);
        console.log('✅ Thumbnail URL generated successfully for Stripe checkout');
        console.log('📎 Thumbnail URL:', thumbnailUrl);
      } catch (error) {
        console.error('❌ Failed to get thumbnail URL for Stripe checkout:', error);
        // Continue without thumbnail - not critical
      }
    } else {
      console.warn('⚠️ No thumbnail key found for file - Stripe checkout will not show product image');
      if (mailPiece.file) {
        console.warn('💡 File exists but thumbnailKey is missing. Client may have failed to generate/upload thumbnail.');
      }
    }

    // Build readable descriptions - Stripe doesn't reliably support line breaks
    // So we'll use clear separators and rely on line items for structure
    const formatAddress = (addr: typeof mailPiece.senderAddress) => 
      `${addr.contactName}, ${addr.address_city}, ${addr.address_state}`;

    // Create Stripe Checkout Session
    const DOMAIN = process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000';
    
    // Log checkout session details (dev only)
    if (process.env.NODE_ENV === 'development') {
      console.log('Creating Stripe checkout session:', {
        mailPieceId: args.mailPieceId,
        pageCount: mailPiece.pageCount,
        pricingTier: costData.breakdown.pricingTier,
        hasThumbnail: !!thumbnailUrl,
      });
    }

    // Helper function to truncate strings for Stripe metadata (500 char limit per value)
    const truncateMetadata = (str: string, maxLength: number = 450): string => {
      if (str.length <= maxLength) return str;
      return str.substring(0, maxLength) + '...';
    };
    
    // Helper function to truncate filename for display (100 char limit for readability)
    const truncateFilename = (name: string, maxLength: number = 100): string => {
      if (name.length <= maxLength) return name;
      // Keep file extension visible
      const ext = name.lastIndexOf('.');
      if (ext > 0 && ext > maxLength - 10) {
        const extension = name.substring(ext);
        return name.substring(0, maxLength - extension.length - 3) + '...' + extension;
      }
      return name.substring(0, maxLength - 3) + '...';
    };
    
    // Build dynamic product information for Stripe Checkout
    const recipientName = truncateMetadata(mailPiece.recipientAddress.contactName, 100);
    const fileName = mailPiece.file?.name || 'document';
    const displayFileName = truncateFilename(fileName);
    
    // Create customer-friendly product name with recipient
    const productName = `Physical Mail Delivery to ${recipientName}`;
    
    // Build detailed description with all relevant order details
    const productDescription = `Sending ${mailPiece.pageCount} page${mailPiece.pageCount > 1 ? 's' : ''} ("${displayFileName}") via ${getMailClassDisplay(mailPiece.mailClass)} | ${costData.breakdown.description}`;
    
    // Log Stripe checkout session creation details
    console.log('🛒 Creating Stripe checkout session with:', {
      productName,
      productDescription: productDescription.substring(0, 100) + '...',
      hasThumbnail: !!thumbnailUrl,
      thumbnailUrlPreview: thumbnailUrl ? thumbnailUrl.substring(0, 100) + '...' : 'none',
      amount: costData.cost,
      mailPieceId: args.mailPieceId
    });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDescription,
              // Add thumbnail image of uploaded file if available
              ...(thumbnailUrl && { images: [thumbnailUrl] }),
            },
            unit_amount: costData.cost,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Client reference for easier tracking in Stripe dashboard
      client_reference_id: args.mailPieceId,
      // Use custom_text for address details (single line with clear separators)
      custom_text: {
        submit: {
          message: `From: ${formatAddress(mailPiece.senderAddress)} → To: ${formatAddress(mailPiece.recipientAddress)}`,
        },
      },
      success_url: `${DOMAIN}/mail/checkout?status=success&mail_piece_id=${args.mailPieceId}&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${DOMAIN}/mail/checkout?status=canceled&mail_piece_id=${args.mailPieceId}`,
      metadata: {
        // Core identifiers
        mailPieceId: args.mailPieceId,
        userId: context.user.id,
        type: 'mail_payment',
        
        // Mail specifications
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        pageCount: mailPiece.pageCount?.toString() || '0',
        pricingTier: costData.breakdown.pricingTier,
        envelopeType: costData.breakdown.envelopeType,
        
        // File info (truncated to prevent metadata value limits)
        fileName: truncateMetadata(fileName, 200),
        fileId: mailPiece.fileId || '',
        
        // Addresses (for support/fulfillment) - truncated to stay under 500 char limit
        senderName: truncateMetadata(mailPiece.senderAddress.contactName, 100),
        senderCity: truncateMetadata(mailPiece.senderAddress.address_city, 100),
        senderState: mailPiece.senderAddress.address_state,
        senderZip: mailPiece.senderAddress.address_zip,
        senderAddress: truncateMetadata(
          `${mailPiece.senderAddress.address_line1}, ${mailPiece.senderAddress.address_city}, ${mailPiece.senderAddress.address_state} ${mailPiece.senderAddress.address_zip}`
        ),
        
        recipientName: truncateMetadata(mailPiece.recipientAddress.contactName, 100),
        recipientCity: truncateMetadata(mailPiece.recipientAddress.address_city, 100),
        recipientState: mailPiece.recipientAddress.address_state,
        recipientZip: mailPiece.recipientAddress.address_zip,
        recipientAddress: truncateMetadata(
          `${mailPiece.recipientAddress.address_line1}, ${mailPiece.recipientAddress.address_city}, ${mailPiece.recipientAddress.address_state} ${mailPiece.recipientAddress.address_zip}`
        ),
        
        // Printing options
        colorPrinting: mailPiece.colorPrinting ? 'true' : 'false',
        doubleSided: mailPiece.doubleSided ? 'true' : 'false',
        addressPlacement: mailPiece.addressPlacement,
        
        // Cost breakdown for reference
        totalCost: (costData.cost / 100).toFixed(2),
        pricePerPage: (costData.cost / 100 / mailPiece.pageCount).toFixed(2),
      },
      customer_email: context.user.email ?? undefined,
    });

    if (!session.url) {
      throw new HttpError(500, 'Failed to create checkout session URL');
    }

    // Update mail piece with checkout session ID using conditional update to prevent race conditions
    // This will only update if the status is still 'draft', preventing duplicate checkout sessions
    const updateResult = await context.entities.MailPiece.updateMany({
      where: { 
        id: args.mailPieceId,
        userId: context.user.id,
        status: 'draft' // Only update if still in draft status
      },
      data: {
        paymentIntentId: session.id, // Store session ID for reference
        status: 'pending_payment',
      },
    });

    // Check if the update succeeded (count will be 0 if status changed between checks)
    if (updateResult.count === 0) {
      throw new HttpError(409, 'Mail piece status changed during checkout creation. Please try again.');
    }

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


    // Rate limiting: 10 Lob submissions per hour
    checkOperationRateLimit('submitMailPieceToLob', 'mail', context.user.id);

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
    // Generate a download URL for the file (upload URLs are write-only and expire quickly)
    let fileUrl: string | undefined;
    if (mailPiece.file?.key) {
      try {
        fileUrl = await getDownloadFileSignedURLFromS3({ key: mailPiece.file.key });
        if (process.env.NODE_ENV === 'development') {
          console.log('Generated download URL for file');
        }
      } catch (error) {
        console.error('Failed to generate download URL for file:', error instanceof Error ? error.message : 'Unknown error');
        throw new HttpError(500, 'Failed to prepare file for mailing. Please try again.');
      }
    }

    const lobMailData = {
      to: mailPiece.recipientAddress,
      from: mailPiece.senderAddress,
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      fileUrl,
      description: mailPiece.description || `Mail piece created via Postmarkr - ${mailPiece.mailType}`,
      envelopeType: mailPiece.envelopeType || undefined,
      colorPrinting: mailPiece.colorPrinting ?? false, // Default to black & white for MVP
      doubleSided: mailPiece.doubleSided ?? true, // Default to double-sided for MVP
      addressPlacement: (mailPiece.addressPlacement === AddressPlacement.TOP_FIRST_PAGE ? 'top_first_page' : 'insert_blank_page') as 'top_first_page' | 'insert_blank_page', // Convert enum to Lob API format
    };

    // Submit to Lob API
    const lobResponse = await createLobMailPiece(lobMailData);

    // Extract preview URLs from Lob response
    const thumbnails = lobResponse.lobData?.thumbnails || [];
    const previewUrl = lobResponse.lobData?.url || null;

    if (process.env.NODE_ENV === 'development') {
      console.log('Extracted preview data from Lob:', {
        thumbnailCount: Array.isArray(thumbnails) ? thumbnails.length : 0,
        hasPreviewUrl: !!previewUrl
      });
    }

    // Update mail piece with Lob information using conditional update to prevent race conditions
    // This will only update if paymentStatus is 'paid' and lobId is still null
    const updateResult = await context.entities.MailPiece.updateMany({
      where: { 
        id: args.mailPieceId,
        userId: context.user.id,
        paymentStatus: 'paid', // Only update if payment is confirmed
        lobId: null // Only update if not already submitted to Lob
      },
      data: {
        lobId: lobResponse.id,
        lobStatus: lobResponse.status,
        lobTrackingNumber: lobResponse.trackingNumber,
        status: 'submitted',
        cost: lobResponse.cost / 100, // Convert to USD for display
        lobThumbnails: thumbnails, // Store thumbnail URLs for preview
        lobPreviewUrl: previewUrl, // Store direct preview URL
        metadata: {
          lobData: lobResponse.lobData,
          submittedAt: new Date().toISOString(),
        },
      },
    });

    // Check if the update succeeded (count will be 0 if already submitted or payment status changed)
    if (updateResult.count === 0) {
      throw new HttpError(409, 'Mail piece was already submitted to Lob or payment status changed. Please refresh and try again.');
    }

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

    if (process.env.NODE_ENV === 'development') {
      console.log(`Successfully submitted mail piece to Lob with ID: ${lobResponse.id}`);
    }

    // Send mail submitted confirmation email
    try {
      const mailPieceForEmail = await fetchMailPieceForEmail(args.mailPieceId, context);
      if (mailPieceForEmail) {
        await sendMailSubmittedEmail(mailPieceForEmail);
      }
    } catch (emailError) {
      console.error(`❌ Error sending mail submitted email for ${args.mailPieceId}:`, emailError);
      // Don't fail the operation - email failure shouldn't break submission
    }

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
    const newStatus = mapLobStatus(lobStatus.status, mailPiece.status);

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
