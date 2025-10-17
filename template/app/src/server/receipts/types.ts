/**
 * Types for PDF receipt generation system
 */

export interface ReceiptData {
  mailPieceId: string;
  orderNumber: string;
  createdAt: Date;
  status: string;
  paymentStatus: string;
  mailType: string;
  mailClass: string;
  mailSize: string;
  pageCount?: number;
  cost: number;
  lobTrackingNumber?: string;
  senderAddress: {
    contactName: string;
    companyName?: string | null;
    address_line1: string;
    address_line2?: string | null;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
  };
  recipientAddress: {
    contactName: string;
    companyName?: string | null;
    address_line1: string;
    address_line2?: string | null;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
  };
  userEmail: string;
  paymentIntentId?: string;
  thumbnailDataUrl?: string; // Base64 data URL for PDF thumbnail
}

export interface ReceiptGenerationResult {
  success: boolean;
  receiptUrl?: string;
  error?: string;
}

export interface ReceiptStorageConfig {
  bucket: string;
  region: string;
  retentionDays: number;
}
