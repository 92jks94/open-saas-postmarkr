/**
 * Validation schemas for receipt operations
 * Reuses existing validation patterns
 */

import * as z from 'zod';

export const generateReceiptPDFInputSchema = z.object({
  mailPieceId: z.string().min(1, 'Mail piece ID is required'),
});

export const getReceiptDownloadUrlInputSchema = z.object({
  mailPieceId: z.string().min(1, 'Mail piece ID is required'),
});

export const sendReceiptEmailInputSchema = z.object({
  mailPieceId: z.string().min(1, 'Mail piece ID is required'),
});

export type GenerateReceiptPDFInput = z.infer<typeof generateReceiptPDFInputSchema>;
export type GetReceiptDownloadUrlInput = z.infer<typeof getReceiptDownloadUrlInputSchema>;
export type SendReceiptEmailInput = z.infer<typeof sendReceiptEmailInputSchema>;
