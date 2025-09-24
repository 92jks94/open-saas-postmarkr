import type { GetMailPieces, CreateMailPiece, UpdateMailPieceStatus, BulkDeleteMailPieces, GetMailPiece, UpdateMailPiece, DeleteMailPiece, CreateMailPaymentIntent, CreateMailCheckoutSession, ConfirmMailPayment, RefundMailPayment, SubmitMailPieceToLob, SyncMailPieceStatus } from 'wasp/server/operations';
import type { MailPiece } from 'wasp/entities';
import type { MailPieceWithRelations } from './types';
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
export declare const getMailPieces: GetMailPieces<GetMailPiecesInput, {
    mailPieces: MailPieceWithRelations[];
    total: number;
    page: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}>;
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
export declare const createMailPiece: CreateMailPiece<CreateMailPieceInput, MailPiece>;
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
export declare const updateMailPieceStatus: UpdateMailPieceStatus<UpdateMailPieceStatusInput, MailPiece>;
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
export declare const updateMailPiece: UpdateMailPiece<UpdateMailPieceInput, MailPiece>;
/**
 * Delete a mail piece
 */
type DeleteMailPieceInput = {
    id: string;
};
export declare const deleteMailPiece: DeleteMailPiece<DeleteMailPieceInput, {
    success: boolean;
}>;
/**
 * Get a single mail piece by ID
 */
type GetMailPieceInput = {
    id: string;
};
export declare const getMailPiece: GetMailPiece<GetMailPieceInput, MailPieceWithRelations | null>;
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
export declare const createMailPaymentIntent: CreateMailPaymentIntent<CreateMailPaymentIntentInput, {
    paymentIntentId: string;
    cost: number;
    clientSecret: string;
}>;
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
export declare const createMailCheckoutSession: CreateMailCheckoutSession<CreateMailCheckoutSessionInput, {
    sessionUrl: string;
    sessionId: string;
}>;
/**
 * Confirm payment for mail piece
 */
type ConfirmMailPaymentInput = {
    mailPieceId: string;
    paymentIntentId: string;
};
export declare const confirmMailPayment: ConfirmMailPayment<ConfirmMailPaymentInput, {
    success: boolean;
}>;
/**
 * Refund payment for mail piece
 */
type RefundMailPaymentInput = {
    mailPieceId: string;
    reason: string;
};
export declare const refundMailPayment: RefundMailPayment<RefundMailPaymentInput, {
    success: boolean;
}>;
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
export declare const submitMailPieceToLob: SubmitMailPieceToLob<SubmitMailPieceToLobInput, {
    success: boolean;
    lobId?: string;
}>;
/**
 * Sync mail piece status from Lob API
 */
type SyncMailPieceStatusInput = {
    mailPieceId: string;
};
export declare const syncMailPieceStatus: SyncMailPieceStatus<SyncMailPieceStatusInput, {
    success: boolean;
    status?: string;
}>;
/**
 * Bulk delete mail pieces (only draft status allowed)
 */
type BulkDeleteMailPiecesInput = {
    mailPieceIds: string[];
};
export declare const bulkDeleteMailPieces: BulkDeleteMailPieces<BulkDeleteMailPiecesInput, {
    deletedCount: number;
    failedIds: string[];
}>;
export {};
