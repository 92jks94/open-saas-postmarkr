/**
 * PDF Receipt Templates with Postmarkr Branding
 * Leverages existing formatting utilities and design patterns
 */

import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import type { ReceiptData } from './types';
import { 
  formatCurrency, 
  formatDate
} from '../../mail/columns';
import { 
  formatAddressFull, 
  formatMailClass,
  generateOrderNumber 
} from '../../mail/utils/formatting';

// Postmarkr brand colors (matching existing email templates)
const BRAND_COLORS = {
  primary: rgb(0.063, 0.722, 0.506), // #10B981 - Success green
  secondary: rgb(0.149, 0.165, 0.192), // #262A30 - Dark gray
  text: rgb(0.2, 0.2, 0.2), // #333333 - Dark text
  lightText: rgb(0.4, 0.4, 0.4), // #666666 - Light text
  border: rgb(0.9, 0.9, 0.9), // #E5E5E5 - Light border
};

// Page dimensions (standard letter size)
const PAGE_WIDTH = 612; // 8.5 inches
const PAGE_HEIGHT = 792; // 11 inches
const MARGIN = 50;
const CONTENT_WIDTH = PAGE_WIDTH - (MARGIN * 2);

/**
 * Generate PDF receipt with Postmarkr branding
 */
export async function generateReceiptPDF(receiptData: ReceiptData): Promise<Buffer> {
  try {
    // Create new PDF document
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    
    // Load fonts
    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    let yPosition = PAGE_HEIGHT - MARGIN;
    
    // Header with Postmarkr branding
    yPosition = await drawHeader(page, helveticaBold, helvetica, yPosition);
    
    // Order details section
    yPosition = await drawOrderDetails(page, helveticaBold, helvetica, receiptData, yPosition);
    
    // Mail specifications section
    yPosition = await drawMailSpecifications(page, helveticaBold, helvetica, receiptData, yPosition);
    
    // Addresses section
    yPosition = await drawAddresses(page, helveticaBold, helvetica, receiptData, yPosition);
    
    // Cost breakdown section
    yPosition = await drawCostBreakdown(page, helveticaBold, helvetica, receiptData, yPosition);
    
    // Footer
    await drawFooter(page, helvetica, receiptData);
    
    // Add thumbnail if available
    if (receiptData.thumbnailDataUrl) {
      await addThumbnail(page, pdfDoc, receiptData.thumbnailDataUrl);
    }
    
    // Generate PDF buffer
    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('Failed to generate receipt PDF:', error);
    throw new Error('Failed to generate receipt PDF');
  }
}

/**
 * Draw header with Postmarkr branding
 */
