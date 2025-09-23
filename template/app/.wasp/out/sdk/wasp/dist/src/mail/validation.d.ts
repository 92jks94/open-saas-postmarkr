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
    status: "paid" | "pending_payment" | "failed" | "draft" | "delivered" | "returned" | "in_transit" | "submitted";
    source: "user" | "webhook" | "system" | "lob" | "manual";
    description?: string | undefined;
}, {
    id: string;
    status: "paid" | "pending_payment" | "failed" | "draft" | "delivered" | "returned" | "in_transit" | "submitted";
    description?: string | undefined;
    source?: "user" | "webhook" | "system" | "lob" | "manual" | undefined;
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
export declare const validStatusTransitions: Record<string, string[]>;
export declare function validateStatusTransition(currentStatus: string, newStatus: string): boolean;
export declare function validateMailPieceOwnership(mailPiece: any, userId: string): boolean;
export declare function validateAddressOwnership(address: any, userId: string): boolean;
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
//# sourceMappingURL=validation.d.ts.map