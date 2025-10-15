import { z } from 'zod';
import { AddressPlacement } from '@prisma/client';

// Mail type validation - SIMPLIFIED FOR LAUNCH: Only letters
export const mailTypeSchema = z.enum([
  'letter'
  // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
  // 'postcard',
  // 'check',
  // 'self_mailer',
  // 'catalog',
  // 'booklet'
]);

// Mail class validation - SIMPLIFIED FOR LAUNCH: Only first class, express, and priority
export const mailClassSchema = z.enum([
  'usps_first_class',
  'usps_express',
  'usps_priority'
  // Standard mail disabled for MVP - requires minimum 200 pieces or 50 pounds
  // 'usps_standard'
]);

// Mail size validation - SIMPLIFIED FOR LAUNCH: Only #10 envelope
export const mailSizeSchema = z.enum([
  '4x6' // #10 envelope size
  // COMMENTED OUT FOR LAUNCH - Will be re-enabled in future updates
  // '6x9',
  // '6x11', 
  // '6x18',
  // '9x12',
  // '12x15',
  // '12x18'
]);

// Status validation
export const mailPieceStatusSchema = z.enum([
  'draft',
  'pending_payment',
  'paid',
  'submitted',
  'in_transit',
  'delivered',
  'returned',
  'failed'
]);

// Payment status validation
export const paymentStatusSchema = z.enum([
  'pending',
  'paid',
  'failed',
  'refunded'
]);

// Source validation for status history
export const statusSourceSchema = z.enum([
  'system',
  'user',
  'lob',
  'webhook',
  'manual'
]);

// Create mail piece input validation
export const createMailPieceSchema = z.object({
  mailType: mailTypeSchema,
  mailClass: mailClassSchema,
  mailSize: mailSizeSchema,
  senderAddressId: z.string().uuid(),
  recipientAddressId: z.string().uuid(),
  fileId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
  addressPlacement: z.enum(['top_first_page', 'insert_blank_page']).optional(),
});

// Update mail piece input validation
export const updateMailPieceSchema = z.object({
  id: z.string().uuid('Invalid mail piece ID'),
  mailType: mailTypeSchema.optional(),
  mailClass: mailClassSchema.optional(),
  mailSize: mailSizeSchema.optional(),
  senderAddressId: z.string().uuid().optional(),
  recipientAddressId: z.string().uuid().optional(),
  fileId: z.string().uuid().optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
});

// Update status input validation
export const updateMailPieceStatusSchema = z.object({
  id: z.string().uuid('Invalid mail piece ID'),
  status: mailPieceStatusSchema,
  description: z.string().max(500, 'Description too long').optional(),
  source: statusSourceSchema.default('manual'),
});

// Lob webhook status update validation
export const lobWebhookStatusSchema = z.object({
  lobId: z.string().min(1, 'Lob ID is required'),
  lobStatus: z.string().optional(),
  lobTrackingNumber: z.string().optional(),
  lobData: z.any().optional(),
  trackingData: z.object({
    expectedDeliveryDate: z.date().optional(),
    actualDeliveryDate: z.date().optional(),
    carrier: z.string().optional(),
    location: z.string().optional(),
    daysInTransit: z.number().optional(),
  }).optional(),
});

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
export const validStatusTransitions: Record<string, string[]> = {
  'draft': ['pending_payment'],
  'pending_payment': ['paid', 'draft'],
  'paid': ['submitted'],
  'submitted': ['in_transit', 'failed'],
  'in_transit': ['delivered', 'returned', 'failed'],
  'delivered': [], // Terminal state
  'returned': [], // Terminal state
  'failed': ['submitted'], // Allow retry
};

/**
 * Validates if a status transition is allowed
 * 
 * @param currentStatus - Current status of the mail piece
 * @param newStatus - Desired new status
 * @returns true if transition is allowed, false otherwise
 */
export function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = validStatusTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

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
export function validateMailPieceOwnership(mailPiece: any, userId: string): boolean {
  return mailPiece.userId === userId;
}

/**
 * Validates that an address belongs to the specified user
 * 
 * @param address - Address object to validate
 * @param userId - User ID to check ownership against
 * @returns true if address belongs to user, false otherwise
 */
export function validateAddressOwnership(address: any, userId: string): boolean {
  return address.userId === userId;
}

/**
 * Validates that a file belongs to the specified user
 * 
 * @param file - File object to validate
 * @param userId - User ID to check ownership against
 * @returns true if file belongs to user, false otherwise
 */
export function validateFileOwnership(file: any, userId: string): boolean {
  return file.userId === userId;
}

// Error message helpers
export const validationErrors = {
  UNAUTHORIZED: 'Not authorized to perform this action',
  MAIL_PIECE_NOT_FOUND: 'Mail piece not found',
  ADDRESS_NOT_FOUND: 'Address not found or not owned by user',
  FILE_NOT_FOUND: 'File not found or not owned by user',
  INVALID_STATUS_TRANSITION: 'Invalid status transition',
  INVALID_INPUT: 'Invalid input data',
  MISSING_REQUIRED_FIELD: 'Required field is missing',
} as const;

export type ValidationError = typeof validationErrors[keyof typeof validationErrors];
