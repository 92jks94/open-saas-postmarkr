// ============================================================================
// NOTIFICATION EMAIL TEMPLATES
// ============================================================================
// Email templates for notification system
// Following the pattern of src/auth/email-and-pass/emails.ts

import type { Notification, MailPiece } from 'wasp/entities';

// Base email template structure
interface NotificationEmailContent {
  subject: string;
  text: string;
  html: string;
}

// Mail status change email
export const getMailStatusChangeEmailContent = (notification: Notification, mailPiece?: MailPiece | null): NotificationEmailContent => {
  const mailDescription = mailPiece?.description || 'Untitled Mail Piece';
  const trackingNumber = mailPiece?.lobTrackingNumber || 'N/A';
  const data = notification.data as any;
  const newStatus = data?.newStatus || 'Unknown';
  const previousStatus = data?.previousStatus || 'Unknown';
  
  return {
    subject: `Mail Status Update - ${mailDescription}`,
    text: `Your mail piece "${mailDescription}" status has been updated from ${previousStatus} to ${newStatus}. Tracking: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Mail Status Update</h2>
        <p>Your mail piece has been updated:</p>
        
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">${mailDescription}</h3>
          <p><strong>Status:</strong> ${newStatus}</p>
          <p><strong>Previous Status:</strong> ${previousStatus}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Updated:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        
        <p>You can view more details in your <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/mail/history">mail history</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Postmarkr. 
          <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/notifications/settings">Unsubscribe</a> from these notifications.
        </p>
      </div>
    `
  };
};

// Delivery confirmation email
export const getDeliveryConfirmationEmailContent = (notification: Notification, mailPiece?: MailPiece | null): NotificationEmailContent => {
  const mailDescription = mailPiece?.description || 'Untitled Mail Piece';
  const trackingNumber = mailPiece?.lobTrackingNumber || 'N/A';
  const recipientName = 'Recipient'; // Will be passed separately
  const recipientAddress = 'Address'; // Will be passed separately
  
  return {
    subject: `Mail Delivered - ${mailDescription}`,
    text: `Great news! Your mail piece "${mailDescription}" has been delivered to ${recipientName} at ${recipientAddress}. Tracking: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">✅ Mail Delivered Successfully</h2>
        <p>Great news! Your mail piece has been delivered:</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">${mailDescription}</h3>
          <p><strong>Delivered to:</strong> ${recipientName}</p>
          <p><strong>Address:</strong> ${recipientAddress}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Delivered:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        
        <p>You can view more details in your <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/mail/history">mail history</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Postmarkr. 
          <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/notifications/settings">Unsubscribe</a> from these notifications.
        </p>
      </div>
    `
  };
};

// Delivery failure email
export const getDeliveryFailureEmailContent = (notification: Notification, mailPiece?: MailPiece | null): NotificationEmailContent => {
  const mailDescription = mailPiece?.description || 'Untitled Mail Piece';
  const trackingNumber = mailPiece?.lobTrackingNumber || 'N/A';
  const data = notification.data as any;
  const failureReason = data?.failureReason || 'Unknown reason';
  const status = data?.status || 'Failed';
  
  return {
    subject: `Mail Delivery Failed - ${mailDescription}`,
    text: `We're sorry, but your mail piece "${mailDescription}" could not be delivered. Status: ${status}. Reason: ${failureReason}. Tracking: ${trackingNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">❌ Mail Delivery Failed</h2>
        <p>We're sorry, but your mail piece could not be delivered:</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">${mailDescription}</h3>
          <p><strong>Status:</strong> ${status}</p>
          <p><strong>Reason:</strong> ${failureReason}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          <p><strong>Updated:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        
        <p>Please check the address and try again, or contact support if you need assistance.</p>
        <p>You can view more details in your <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/mail/history">mail history</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Postmarkr. 
          <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/notifications/settings">Unsubscribe</a> from these notifications.
        </p>
      </div>
    `
  };
};

// Payment confirmation email
export const getPaymentConfirmationEmailContent = (notification: Notification, mailPiece?: MailPiece | null): NotificationEmailContent => {
  const mailDescription = mailPiece?.description || 'Untitled Mail Piece';
  const data = notification.data as any;
  const amount = data?.amount ? `$${(data.amount / 100).toFixed(2)}` : 'N/A';
  const paymentMethod = data?.paymentMethod || 'Credit Card';
  const transactionId = data?.transactionId || 'N/A';
  
  return {
    subject: `Payment Confirmed - ${mailDescription}`,
    text: `Your payment has been processed successfully for "${mailDescription}". Amount: ${amount}. Transaction ID: ${transactionId}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">💳 Payment Confirmed</h2>
        <p>Your payment has been processed successfully:</p>
        
        <div style="background: #d4edda; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3 style="margin-top: 0; color: #155724;">${mailDescription}</h3>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Payment Method:</strong> ${paymentMethod}</p>
          <p><strong>Transaction ID:</strong> ${transactionId}</p>
          <p><strong>Paid:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        
        <p>Your mail piece is now being processed and will be sent shortly.</p>
        <p>You can track its progress in your <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/mail/history">mail history</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Postmarkr. 
          <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/notifications/settings">Unsubscribe</a> from these notifications.
        </p>
      </div>
    `
  };
};

// Payment failed email
export const getPaymentFailedEmailContent = (notification: Notification, mailPiece?: MailPiece | null): NotificationEmailContent => {
  const mailDescription = mailPiece?.description || 'Untitled Mail Piece';
  const data = notification.data as any;
  const amount = data?.amount ? `$${(data.amount / 100).toFixed(2)}` : 'N/A';
  const failureReason = data?.failureReason || 'Unknown reason';
  
  return {
    subject: `Payment Failed - ${mailDescription}`,
    text: `We were unable to process your payment for "${mailDescription}". Amount: ${amount}. Reason: ${failureReason}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc3545;">💳 Payment Failed</h2>
        <p>We were unable to process your payment:</p>
        
        <div style="background: #f8d7da; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc3545;">
          <h3 style="margin-top: 0; color: #721c24;">${mailDescription}</h3>
          <p><strong>Amount:</strong> ${amount}</p>
          <p><strong>Reason:</strong> ${failureReason}</p>
          <p><strong>Failed:</strong> ${new Date(notification.createdAt).toLocaleString()}</p>
        </div>
        
        <p>Please update your payment method and try again, or contact support if you need assistance.</p>
        <p>You can retry payment in your <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/mail/history">mail history</a>.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated notification from Postmarkr. 
          <a href="${process.env.WASP_WEB_CLIENT_URL || 'http://localhost:3000'}/notifications/settings">Unsubscribe</a> from these notifications.
        </p>
      </div>
    `
  };
};
