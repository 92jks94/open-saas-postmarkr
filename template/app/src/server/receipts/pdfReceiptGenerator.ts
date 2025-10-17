/**
 * PDF Receipt Generator Service
 * Generates branded PDF receipts for mail orders
 * Leverages existing PDF libraries and formatting utilities
 */

import { HttpError } from 'wasp/server';
import type { ReceiptData, ReceiptGenerationResult } from './types';
import { generateReceiptPDF } from './receiptTemplates';
import { uploadReceiptToS3, getReceiptDownloadUrl } from './s3ReceiptStorage';
import { 
  formatCurrency, 
  formatDate
} from '../../mail/columns';
import { 
  generateOrderNumber 
} from '../../mail/utils/formatting';

/**
 * Generate PDF receipt for a mail piece
 * This is called pre-generation when payment is confirmed
 */
export async function generateMailReceipt(
  mailPiece: any,
  userEmail: string,
  thumbnailDataUrl?: string
): Promise<ReceiptGenerationResult> {
  try {
    console.log(`📄 Generating receipt for mail piece ${mailPiece.id}`);
    
    // Prepare receipt data
    const receiptData: ReceiptData = {
      mailPieceId: mailPiece.id,
      orderNumber: generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id),
      createdAt: mailPiece.createdAt,
      status: mailPiece.status,
      paymentStatus: mailPiece.paymentStatus,
      mailType: mailPiece.mailType,
      mailClass: mailPiece.mailClass,
      mailSize: mailPiece.mailSize,
      pageCount: mailPiece.pageCount,
      cost: mailPiece.cost || mailPiece.customerPrice || 0,
      lobTrackingNumber: mailPiece.lobTrackingNumber,
      senderAddress: mailPiece.senderAddress,
      recipientAddress: mailPiece.recipientAddress,
      userEmail,
      paymentIntentId: mailPiece.paymentIntentId,
      thumbnailDataUrl,
    };
    
    // Generate PDF
    const pdfBuffer = await generateReceiptPDF(receiptData);
    
    // Upload to S3
    const s3Key = await uploadReceiptToS3(
      pdfBuffer,
      mailPiece.userId.toString(),
      mailPiece.id
    );
    
    // Get download URL
    const downloadUrl = await getReceiptDownloadUrl(s3Key);
    
    console.log(`✅ Receipt generated successfully for mail piece ${mailPiece.id}`);
    
    return {
      success: true,
      receiptUrl: downloadUrl,
    };
  } catch (error) {
    console.error(`Failed to generate receipt for mail piece ${mailPiece.id}:`, error);
    
    // Log error for monitoring
    console.error('Receipt generation error details:', {
      mailPieceId: mailPiece.id,
      userId: mailPiece.userId,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate receipt',
    };
  }
}

/**
 * Generate fallback text receipt for email
 * Used when PDF generation fails
 */
export function generateTextReceipt(receiptData: ReceiptData): string {
  const costBreakdown = {
    subtotal: receiptData.cost * 0.85,
    processing: receiptData.cost * 0.15,
    total: receiptData.cost,
  };
  
  return `
POSTMARKR - ORDER RECEIPT
========================

Order Number: ${receiptData.orderNumber}
Order Date: ${formatDate(receiptData.createdAt)}
Status: ${receiptData.status.replace('_', ' ').toUpperCase()}
Payment: ${receiptData.paymentStatus.toUpperCase()}

MAIL SPECIFICATIONS
-------------------
Type: ${receiptData.mailType}
Class: ${receiptData.mailClass}
Size: ${receiptData.mailSize}
${receiptData.pageCount ? `Pages: ${receiptData.pageCount}` : ''}
${receiptData.lobTrackingNumber ? `Tracking: ${receiptData.lobTrackingNumber}` : ''}

FROM ADDRESS
------------
${receiptData.senderAddress.contactName}
${receiptData.senderAddress.companyName ? receiptData.senderAddress.companyName + '\n' : ''}
${receiptData.senderAddress.address_line1}
${receiptData.senderAddress.address_line2 ? receiptData.senderAddress.address_line2 + '\n' : ''}
${receiptData.senderAddress.address_city}, ${receiptData.senderAddress.address_state} ${receiptData.senderAddress.address_zip}
${receiptData.senderAddress.address_country}

TO ADDRESS
----------
${receiptData.recipientAddress.contactName}
${receiptData.recipientAddress.companyName ? receiptData.recipientAddress.companyName + '\n' : ''}
${receiptData.recipientAddress.address_line1}
${receiptData.recipientAddress.address_line2 ? receiptData.recipientAddress.address_line2 + '\n' : ''}
${receiptData.recipientAddress.address_city}, ${receiptData.recipientAddress.address_state} ${receiptData.recipientAddress.address_zip}
${receiptData.recipientAddress.address_country}

COST BREAKDOWN
--------------
Mail Service: ${formatCurrency(costBreakdown.subtotal)}
Processing & Handling: ${formatCurrency(costBreakdown.processing)}
Total: ${formatCurrency(costBreakdown.total)}

---
Postmarkr - Physical Mail Made Simple
support@postmarkr.com | www.postmarkr.com
Receipt ID: ${receiptData.mailPieceId}
  `.trim();
}

/**
 * Get receipt download URL for existing receipt
 */
export async function getReceiptDownloadUrlForMailPiece(
  mailPieceId: string,
  userId: string
): Promise<string> {
  try {
    // For now, we'll need to store the S3 key in the database
    // This is a simplified version - in production, you'd want to store the S3 key
    // in the MailPiece model or a separate Receipt model
    
    // For this implementation, we'll generate a new receipt if one doesn't exist
    // In production, you'd want to check if a receipt already exists first
    
    throw new Error('Receipt not found - this would need database integration');
  } catch (error) {
    console.error(`Failed to get receipt download URL for mail piece ${mailPieceId}:`, error);
    throw new HttpError(404, 'Receipt not found');
  }
}
