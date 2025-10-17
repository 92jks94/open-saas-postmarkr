/**
 * Mail Notification Service
 * 
 * This module handles sending all mail-related email notifications.
 * It fetches necessary data from the database and sends formatted emails.
 */

import { shouldSendNotification } from '../notifications/notificationService';
import { emailSender } from 'wasp/server/email';
import type { MailPiece, MailAddress, User } from 'wasp/entities';
import {
  getPaymentConfirmationEmail,
  getMailSubmittedEmail,
  getInTransitEmail,
  getDeliveryConfirmationEmail,
  getDeliveryFailedEmail,
  getPaymentFailedEmail,
  getWelcomeEmail,
  getMailedEmail,
  getProcessedForDeliveryEmail,
  getReRoutedEmail,
  getReceiptEmail,
} from './mailTemplates';

interface MailPieceWithRelations extends MailPiece {
  recipientAddress: MailAddress;
  senderAddress: MailAddress;
  user: User;
}

/**
 * Get user email from auth identities or user model
 */
function getUserEmail(user: any): string | null {
  // Try to get email from identities (AuthUser structure) - email is in id field
  if (user.identities?.email?.id) {
    return user.identities.email.id;
  }
  
  // Try to get email from user model directly
  if (user.email) {
    return user.email;
  }
  
  return null;
}

/**
 * Get user name from user model or email
 */
function getUserName(user: any): string {
  // Try username first
  if (user.username) {
    return user.username;
  }
  
  // Try email identities - email is in id field
  if (user.identities?.email?.id) {
    return user.identities.email.id.split('@')[0];
  }
  
  // Try direct email
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  return 'Valued Customer';
}

/**
 * Generate tracking URL for a mail piece
 */
function getTrackingUrl(mailPieceId: string): string {
  const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'https://postmarkr.com';
  return `${baseUrl}/mail/${mailPieceId}`;
}

/**
 * Generic email sender for mail-related notifications
 * Handles user email extraction, validation, sending, and error handling
 * 
 * @param mailPiece - Mail piece with user and address relations
 * @param getTemplate - Function that generates email content
 * @param templateData - Data to pass to the template function
 * @param emailType - Human-readable email type for logging (e.g., "payment confirmation")
 */
