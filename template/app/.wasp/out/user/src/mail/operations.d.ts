import type { GetMailPieces, CreateMailPiece, UpdateMailPieceStatus } from 'wasp/server/operations';
import type { MailPiece } from 'wasp/entities';
/**
 * Get all mail pieces for the current user
 */
export declare const getMailPieces: GetMailPieces<void, MailPiece[]>;
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
export declare const createMailPiece: CreateMailPiece<CreateMailPieceInput, MailPiece>;
/**
 * Update mail piece status (used by webhook)
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
export declare const updateMailPiece: (args: UpdateMailPieceInput, context: any) => Promise<MailPiece>;
/**
 * Delete a mail piece
 */
type DeleteMailPieceInput = {
    id: string;
};
export declare const deleteMailPiece: (args: DeleteMailPieceInput, context: any) => Promise<{
    success: boolean;
}>;
/**
 * Get a single mail piece by ID
 */
type GetMailPieceInput = {
    id: string;
};
export declare const getMailPiece: (args: GetMailPieceInput, context: any) => Promise<MailPiece | null>;
/**
 * Create payment intent for mail piece
 */
type CreateMailPaymentIntentInput = {
    mailPieceId: string;
};
export declare const createMailPaymentIntent: (args: CreateMailPaymentIntentInput, context: any) => Promise<{
    paymentIntentId: string;
    cost: number;
    clientSecret: string;
}>;
/**
 * Confirm payment for mail piece
 */
type ConfirmMailPaymentInput = {
    mailPieceId: string;
    paymentIntentId: string;
};
export declare const confirmMailPayment: (args: ConfirmMailPaymentInput, context: any) => Promise<{
    success: boolean;
}>;
/**
 * Refund payment for mail piece
 */
type RefundMailPaymentInput = {
    mailPieceId: string;
    reason: string;
};
export declare const refundMailPayment: (args: RefundMailPaymentInput, context: any) => Promise<{
    success: boolean;
}>;
/**
 * Submit mail piece to Lob after payment confirmation
 */
type SubmitMailPieceToLobInput = {
    mailPieceId: string;
};
export declare const submitMailPieceToLob: (args: SubmitMailPieceToLobInput, context: any) => Promise<{
    success: boolean;
    lobId?: string;
}>;
/**
 * Sync mail piece status from Lob API
 */
type SyncMailPieceStatusInput = {
    mailPieceId: string;
};
export declare const syncMailPieceStatus: (args: SyncMailPieceStatusInput, context: any) => Promise<{
    success: boolean;
    status?: string;
}>;
export {};