async function drawHeader(
  page: any,
  boldFont: any,
  regularFont: any,
  yPosition: number
): Promise<number> {
  // Company name
  page.drawText('Postmarkr', {
    x: MARGIN,
    y: yPosition - 30,
    size: 24,
    font: boldFont,
    color: BRAND_COLORS.primary,
  });
  
  // Tagline
  page.drawText('Physical Mail Made Simple', {
    x: MARGIN,
    y: yPosition - 50,
    size: 12,
    font: regularFont,
    color: BRAND_COLORS.lightText,
  });
  
  // Receipt title
  page.drawText('Order Receipt', {
    x: MARGIN,
    y: yPosition - 80,
    size: 18,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  
  return yPosition - 100;
}

/**
 * Draw order details section
 */
async function drawOrderDetails(
  page: any,
  boldFont: any,
  regularFont: any,
  data: ReceiptData,
  yPosition: number
): Promise<number> {
  // Section title
  page.drawText('Order Details', {
    x: MARGIN,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 30;
  
  // Order number
  page.drawText('Order Number:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(data.orderNumber, {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Order date
  page.drawText('Order Date:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(formatDate(data.createdAt), {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Status
  page.drawText('Status:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(data.status.replace('_', ' ').toUpperCase(), {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Payment status
  page.drawText('Payment:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(data.paymentStatus.toUpperCase(), {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: data.paymentStatus === 'paid' ? BRAND_COLORS.primary : BRAND_COLORS.lightText,
  });
  
  return yPosition - 30;
}

/**
 * Draw mail specifications section
 */
async function drawMailSpecifications(
  page: any,
  boldFont: any,
  regularFont: any,
  data: ReceiptData,
  yPosition: number
): Promise<number> {
  // Section title
  page.drawText('Mail Specifications', {
    x: MARGIN,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 30;
  
  // Mail type
  page.drawText('Type:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(data.mailType, {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Mail class
  page.drawText('Class:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(formatMailClass(data.mailClass), {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Mail size
  page.drawText('Size:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(data.mailSize, {
    x: MARGIN + 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Page count
  if (data.pageCount) {
    page.drawText('Pages:', {
      x: MARGIN,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: BRAND_COLORS.text,
    });
    page.drawText(data.pageCount.toString(), {
      x: MARGIN + 100,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: BRAND_COLORS.text,
    });
    yPosition -= 20;
  }
  
  // Tracking number
  if (data.lobTrackingNumber) {
    page.drawText('Tracking:', {
      x: MARGIN,
      y: yPosition,
      size: 10,
      font: boldFont,
      color: BRAND_COLORS.text,
    });
    page.drawText(data.lobTrackingNumber, {
      x: MARGIN + 100,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: BRAND_COLORS.text,
    });
    yPosition -= 20;
  }
  
  return yPosition - 30;
}

/**
 * Draw addresses section
 */
async function drawAddresses(
  page: any,
  boldFont: any,
  regularFont: any,
  data: ReceiptData,
  yPosition: number
): Promise<number> {
  // Section title
  page.drawText('Addresses', {
    x: MARGIN,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 30;
  
  // From address
  page.drawText('From:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  yPosition -= 20;
  
  const fromAddressLines = formatAddressFull(data.senderAddress);
  for (const line of fromAddressLines) {
    page.drawText(line, {
      x: MARGIN + 20,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: BRAND_COLORS.text,
    });
    yPosition -= 15;
  }
  
  yPosition -= 10;
  
  // To address
  page.drawText('To:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  yPosition -= 20;
  
  const toAddressLines = formatAddressFull(data.recipientAddress);
  for (const line of toAddressLines) {
    page.drawText(line, {
      x: MARGIN + 20,
      y: yPosition,
      size: 10,
      font: regularFont,
      color: BRAND_COLORS.text,
    });
    yPosition -= 15;
  }
  
  return yPosition - 30;
}

/**
 * Draw cost breakdown section
 */
async function drawCostBreakdown(
  page: any,
  boldFont: any,
  regularFont: any,
  data: ReceiptData,
  yPosition: number
): Promise<number> {
  // Section title
  page.drawText('Cost Breakdown', {
    x: MARGIN,
    y: yPosition,
    size: 14,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 30;
  
  // Calculate cost breakdown (reuse existing logic)
  const processing = data.cost * 0.15;
  const subtotal = data.cost - processing;
  
  // Subtotal
  page.drawText('Mail Service:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(formatCurrency(subtotal), {
    x: PAGE_WIDTH - MARGIN - 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Processing fee
  page.drawText('Processing & Handling:', {
    x: MARGIN,
    y: yPosition,
    size: 10,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(formatCurrency(processing), {
    x: PAGE_WIDTH - MARGIN - 100,
    y: yPosition,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.text,
  });
  
  yPosition -= 20;
  
  // Separator line
  page.drawLine({
    start: { x: MARGIN, y: yPosition },
    end: { x: PAGE_WIDTH - MARGIN, y: yPosition },
    thickness: 1,
    color: BRAND_COLORS.border,
  });
  
  yPosition -= 20;
  
  // Total
  page.drawText('Total:', {
    x: MARGIN,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: BRAND_COLORS.text,
  });
  page.drawText(formatCurrency(data.cost), {
    x: PAGE_WIDTH - MARGIN - 100,
    y: yPosition,
    size: 12,
    font: boldFont,
    color: BRAND_COLORS.primary,
  });
  
  return yPosition - 30;
}

/**
 * Draw footer with company info
 */
async function drawFooter(page: any, regularFont: any, data: ReceiptData): Promise<void> {
  const footerY = 50;
  
  // Company info
  page.drawText('Postmarkr - Physical Mail Made Simple', {
    x: MARGIN,
    y: footerY,
    size: 10,
    font: regularFont,
    color: BRAND_COLORS.lightText,
  });
  
  page.drawText('support@postmarkr.com | www.postmarkr.com', {
    x: MARGIN,
    y: footerY - 15,
    size: 9,
    font: regularFont,
    color: BRAND_COLORS.lightText,
  });
  
  // Receipt ID
  page.drawText(`Receipt ID: ${data.mailPieceId}`, {
    x: PAGE_WIDTH - MARGIN - 150,
    y: footerY,
    size: 9,
    font: regularFont,
    color: BRAND_COLORS.lightText,
  });
}

/**
 * Add thumbnail of the first page(s) of the mailed document
 */
async function addThumbnail(
  page: any,
  pdfDoc: PDFDocument,
  thumbnailDataUrl: string
): Promise<void> {
  try {
    // Convert data URL to buffer
    const base64Data = thumbnailDataUrl.split(',')[1];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Embed image
    const image = await pdfDoc.embedJpg(imageBuffer);
    
    // Scale thumbnail to fit in corner
    const thumbnailSize = 100;
    const scale = thumbnailSize / image.width;
    const scaledHeight = image.height * scale;
    
    // Position in top-right corner
    const x = PAGE_WIDTH - MARGIN - thumbnailSize;
    const y = PAGE_HEIGHT - MARGIN - 100;
    
    // Draw thumbnail
    page.drawImage(image, {
      x,
      y,
      width: thumbnailSize,
      height: scaledHeight,
    });
    
    // Add label
    page.drawText('Document Preview', {
      x: x,
      y: y - 15,
      size: 8,
      font: await pdfDoc.embedFont(StandardFonts.Helvetica),
      color: BRAND_COLORS.lightText,
    });
  } catch (error) {
    console.warn('Failed to add thumbnail to receipt:', error);
    // Don't throw - thumbnail is optional
  }
}