async function sendMailEmail<T>(
  mailPiece: MailPieceWithRelations,
  getTemplate: (data: T) => { subject: string; text: string; html: string },
  templateData: T,
  emailType: string
): Promise<void> {
  try {
    const userEmail = getUserEmail(mailPiece.user);
    
    if (!userEmail) {
      console.error(`Cannot send ${emailType} email: user email not found`, {
        mailPieceId: mailPiece.id,
        userId: mailPiece.userId
      });
      return;
    }

    const emailContent = getTemplate(templateData);

    await emailSender.send({
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log(`✅ ${emailType} email sent for mail piece ${mailPiece.id} to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send ${emailType} email:`, error);
    // Don't throw - email failures shouldn't break the user flow
  }
}

/**
 * Send payment confirmation email after successful payment
 */
export async function sendPaymentConfirmationEmail(
  mailPiece: MailPieceWithRelations
): Promise<void> {
  const userEmail = getUserEmail(mailPiece.user);
  if (!userEmail) return;

  return sendMailEmail(
    mailPiece,
    getPaymentConfirmationEmail,
    {
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      senderAddress: mailPiece.senderAddress,
      userName: getUserName(mailPiece.user),
      userEmail,
      trackingUrl: getTrackingUrl(mailPiece.id),
    },
    'payment confirmation'
  );
}

/**
 * Send mail submitted confirmation email
 */
export async function sendMailSubmittedEmail(
  mailPiece: MailPieceWithRelations
): Promise<void> {
  const userEmail = getUserEmail(mailPiece.user);
  if (!userEmail) return;

  return sendMailEmail(
    mailPiece,
    getMailSubmittedEmail,
    {
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      userName: getUserName(mailPiece.user),
      trackingUrl: getTrackingUrl(mailPiece.id),
    },
    'mail submitted'
  );
}

/**
 * Send in transit notification email
 */
export async function sendInTransitEmail(
  mailPiece: MailPieceWithRelations
): Promise<void> {
  const userEmail = getUserEmail(mailPiece.user);
  if (!userEmail) return;

  return sendMailEmail(
    mailPiece,
    getInTransitEmail,
    {
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      userName: getUserName(mailPiece.user),
      trackingUrl: getTrackingUrl(mailPiece.id),
    },
    'in transit'
  );
}

/**
 * Send delivery confirmation email
 */
export async function sendDeliveryConfirmationEmail(
  mailPiece: MailPieceWithRelations,
  deliveryDate?: Date
): Promise<void> {
  const userEmail = getUserEmail(mailPiece.user);
  if (!userEmail) return;

  return sendMailEmail(
    mailPiece,
    getDeliveryConfirmationEmail,
    {
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      userName: getUserName(mailPiece.user),
      trackingUrl: getTrackingUrl(mailPiece.id),
      deliveryDate,
    },
    'delivery confirmation'
  );
}

/**
 * Send delivery failed alert email
 */
export async function sendDeliveryFailedEmail(
  mailPiece: MailPieceWithRelations,
  failureReason?: string
): Promise<void> {
  const userEmail = getUserEmail(mailPiece.user);
  if (!userEmail) return;

  return sendMailEmail(
    mailPiece,
    getDeliveryFailedEmail,
    {
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      userName: getUserName(mailPiece.user),
      userEmail,
      failureReason,
    },
    'delivery failed'
  );
}

/**
 * Send payment failed notification email
 */
export async function sendPaymentFailedEmail(
  userEmail: string,
  userName: string,
  mailType: string,
  amount: number,
  failureReason?: string
): Promise<void> {
  try {
    const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'https://postmarkr.com';
    const retryUrl = `${baseUrl}/mail/create`;

    const emailContent = getPaymentFailedEmail({
      userName,
      userEmail,
      mailType,
      amount,
      failureReason,
      retryUrl,
    });

    await emailSender.send({
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log(`✅ Payment failed email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(
  userEmail: string,
  userName: string
): Promise<void> {
  try {
    const emailContent = getWelcomeEmail({
      userName,
      userEmail,
    });

    await emailSender.send({
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });

    console.log(`✅ Welcome email sent to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}

/**
 * Fetch mail piece with all required relations for email sending
 */
export async function fetchMailPieceForEmail(
  mailPieceId: string,
  context: any
): Promise<MailPieceWithRelations | null> {
  try {
    const mailPiece = await context.entities.MailPiece.findUnique({
      where: { id: mailPieceId },
      include: {
        recipientAddress: true,
        senderAddress: true,
        user: true,
      },
    });

    return mailPiece as MailPieceWithRelations | null;
  } catch (error) {
    console.error('Failed to fetch mail piece for email:', error);
    return null;
  }
}

/**
 * Determine which email to send based on status change
 * Now includes preference checking and all tracking events
 */
export async function handleMailStatusChangeEmail(
  mailPieceId: string,
  newStatus: string,
  previousStatus: string,
  context: any,
  trackingData?: {
    expectedDeliveryDate?: Date;
    actualDeliveryDate?: Date;
    carrier?: string;
    location?: string;
    daysInTransit?: number;
  }
): Promise<void> {
  const mailPiece = await fetchMailPieceForEmail(mailPieceId, context);
  
  if (!mailPiece) {
    console.error('Cannot send status change email: mail piece not found', { mailPieceId });
    return;
  }

  // Check user preferences before sending email
  const notificationType = getNotificationTypeForStatus(newStatus);
  const shouldSend = await shouldSendNotification(mailPiece.userId, notificationType, context);
  
  if (!shouldSend.email) {
    console.log(`Email notification skipped for ${mailPieceId}: user has disabled ${notificationType} emails`);
    return;
  }

  // Determine which email to send based on status transition
  switch (newStatus) {
    case 'submitted':
      // Don't send email here - it's already sent in submitMailPieceToLob operation
      // to avoid potential duplicate emails (operation sends immediately, webhook may arrive later)
      console.log(`Mail submitted email already sent in operation for ${mailPieceId}, skipping webhook email`);
      break;
      
    case 'in_transit':
      await sendInTransitEmail(mailPiece);
      break;
      
    case 'in_local_area':
      await sendProcessedForDeliveryEmail(mailPiece, trackingData);
      break;
      
    case 'delivered':
      await sendDeliveryConfirmationEmail(mailPiece);
      break;
      
    case 'failed':
    case 'returned':
      const failureReason = mailPiece.metadata && typeof mailPiece.metadata === 'object' 
        ? (mailPiece.metadata as any).failureReason 
        : undefined;
      await sendDeliveryFailedEmail(mailPiece, failureReason);
      break;
      
    default:
      // No email needed for other status changes
      break;
  }
}

/**
 * Get notification type based on mail status
 */
function getNotificationTypeForStatus(status: string): string {
  switch (status) {
    case 'submitted':
      return 'mail_mailed';
    case 'in_transit':
      return 'mail_status_change';
    case 'in_local_area':
      return 'mail_processed_for_delivery';
    case 'delivered':
      return 'delivery_confirmation';
    case 'failed':
    case 'returned':
      return 'delivery_failed';
    default:
      return 'mail_status_change';
  }
}

/**
 * Send receipt email with PDF attachment
 * Used when user requests receipt via email
 */
export async function sendReceiptEmailWithPDF(
  mailPiece: MailPieceWithRelations,
  user: any
): Promise<void> {
  try {
    const userEmail = getUserEmail(user);
    if (!userEmail) {
      console.error('Cannot send receipt email: user email not found', {
        mailPieceId: mailPiece.id,
        userId: user.id
      });
      return;
    }

    // Generate PDF receipt
    const { generateMailReceipt, generateTextReceipt } = await import('../receipts/pdfReceiptGenerator');
    
    let pdfBuffer: Buffer | undefined;
    let textReceipt: string | undefined;
    
    try {
      const receiptResult = await generateMailReceipt(mailPiece, userEmail);
      
      if (receiptResult.success && receiptResult.receiptUrl) {
        // Fetch PDF from S3 URL
        const response = await fetch(receiptResult.receiptUrl);
        if (response.ok) {
          pdfBuffer = Buffer.from(await response.arrayBuffer());
        }
      }
    } catch (error) {
      console.warn('Failed to generate PDF receipt, falling back to text:', error);
    }
    
    // Generate text receipt as fallback
    if (!pdfBuffer) {
      textReceipt = generateTextReceipt({
        mailPieceId: mailPiece.id,
        orderNumber: generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id),
        createdAt: mailPiece.createdAt,
        status: mailPiece.status,
        paymentStatus: mailPiece.paymentStatus,
        mailType: mailPiece.mailType,
        mailClass: mailPiece.mailClass,
        mailSize: mailPiece.mailSize,
        pageCount: mailPiece.pageCount || undefined,
        cost: mailPiece.cost || mailPiece.customerPrice || 0,
        lobTrackingNumber: mailPiece.lobTrackingNumber || undefined,
        senderAddress: mailPiece.senderAddress,
        recipientAddress: mailPiece.recipientAddress,
        userEmail,
        paymentIntentId: mailPiece.paymentIntentId || undefined,
      });
    }

    // Prepare email content
    const emailContent = getReceiptEmail({
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      senderAddress: mailPiece.senderAddress,
      userName: getUserName(user),
      userEmail,
      trackingUrl: getTrackingUrl(mailPiece.id),
      hasPDFAttachment: !!pdfBuffer,
    });

    // Send email with attachment
    const emailData: any = {
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    };

    // Add PDF attachment if available
    if (pdfBuffer) {
      emailData.attachments = [{
        filename: `receipt-${mailPiece.id}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      }];
    } else if (textReceipt) {
      // Add text receipt as attachment if no PDF
      emailData.attachments = [{
        filename: `receipt-${mailPiece.id}.txt`,
        content: textReceipt,
        type: 'text/plain',
        disposition: 'attachment',
      }];
    }

    await emailSender.send(emailData);

    console.log(`✅ Receipt email sent for mail piece ${mailPiece.id} to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send receipt email:', error);
    // Don't throw - email failures shouldn't break the user flow
  }
}

/**
 * Send payment confirmation email with receipt attachment
 * Enhanced version of existing function to include PDF receipt
 */
export async function sendPaymentConfirmationEmailWithReceipt(
  mailPiece: MailPieceWithRelations
): Promise<void> {
  try {
    const userEmail = getUserEmail(mailPiece.user);
    if (!userEmail) return;

    // Generate PDF receipt
    const { generateMailReceipt } = await import('../receipts/pdfReceiptGenerator');
    let pdfBuffer: Buffer | undefined;
    
    try {
      const receiptResult = await generateMailReceipt(mailPiece, userEmail);
      
      if (receiptResult.success && receiptResult.receiptUrl) {
        // Fetch PDF from S3 URL
        const response = await fetch(receiptResult.receiptUrl);
        if (response.ok) {
          pdfBuffer = Buffer.from(await response.arrayBuffer());
        }
      }
    } catch (error) {
      console.warn('Failed to generate PDF receipt for payment confirmation:', error);
    }

    // Prepare email content
    const emailContent = getPaymentConfirmationEmail({
      mailPiece,
      recipientAddress: mailPiece.recipientAddress,
      senderAddress: mailPiece.senderAddress,
      userName: getUserName(mailPiece.user),
      userEmail,
      trackingUrl: getTrackingUrl(mailPiece.id),
    });

    // Send email with receipt attachment
    const emailData: any = {
      to: userEmail,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    };

    // Add PDF receipt as attachment if available
    if (pdfBuffer) {
      emailData.attachments = [{
        filename: `receipt-${mailPiece.id}.pdf`,
        content: pdfBuffer.toString('base64'),
        type: 'application/pdf',
        disposition: 'attachment',
      }];
    }

    await emailSender.send(emailData);

    console.log(`✅ Payment confirmation email with receipt sent for mail piece ${mailPiece.id} to ${userEmail}`);
  } catch (error) {
    console.error('Failed to send payment confirmation email with receipt:', error);
    // Fall back to regular payment confirmation email
    await sendPaymentConfirmationEmail(mailPiece);
  }
}

// Helper function to generate order number (reuse existing logic)
function generateOrderNumber(paymentIntentId?: string | null, mailPieceId?: string): string {
  if (paymentIntentId) {
    return paymentIntentId.slice(-8).toUpperCase();
  }
  if (mailPieceId) {
    return `MP-${mailPieceId.slice(0, 8).toUpperCase()}`;
  }
  return 'N/A';
}

/**
 * Send processed for delivery email
 */
async function sendProcessedForDeliveryEmail(
  mailPiece: MailPieceWithRelations,
  trackingData?: {
    expectedDeliveryDate?: Date;
    location?: string;
  }
): Promise<void> {
  await sendMailEmail(
    mailPiece,
    getProcessedForDeliveryEmail,
    {
      userName: getUserName(mailPiece.user),
      mailType: mailPiece.mailType,
      recipientAddress: mailPiece.recipientAddress,
      trackingUrl: getTrackingUrl(mailPiece.id),
      expectedDeliveryDate: trackingData?.expectedDeliveryDate,
      location: trackingData?.location,
    },
    'processed for delivery'
  );
}

