import { z } from 'zod';
export declare const mailTypeSchema: z.ZodEnum<["postcard", "letter", "check", "self_mailer", "catalog", "booklet"]>;
export declare const mailClassSchema: z.ZodEnum<["usps_first_class", "usps_standard", "usps_express", "usps_priority"]>;
export declare const mailSizeSchema: z.ZodEnum<["4x6", "6x9", "6x11", "6x18", "9x12", "12x15", "12x18"]>;
export declare const mailPieceStatusSchema: z.ZodEnum<["draft", "pending_payment", "paid", "submitted", "in_transit", "delivered", "returned", "failed"]>;
export declare const paymentStatusSchema: z.ZodEnum<["pending", "paid", "failed", "refunded"]>;
export declare const statusSourceSchema: z.ZodEnum<["system", "user", "lob", "webhook", "manual"]>;
export declare const createMailPieceSchema: z.ZodEffects<z.ZodObject<{
    mailType: z.ZodEnum<["postcard", "letter", "check", "self_mailer", "catalog", "booklet"]>;
    mailClass: z.ZodEnum<["usps_first_class", "usps_standard", "usps_express", "usps_priority"]>;
    mailSize: z.ZodEnum<["4x6", "6x9", "6x11", "6x18", "9x12", "12x15", "12x18"]>;
    senderAddressId: z.ZodString;
    recipientAddressId: z.ZodString;
    fileId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    mailType: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet";
    mailClass: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority";
    mailSize: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18";
    senderAddressId: string;
    recipientAddressId: string;
    description?: string | undefined;
    fileId?: string | undefined;
}, {
    mailType: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet";
    mailClass: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority";
    mailSize: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18";
    senderAddressId: string;
    recipientAddressId: string;
    description?: string | undefined;
    fileId?: string | undefined;
}>, {
    mailType: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet";
    mailClass: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority";
    mailSize: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18";
    senderAddressId: string;
    recipientAddressId: string;
    description?: string | undefined;
    fileId?: string | undefined;
}, {
    mailType: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet";
    mailClass: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority";
    mailSize: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18";
    senderAddressId: string;
    recipientAddressId: string;
    description?: string | undefined;
    fileId?: string | undefined;
}>;
export declare const updateMailPieceSchema: z.ZodEffects<z.ZodObject<{
    id: z.ZodString;
    mailType: z.ZodOptional<z.ZodEnum<["postcard", "letter", "check", "self_mailer", "catalog", "booklet"]>>;
    mailClass: z.ZodOptional<z.ZodEnum<["usps_first_class", "usps_standard", "usps_express", "usps_priority"]>>;
    mailSize: z.ZodOptional<z.ZodEnum<["4x6", "6x9", "6x11", "6x18", "9x12", "12x15", "12x18"]>>;
    senderAddressId: z.ZodOptional<z.ZodString>;
    recipientAddressId: z.ZodOptional<z.ZodString>;
    fileId: z.ZodOptional<z.ZodString>;
    description: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    id: string;
    description?: string | undefined;
    mailType?: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet" | undefined;
    mailClass?: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority" | undefined;
    mailSize?: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18" | undefined;
    senderAddressId?: string | undefined;
    recipientAddressId?: string | undefined;
    fileId?: string | undefined;
}, {
    id: string;
    description?: string | undefined;
    mailType?: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet" | undefined;
    mailClass?: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority" | undefined;
    mailSize?: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18" | undefined;
    senderAddressId?: string | undefined;
    recipientAddressId?: string | undefined;
    fileId?: string | undefined;
}>, {
    id: string;
    description?: string | undefined;
    mailType?: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet" | undefined;
    mailClass?: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority" | undefined;
    mailSize?: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18" | undefined;
    senderAddressId?: string | undefined;
    recipientAddressId?: string | undefined;
    fileId?: string | undefined;
}, {
    id: string;
    description?: string | undefined;
    mailType?: "postcard" | "letter" | "check" | "self_mailer" | "catalog" | "booklet" | undefined;
    mailClass?: "usps_first_class" | "usps_standard" | "usps_express" | "usps_priority" | undefined;
    mailSize?: "4x6" | "6x9" | "6x11" | "6x18" | "9x12" | "12x15" | "12x18" | undefined;
    senderAddressId?: string | undefined;
    recipientAddressId?: string | undefined;
    fileId?: string | undefined;
}>;
export declare const updateMailPieceStatusSchema: z.ZodObject<{
    id: z.ZodString;
    status: z.ZodEnum<["draft", "pending_payment", "paid", "submitted", "in_transit", "delivered", "returned", "failed"]>;
    description: z.ZodOptional<z.ZodString>;
    source: z.ZodDefault<z.ZodEnum<["system", "user", "lob", "webhook", "manual"]>>;
}, "strip", z.ZodTypeAny, {
    id: string;
    status: "paid" | "pending_payment" | "failed" | "delivered" | "returned" | "in_transit" | "draft" | "submitted";
    source: "user" | "webhook" | "system" | "lob" | "manual";
    description?: string | undefined;
}, {
    id: string;
    status: "paid" | "pending_payment" | "failed" | "delivered" | "returned" | "in_transit" | "draft" | "submitted";
    source?: "user" | "webhook" | "system" | "lob" | "manual" | undefined;
    description?: string | undefined;
}>;
export declare const lobWebhookStatusSchema: z.ZodObject<{
    lobId: z.ZodString;
    lobStatus: z.ZodOptional<z.ZodString>;
    lobTrackingNumber: z.ZodOptional<z.ZodString>;
    lobData: z.ZodOptional<z.ZodAny>;
}, "strip", z.ZodTypeAny, {
    lobId: string;
    lobStatus?: string | undefined;
    lobTrackingNumber?: string | undefined;
    lobData?: any;
}, {
    lobId: string;
    lobStatus?: string | undefined;
    lobTrackingNumber?: string | undefined;
    lobData?: any;
}>;
/**
 * Valid status transitions for mail pieces
 *
 * Defines the allowed state transitions in the mail piece lifecycle:
 * - draft → pending_payment: User initiates payment
 * - pending_payment → paid: Payment confirmed
 * - pending_payment → draft: Payment cancelled, back to draft
 * - paid → submitted: Submitted to Lob for processing
 * - submitted → in_transit: Lob has processed and mailed
 * - submitted → failed: Lob processing failed
 * - in_transit → delivered: Successfully delivered (terminal)
 * - in_transit → returned: Returned to sender (terminal)
 * - in_transit → failed: Delivery failed
 * - failed → submitted: Retry after failure
 */
