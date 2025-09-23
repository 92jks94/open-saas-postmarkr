import { z } from 'zod';

// Mail type validation
export const mailTypeSchema = z.enum([
  'postcard',
  'letter', 
  'check',
  'self_mailer',
  'catalog',
  'booklet'
]);

// Mail class validation
export const mailClassSchema = z.enum([
  'usps_first_class',
  'usps_standard', 
  'usps_express',
  'usps_priority'
]);

// Mail size validation
export const mailSizeSchema = z.enum([
  '4x6',
  '6x9',
  '6x11', 
  '6x18',
  '9x12',
  '12x15',
  '12x18'
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
  senderAddressId: z.string().uuid('Invalid sender address ID'),
  recipientAddressId: z.string().uuid('Invalid recipient address ID'),
  fileId: z.string().uuid('Invalid file ID').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
}).refine(
  (data) => data.senderAddressId !== data.recipientAddressId,
  {
    message: 'Sender and recipient addresses must be different',
    path: ['recipientAddressId']
  }
);

// Update mail piece input validation
export const updateMailPieceSchema = z.object({
  id: z.string().uuid('Invalid mail piece ID'),
  mailType: mailTypeSchema.optional(),
  mailClass: mailClassSchema.optional(),
  mailSize: mailSizeSchema.optional(),
  senderAddressId: z.string().uuid('Invalid sender address ID').optional(),
  recipientAddressId: z.string().uuid('Invalid recipient address ID').optional(),
  fileId: z.string().uuid('Invalid file ID').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description too long').optional(),
}).refine(
  (data) => {
    if (data.senderAddressId && data.recipientAddressId) {
      return data.senderAddressId !== data.recipientAddressId;
    }
    return true;
  },
  {
    message: 'Sender and recipient addresses must be different',
    path: ['recipientAddressId']
  }
);

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
});

// Status transition validation
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

export function validateStatusTransition(currentStatus: string, newStatus: string): boolean {
  const allowedTransitions = validStatusTransitions[currentStatus] || [];
  return allowedTransitions.includes(newStatus);
}

// Business logic validation functions
export function validateMailPieceOwnership(mailPiece: any, userId: string): boolean {
  return mailPiece.userId === userId;
}

export function validateAddressOwnership(address: any, userId: string): boolean {
  return address.userId === userId;
}

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