export declare const validStatusTransitions: Record<string, string[]>;
/**
 * Validates if a status transition is allowed
 *
 * @param currentStatus - Current status of the mail piece
 * @param newStatus - Desired new status
 * @returns true if transition is allowed, false otherwise
 */
export declare function validateStatusTransition(currentStatus: string, newStatus: string): boolean;
/**
 * Business logic validation functions for ownership checks
 */
/**
 * Validates that a mail piece belongs to the specified user
 *
 * @param mailPiece - Mail piece object to validate
 * @param userId - User ID to check ownership against
 * @returns true if mail piece belongs to user, false otherwise
 */
export declare function validateMailPieceOwnership(mailPiece: any, userId: string): boolean;
/**
 * Validates that an address belongs to the specified user
 *
 * @param address - Address object to validate
 * @param userId - User ID to check ownership against
 * @returns true if address belongs to user, false otherwise
 */
export declare function validateAddressOwnership(address: any, userId: string): boolean;
/**
 * Validates that a file belongs to the specified user
 *
 * @param file - File object to validate
 * @param userId - User ID to check ownership against
 * @returns true if file belongs to user, false otherwise
 */
export declare function validateFileOwnership(file: any, userId: string): boolean;
export declare const validationErrors: {
    readonly UNAUTHORIZED: "Not authorized to perform this action";
    readonly MAIL_PIECE_NOT_FOUND: "Mail piece not found";
    readonly ADDRESS_NOT_FOUND: "Address not found or not owned by user";
    readonly FILE_NOT_FOUND: "File not found or not owned by user";
    readonly INVALID_STATUS_TRANSITION: "Invalid status transition";
    readonly INVALID_INPUT: "Invalid input data";
    readonly MISSING_REQUIRED_FIELD: "Required field is missing";
};
export type ValidationError = typeof validationErrors[keyof typeof validationErrors];
