/**
 * Email Templates for Mail Notifications
 * 
 * This module contains all email template functions for mail-related notifications.
 * Each function returns an object with subject, text, and html content.
 */

import type { MailPiece, MailAddress, User } from 'wasp/entities';
import { 
  createEmailTemplate, 
  EmailColors, 
  formatAddressHtml, 
  formatAddressText, 
  createCtaButton,
  createDetailSection,
  convertMailAddressForEmail
} from './emailTemplateBase';
import { 
  formatCurrency, 
  formatDate
} from '../../mail/columns';
import { 
  formatMailClass,
  generateOrderNumber,
  formatAddressFull
} from '../../mail/utils/formatting';

// Helper to get mail type display name
function getMailTypeDisplay(mailType: string): string {
  const types: Record<string, string> = {
    'letter': 'Letter',
    'postcard': 'Postcard',
    'check': 'Check'
  };
  return types[mailType] || mailType;
}

// Helper to get mail class display name
function getMailClassDisplay(mailClass: string): string {
  const classes: Record<string, string> = {
    'usps_first_class': 'USPS First Class',
    'usps_standard': 'USPS Standard',
    'usps_express': 'USPS Express',
    'usps_priority': 'USPS Priority'
  };
  return classes[mailClass] || mailClass;
}

interface PaymentConfirmationData {
  mailPiece: MailPiece;
  recipientAddress: MailAddress;
  senderAddress: MailAddress;
  userName: string;
  userEmail: string;
  trackingUrl: string;
}

export function getPaymentConfirmationEmail(data: PaymentConfirmationData) {
  const { mailPiece, recipientAddress, senderAddress, userName, trackingUrl } = data;
  
  const mailType = getMailTypeDisplay(mailPiece.mailType);
  const mailClass = getMailClassDisplay(mailPiece.mailClass);
  const amount = mailPiece.cost ? formatCurrency(mailPiece.cost) : 'Processing';
  const estimatedDelivery = '3-5 business days';

  // Convert addresses to email format
  const senderForEmail = convertMailAddressForEmail(senderAddress);
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  // Plain text version
  const text = `
Hi ${userName},

Your payment has been confirmed and your mail is being processed!

PAYMENT RECEIPT
---------------
Mail Type: ${mailType}
Service: ${mailClass}
Amount Paid: ${amount}
Transaction ID: ${mailPiece.paymentIntentId || 'Processing'}

MAIL DETAILS
------------
${formatAddressText(senderForEmail, 'From')}

${formatAddressText(recipientForEmail, 'To')}

Estimated Delivery: ${estimatedDelivery}

Track your mail: ${trackingUrl}

Thank you for using Postmarkr!

Questions? Reply to this email or contact support@postmarkr.com

---
Postmarkr - Physical Mail Made Simple
  `;

  // HTML version using base template utilities
  const bodyContent = `
    <div class="icon">🎉</div>
    
    <p>Hi ${userName},</p>
    
    <p>Your payment has been confirmed and your mail is being processed! We'll send you updates as your mail progresses.</p>
    
    ${createDetailSection('📋 Payment Receipt', EmailColors.primary, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailType}</div>
      <div class="detail-row"><span class="detail-label">Service:</span> ${mailClass}</div>
      <div class="detail-row"><span class="detail-label">Amount Paid:</span> <strong>${amount}</strong></div>
      <div class="detail-row"><span class="detail-label">Transaction ID:</span> <code style="background: #f3f4f6; padding: 2px 6px; border-radius: 4px; font-size: 12px;">${mailPiece.paymentIntentId || 'Processing'}</code></div>
    `)}
    
    ${createDetailSection('📬 Mail Details', EmailColors.primary, `
      ${formatAddressHtml(senderForEmail, 'From', EmailColors.primary)}
      ${formatAddressHtml(recipientForEmail, 'To', EmailColors.primary)}
      <div class="detail-row">
        <span class="detail-label">Estimated Delivery:</span> 
        <span class="highlight">${estimatedDelivery}</span>
      </div>
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Your Mail', EmailColors.primary)}
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      Thank you for using Postmarkr! We'll notify you with updates as your mail is processed and delivered.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Payment Confirmed!',
    headerColor: EmailColors.primary,
    headerIcon: '✅',
    bodyContent
  });

  return {
    subject: `✅ Payment Confirmed - Your ${mailType} is Being Processed`,
    text,
    html
  };
}

interface MailSubmittedData {
  mailPiece: MailPiece;
  recipientAddress: MailAddress;
  userName: string;
  trackingUrl: string;
}

export function getMailSubmittedEmail(data: MailSubmittedData) {
  const { mailPiece, recipientAddress, userName, trackingUrl } = data;
  
  const mailType = getMailTypeDisplay(mailPiece.mailType);
  const estimatedDelivery = '3-5 business days';

  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Great news! Your mail has been submitted to our printing and mailing service and is now being processed.

MAIL DETAILS
------------
Mail Type: ${mailType}
${formatAddressText(recipientForEmail, 'To')}

Tracking Number: ${mailPiece.lobTrackingNumber || 'Will be available soon'}
Estimated Delivery: ${estimatedDelivery}

NEXT STEPS
----------
1. Your mail is being printed and prepared
2. It will be sent to USPS for delivery
3. We'll notify you when it's in transit

Track your mail: ${trackingUrl}

Thank you for using Postmarkr!

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">🚀</div>
    
    <p>Hi ${userName},</p>
    
    <p>Great news! Your mail has been submitted to our printing and mailing service and is now being processed.</p>
    
    ${createDetailSection('📋 Mail Details', EmailColors.success, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailType}</div>
      <div class="detail-row"><span class="detail-label">Tracking Number:</span> ${mailPiece.lobTrackingNumber || 'Will be available soon'}</div>
      <div class="detail-row"><span class="detail-label">Estimated Delivery:</span> <strong>${estimatedDelivery}</strong></div>
    `)}
    
    ${createDetailSection('📍 Delivery Address', EmailColors.success, `
      ${formatAddressHtml(recipientForEmail, '', EmailColors.success)}
    `)}
    
    ${createDetailSection('📍 Next Steps', EmailColors.success, `
      <div style="margin: 20px 0;">
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 30px; height: 30px; background-color: #10B981; color: white; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: 600;">✓</div>
          <div>
            <strong>Print & Prepare</strong><br>
            <small style="color: #6B7280;">Your mail is being printed and prepared (current)</small>
          </div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 30px; height: 30px; background-color: #E5E7EB; color: #9CA3AF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: 600;">2</div>
          <div>
            <strong>Send to USPS</strong><br>
            <small style="color: #6B7280;">Mail will be handed to USPS</small>
          </div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 30px; height: 30px; background-color: #E5E7EB; color: #9CA3AF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: 600;">3</div>
          <div>
            <strong>In Transit</strong><br>
            <small style="color: #6B7280;">On its way to recipient</small>
          </div>
        </div>
        <div style="display: flex; align-items: center; margin-bottom: 15px;">
          <div style="width: 30px; height: 30px; background-color: #E5E7EB; color: #9CA3AF; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; font-weight: 600;">4</div>
          <div>
            <strong>Delivered</strong><br>
            <small style="color: #6B7280;">Successfully delivered</small>
          </div>
        </div>
      </div>
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Your Mail', EmailColors.success)}
  `;

  const html = createEmailTemplate({
    headerTitle: 'Mail Submitted!',
    headerColor: EmailColors.success,
    headerIcon: '📬',
    bodyContent
  });

  return {
    subject: `📬 Your ${mailType} is Now in Production`,
    text,
    html
  };
}

interface InTransitData {
  mailPiece: MailPiece;
  recipientAddress: MailAddress;
  userName: string;
  trackingUrl: string;
}

export function getInTransitEmail(data: InTransitData) {
  const { mailPiece, recipientAddress, userName, trackingUrl } = data;
  
  const mailType = getMailTypeDisplay(mailPiece.mailType);
  const estimatedDelivery = 'Soon';

  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Your mail is now in transit and on its way to the recipient!

DELIVERY STATUS
---------------
Status: In Transit
${formatAddressText(recipientForEmail, 'To')}

Tracking Number: ${mailPiece.lobTrackingNumber || 'N/A'}
Estimated Delivery: ${estimatedDelivery}

Track your mail: ${trackingUrl}

We'll notify you when it's delivered!

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">📦</div>
    
    <p>Hi ${userName},</p>
    
    <p>Your mail is now in transit and on its way to the recipient!</p>
    
    <center>
      <div style="display: inline-block; background-color: #FEF3C7; color: #92400E; padding: 8px 16px; border-radius: 20px; font-weight: 600; margin: 10px 0;">📍 IN TRANSIT</div>
    </center>
    
    ${createDetailSection('📋 Delivery Details', EmailColors.warning, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailType}</div>
      <div class="detail-row"><span class="detail-label">Tracking Number:</span> ${mailPiece.lobTrackingNumber || 'N/A'}</div>
      <div class="detail-row"><span class="detail-label">Estimated Delivery:</span> <strong>${estimatedDelivery}</strong></div>
    `)}
    
    ${createDetailSection('📍 Delivery Address', EmailColors.warning, `
      ${formatAddressHtml(recipientForEmail, '', EmailColors.warning)}
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Your Mail', EmailColors.warning)}
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      We'll send you another notification once your mail has been delivered!
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Mail In Transit',
    headerColor: EmailColors.warning,
    headerIcon: '🚚',
    bodyContent
  });

  return {
    subject: `🚚 Your ${mailType} is In Transit`,
    text,
    html
  };
}

interface DeliveryConfirmationData {
  mailPiece: MailPiece;
  recipientAddress: MailAddress;
  userName: string;
  trackingUrl: string;
  deliveryDate?: Date | string;
}

export function getDeliveryConfirmationEmail(data: DeliveryConfirmationData) {
  const { mailPiece, recipientAddress, userName, trackingUrl, deliveryDate } = data;
  
  const mailType = getMailTypeDisplay(mailPiece.mailType);
  const deliveredOn = deliveryDate ? formatDate(deliveryDate) : formatDate(new Date());

  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Great news! Your mail has been successfully delivered!

DELIVERY CONFIRMATION
---------------------
Delivered On: ${deliveredOn}
Mail Type: ${mailType}
Tracking Number: ${mailPiece.lobTrackingNumber || 'N/A'}

${formatAddressText(recipientForEmail, 'Delivered To')}

View full delivery details: ${trackingUrl}

Thank you for using Postmarkr! We hope your mail arrived safely.

Need to send more mail? Visit https://postmarkr.com

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">🎉</div>
    
    <div style="background: linear-gradient(135deg, #10B981 0%, #059669 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; margin-bottom: 30px;">
      <h2 style="margin: 0 0 10px 0; font-size: 24px;">Successfully Delivered!</h2>
      <p style="margin: 0;">Your mail has reached its destination</p>
    </div>
    
    <p>Hi ${userName},</p>
    
    <p>Great news! Your mail has been successfully delivered to the recipient.</p>
    
    ${createDetailSection('📋 Delivery Details', EmailColors.success, `
      <div class="detail-row"><span class="detail-label">Delivered On:</span> <strong>${deliveredOn}</strong></div>
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailType}</div>
      <div class="detail-row"><span class="detail-label">Tracking Number:</span> ${mailPiece.lobTrackingNumber || 'N/A'}</div>
    `)}
    
    ${createDetailSection('📍 Delivered To', EmailColors.success, `
      <div style="background-color: #F0FDF4; padding: 15px; border-radius: 8px; border-left: 4px solid #10B981;">
        <strong>${recipientForEmail.name}</strong><br>
        ${recipientForEmail.addressLine1}${recipientForEmail.addressLine2 ? '<br>' + recipientForEmail.addressLine2 : ''}<br>
        ${recipientForEmail.city}, ${recipientForEmail.state} ${recipientForEmail.zipCode}
      </div>
    `)}
    
    <center>
      ${createCtaButton(trackingUrl, 'View Delivery Details', EmailColors.success)}
      <br>
      <a href="https://postmarkr.com/mail/create" style="display: inline-block; background-color: #ffffff; color: #10B981 !important; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; border: 2px solid #10B981;">Send More Mail</a>
    </center>
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      Thank you for using Postmarkr! We hope your mail arrived safely and on time.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Delivery Confirmed!',
    headerColor: EmailColors.success,
    headerIcon: '✉️',
    bodyContent
  });

  return {
    subject: `✉️ Delivered: Your ${mailType} Has Been Delivered`,
    text,
    html
  };
}

interface DeliveryFailedData {
  mailPiece: MailPiece;
  recipientAddress: MailAddress;
  userName: string;
  userEmail: string;
  failureReason?: string;
}

export function getDeliveryFailedEmail(data: DeliveryFailedData) {
  const { mailPiece, recipientAddress, userName, failureReason } = data;
  
  const mailType = getMailTypeDisplay(mailPiece.mailType);
  const reason = failureReason || 'The mail could not be delivered to the specified address';
  const amount = mailPiece.cost ? formatCurrency(mailPiece.cost) : 'your payment';

  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Unfortunately, we need to inform you that your mail could not be delivered.

DELIVERY FAILURE DETAILS
------------------------
Mail Type: ${mailType}
Tracking Number: ${mailPiece.lobTrackingNumber || 'N/A'}
Reason: ${reason}

${formatAddressText(recipientForEmail, 'Attempted Delivery To')}

WHAT HAPPENS NEXT?
-------------------
1. We will automatically process a refund of ${amount}
2. The refund will be processed within 5-7 business days
3. You will receive a refund confirmation email

WHAT YOU CAN DO:
----------------
• Verify the delivery address is correct
• Try sending again with updated address
• Contact us if you need assistance

Contact Support: support@postmarkr.com or reply to this email

We apologize for the inconvenience.

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">📭</div>
    
    <p>Hi ${userName},</p>
    
    <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <strong style="color: #DC2626;">⚠️ Action Required:</strong> Unfortunately, we need to inform you that your mail could not be delivered.
    </div>
    
    ${createDetailSection('📋 Failure Details', EmailColors.error, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailType}</div>
      <div class="detail-row"><span class="detail-label">Tracking Number:</span> ${mailPiece.lobTrackingNumber || 'N/A'}</div>
      <div class="detail-row"><span class="detail-label">Reason:</span> <span style="color: #DC2626;">${reason}</span></div>
    `)}
    
    ${createDetailSection('📍 Attempted Delivery To', EmailColors.error, `
      ${formatAddressHtml(recipientForEmail, '', EmailColors.error)}
    `)}
    
    ${createDetailSection('💰 Refund Information', EmailColors.error, `
      <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; border-radius: 8px;">
        <ul style="margin: 10px 0; padding-left: 20px;">
          <li>We will automatically process a refund of <strong>${amount}</strong></li>
          <li>Refund will be processed within <strong>5-7 business days</strong></li>
          <li>You will receive a refund confirmation email</li>
        </ul>
      </div>
    `)}
    
    ${createDetailSection('🔧 What You Can Do', EmailColors.error, `
      <ul style="color: #6B7280;">
        <li>Verify the delivery address is correct</li>
        <li>Try sending again with an updated address</li>
        <li>Contact us if you need assistance</li>
      </ul>
    `)}
    
    ${createCtaButton('https://postmarkr.com/mail/create', 'Send Mail Again', EmailColors.primary)}
    
    <p style="margin-top: 30px; padding: 15px; background-color: #FEF3C7; border-radius: 8px; font-size: 14px;">
      <strong>Need Help?</strong><br>
      Contact us at <a href="mailto:support@postmarkr.com">support@postmarkr.com</a> or reply to this email. We're here to help!
    </p>
    
    <p style="text-align: center; color: #6B7280; font-size: 14px;">
      We apologize for the inconvenience and appreciate your understanding.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Delivery Failed',
    headerColor: EmailColors.error,
    headerIcon: '⚠️',
    bodyContent
  });

  return {
    subject: `⚠️ Delivery Failed: Action Required for Your ${mailType}`,
    text,
    html
  };
}

interface PaymentFailedData {
  userName: string;
  userEmail: string;
  mailType: string;
  amount: number;
  failureReason?: string;
  retryUrl: string;
}

export function getPaymentFailedEmail(data: PaymentFailedData) {
  const { userName, mailType, amount, failureReason, retryUrl } = data;
  
  const mailTypeDisplay = getMailTypeDisplay(mailType);
  const amountDisplay = formatCurrency(amount);
  const reason = failureReason || 'Your payment could not be processed';

  const text = `
Hi ${userName},

We were unable to process your payment for your mail order.

PAYMENT DETAILS
---------------
Mail Type: ${mailTypeDisplay}
Amount: ${amountDisplay}
Reason: ${reason}

NEXT STEPS
----------
1. Check your payment method is valid
2. Ensure you have sufficient funds
3. Try again using the link below

Retry Payment: ${retryUrl}

Your mail order is saved and waiting for successful payment. It will expire in 24 hours if payment is not completed.

Need help? Contact us at support@postmarkr.com

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">💳</div>
    
    <p>Hi ${userName},</p>
    
    <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
      <strong style="color: #92400E;">⚠️ Payment Issue:</strong> We were unable to process your payment for your mail order.
    </div>
    
    ${createDetailSection('📋 Payment Details', EmailColors.warning, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailTypeDisplay}</div>
      <div class="detail-row"><span class="detail-label">Amount:</span> <strong>${amountDisplay}</strong></div>
      <div class="detail-row"><span class="detail-label">Reason:</span> <span style="color: #DC2626;">${reason}</span></div>
    `)}
    
    ${createDetailSection('🔧 Next Steps', EmailColors.warning, `
      <div style="background-color: #F0FDF4; border-left: 4px solid #10B981; padding: 15px; border-radius: 8px;">
        <ol style="margin: 10px 0; padding-left: 20px;">
          <li>Check your payment method is valid and up-to-date</li>
          <li>Ensure you have sufficient funds available</li>
          <li>Try your payment again using the button below</li>
        </ol>
      </div>
    `)}
    
    ${createCtaButton(retryUrl, 'Retry Payment Now', EmailColors.warning)}
    
    <div style="background-color: #FEE2E2; padding: 15px; border-radius: 8px; border-left: 4px solid #EF4444; margin: 20px 0;">
      <strong>⏰ Important:</strong> Your mail order is saved and waiting for successful payment. It will expire in <strong>24 hours</strong> if payment is not completed.
    </div>
    
    <p style="margin-top: 30px; padding: 15px; background-color: #F3F4F6; border-radius: 8px; font-size: 14px;">
      <strong>Need Help?</strong><br>
      Having trouble with payment? Contact us at <a href="mailto:support@postmarkr.com">support@postmarkr.com</a> and we'll assist you right away.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Payment Failed',
    headerColor: EmailColors.warning,
    headerIcon: '⚠️',
    bodyContent
  });

  return {
    subject: `⚠️ Payment Failed for Your ${mailTypeDisplay}`,
    text,
    html
  };
}

interface WelcomeEmailData {
  userName: string;
  userEmail: string;
}

export function getWelcomeEmail(data: WelcomeEmailData) {
  const { userName } = data;

  const text = `
Hi ${userName},

Welcome to Postmarkr! We're thrilled to have you here. 🎉

With Postmarkr, sending physical mail is as easy as sending an email:
1. Upload your PDF document
2. Enter sender and recipient addresses
3. Choose your mail service (First Class, Certified, Priority, etc.)
4. Pay and track your delivery

GETTING STARTED
----------------
• Create Your First Mail: https://postmarkr.com/mail/create
• Manage Addresses: https://postmarkr.com/addresses
• View Pricing: https://postmarkr.com/pricing

PERFECT FOR
-----------
✓ Legal documents and contracts
✓ Business correspondence
✓ Important notices
✓ Personal letters
✓ Real estate documents

WHY POSTMARKR?
--------------
• Professional mail processing with Lob
• Real-time tracking and delivery confirmation
• Competitive pricing with transparent costs
• Secure handling of your documents

Ready to send your first mail piece? Just click the link below!

Get Started: https://postmarkr.com/mail/create

Questions? We're here to help!
• Email: support@postmarkr.com
• Visit our Help Center: https://postmarkr.com/help

Thank you for choosing Postmarkr!

Best regards,
The Postmarkr Team

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div style="font-size: 64px; text-align: center; margin-bottom: 20px;">📬</div>
    
    <p style="text-align: center; font-size: 18px; color: #6B7280; margin-bottom: 30px;">
      Hi ${userName}, we're thrilled to have you here!
    </p>
    
    <p style="font-size: 16px; color: #4B5563;">
      With Postmarkr, sending physical mail is as easy as sending an email. Let's get you started!
    </p>
    
    ${createDetailSection('🚀 How It Works', EmailColors.primary, `
      <div style="background: linear-gradient(135deg, #F0FDF4 0%, #DBEAFE 100%); padding: 20px; border-radius: 8px; border-left: 4px solid #4F46E5;">
        <ol style="margin: 0; padding-left: 20px;">
          <li style="margin-bottom: 10px; font-weight: 500;">Upload your PDF document</li>
          <li style="margin-bottom: 10px; font-weight: 500;">Enter sender and recipient addresses</li>
          <li style="margin-bottom: 10px; font-weight: 500;">Choose your mail service (First Class, Certified, etc.)</li>
          <li style="margin-bottom: 10px; font-weight: 500;">Pay and track your delivery in real-time</li>
        </ol>
      </div>
    `)}
    
    <center>
      <a href="https://postmarkr.com/mail/create" style="display: inline-block; background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); color: #ffffff !important; padding: 16px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px; margin: 20px 0; box-shadow: 0 4px 6px rgba(79, 70, 229, 0.3);">Send Your First Mail →</a>
    </center>
    
    ${createDetailSection('✨ Perfect For', EmailColors.primary, `
      <ul style="list-style: none; padding: 0; margin: 0;">
        <li style="padding: 10px 0; padding-left: 30px; position: relative;"><span style="position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px;">✓</span> Legal documents and contracts</li>
        <li style="padding: 10px 0; padding-left: 30px; position: relative;"><span style="position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px;">✓</span> Business correspondence</li>
        <li style="padding: 10px 0; padding-left: 30px; position: relative;"><span style="position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px;">✓</span> Important notices</li>
        <li style="padding: 10px 0; padding-left: 30px; position: relative;"><span style="position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px;">✓</span> Personal letters</li>
        <li style="padding: 10px 0; padding-left: 30px; position: relative;"><span style="position: absolute; left: 0; color: #10B981; font-weight: bold; font-size: 18px;">✓</span> Real estate documents</li>
      </ul>
    `)}
    
    ${createDetailSection('💡 Why Choose Postmarkr?', EmailColors.primary, `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0;">
        <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">🏆</div>
          <strong>Professional</strong>
          <p style="font-size: 14px; color: #6B7280; margin: 5px 0 0 0;">Powered by Lob for reliable delivery</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">📍</div>
          <strong>Track Everything</strong>
          <p style="font-size: 14px; color: #6B7280; margin: 5px 0 0 0;">Real-time delivery tracking</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">💰</div>
          <strong>Transparent</strong>
          <p style="font-size: 14px; color: #6B7280; margin: 5px 0 0 0;">No hidden fees or surprises</p>
        </div>
        <div style="background-color: #F9FAFB; padding: 15px; border-radius: 8px; text-align: center;">
          <div style="font-size: 32px; margin-bottom: 10px;">🔒</div>
          <strong>Secure</strong>
          <p style="font-size: 14px; color: #6B7280; margin: 5px 0 0 0;">Your documents stay private</p>
        </div>
      </div>
    `)}
    
    <div style="background-color: #F9FAFB; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <div style="font-size: 18px; font-weight: 600; color: #4F46E5; margin-bottom: 15px;">🔗 Quick Links</div>
      <a href="https://postmarkr.com/mail/create" style="display: block; color: #4F46E5; text-decoration: none; padding: 8px 0; font-weight: 500;">→ Create Your First Mail</a>
      <a href="https://postmarkr.com/addresses" style="display: block; color: #4F46E5; text-decoration: none; padding: 8px 0; font-weight: 500;">→ Manage Addresses</a>
      <a href="https://postmarkr.com/pricing" style="display: block; color: #4F46E5; text-decoration: none; padding: 8px 0; font-weight: 500;">→ View Pricing</a>
      <a href="https://postmarkr.com/help" style="display: block; color: #4F46E5; text-decoration: none; padding: 8px 0; font-weight: 500;">→ Help Center</a>
    </div>
    
    <p style="margin-top: 30px; padding: 20px; background: linear-gradient(135deg, #FEF3C7 0%, #DBEAFE 100%); border-radius: 8px; text-align: center;">
      <strong>Need Help Getting Started?</strong><br>
      <span style="font-size: 14px; color: #6B7280;">
        We're here for you! Email <a href="mailto:support@postmarkr.com" style="color: #4F46E5;">support@postmarkr.com</a> with any questions.
      </span>
    </p>
    
    <p style="text-align: center; color: #6B7280; margin-top: 30px;">
      Thank you for choosing Postmarkr!<br>
      <strong>The Postmarkr Team</strong>
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: '🎉 Welcome to Postmarkr!',
    headerColor: EmailColors.purple,
    bodyContent: `
      <div style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9; text-align: center; color: #fff;">Physical Mail Made Simple</div>
      ${bodyContent}
    `
  });

  return {
    subject: '🎉 Welcome to Postmarkr - Send Physical Mail in Minutes',
    text,
    html
  };
}

/**
 * Get mailed email template
 * Sent when mail is handed off to USPS
 */
export function getMailedEmail(data: {
  userName: string;
  mailType: string;
  recipientAddress: MailAddress;
  trackingUrl: string;
  expectedDeliveryDate?: Date;
}): { subject: string; text: string; html: string } {
  const { userName, mailType, recipientAddress, trackingUrl, expectedDeliveryDate } = data;
  const mailTypeDisplay = getMailTypeDisplay(mailType);
  
  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Great news! Your ${mailTypeDisplay.toLowerCase()} has been mailed and is now in the hands of USPS.

MAIL DETAILS
------------
Mail Type: ${mailTypeDisplay}
${formatAddressText(recipientForEmail, 'To')}

${expectedDeliveryDate ? `Expected Delivery: ${formatDate(expectedDeliveryDate)}` : ''}

NEXT STEPS
----------
1. Your mail is now in USPS hands
2. It will be processed through their network
3. We'll notify you when it's in transit

Track your mail: ${trackingUrl}

Thank you for using Postmarkr!

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">📮</div>
    
    <p>Hi ${userName},</p>
    
    <p>Great news! Your ${mailTypeDisplay.toLowerCase()} has been mailed and is now in the hands of USPS.</p>
    
    ${createDetailSection('📬 Mail Details', EmailColors.success, `
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailTypeDisplay}</div>
      ${formatAddressHtml(recipientForEmail, 'To', EmailColors.success)}
      ${expectedDeliveryDate ? `
        <div class="detail-row">
          <span class="detail-label">Expected Delivery:</span> 
          <span class="highlight">${formatDate(expectedDeliveryDate)}</span>
        </div>
      ` : ''}
    `)}
    
    ${createDetailSection('📋 Next Steps', EmailColors.success, `
      <ol style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Your mail is now in USPS hands</li>
        <li style="margin-bottom: 8px;">It will be processed through their network</li>
        <li style="margin-bottom: 8px;">We'll notify you when it's in transit</li>
      </ol>
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Your Mail', EmailColors.success)}
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      Thank you for using Postmarkr! We'll notify you with updates as your mail progresses.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Mail Sent!',
    headerColor: EmailColors.success,
    headerIcon: '📮',
    bodyContent
  });

  return {
    subject: `📮 Your ${mailTypeDisplay} Has Been Mailed`,
    text,
    html
  };
}

/**
 * Get processed for delivery email template
 * Sent when mail reaches destination facility
 */
export function getProcessedForDeliveryEmail(data: {
  userName: string;
  mailType: string;
  recipientAddress: MailAddress;
  trackingUrl: string;
  expectedDeliveryDate?: Date;
  location?: string;
}): { subject: string; text: string; html: string } {
  const { userName, mailType, recipientAddress, trackingUrl, expectedDeliveryDate, location } = data;
  const mailTypeDisplay = getMailTypeDisplay(mailType);
  
  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Exciting news! Your ${mailTypeDisplay.toLowerCase()} has arrived at the destination facility and is being processed for delivery.

DELIVERY STATUS
---------------
Status: At Destination Facility
${formatAddressText(recipientForEmail, 'To')}

${location ? `Current Location: ${location}` : ''}
${expectedDeliveryDate ? `Expected Delivery: ${formatDate(expectedDeliveryDate)}` : 'Should arrive within 1 business day'}

Track your mail: ${trackingUrl}

Your mail should be delivered very soon!

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">📍</div>
    
    <p>Hi ${userName},</p>
    
    <p>Exciting news! Your ${mailTypeDisplay.toLowerCase()} has arrived at the destination facility and is being processed for delivery.</p>
    
    ${createDetailSection('📬 Delivery Status', EmailColors.warning, `
      <div class="detail-row"><span class="detail-label">Status:</span> <span class="highlight">At Destination Facility</span></div>
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailTypeDisplay}</div>
      ${formatAddressHtml(recipientForEmail, 'To', EmailColors.warning)}
      ${location ? `
        <div class="detail-row">
          <span class="detail-label">Current Location:</span> 
          <span class="highlight">${location}</span>
        </div>
      ` : ''}
      ${expectedDeliveryDate ? `
        <div class="detail-row">
          <span class="detail-label">Expected Delivery:</span> 
          <span class="highlight">${formatDate(expectedDeliveryDate)}</span>
        </div>
      ` : `
        <div class="detail-row">
          <span class="detail-label">Delivery Timeline:</span> 
          <span class="highlight">Should arrive within 1 business day</span>
        </div>
      `}
    `)}
    
    ${createDetailSection('🎯 Almost There!', EmailColors.warning, `
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Your mail is at the final destination facility</li>
        <li style="margin-bottom: 8px;">It will be sorted and prepared for delivery</li>
        <li style="margin-bottom: 8px;">You'll get a final notification when delivered</li>
      </ul>
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Delivery', EmailColors.warning)}
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      Thank you for using Postmarkr! We'll notify you when your mail is delivered.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Almost There!',
    headerColor: EmailColors.warning,
    headerIcon: '📍',
    bodyContent
  });

  return {
    subject: `📍 Your ${mailTypeDisplay} is Almost There!`,
    text,
    html
  };
}

/**
 * Get re-routed email template
 * Sent when mail is re-routed due to address changes
 */
export function getReRoutedEmail(data: {
  userName: string;
  mailType: string;
  recipientAddress: MailAddress;
  trackingUrl: string;
  reason?: string;
}): { subject: string; text: string; html: string } {
  const { userName, mailType, recipientAddress, trackingUrl, reason } = data;
  const mailTypeDisplay = getMailTypeDisplay(mailType);
  
  // Convert address to email format
  const recipientForEmail = convertMailAddressForEmail(recipientAddress);

  const text = `
Hi ${userName},

Your ${mailTypeDisplay.toLowerCase()} has been re-routed due to address changes or corrections.

MAIL STATUS
-----------
Status: Re-Routed
${formatAddressText(recipientForEmail, 'To')}

${reason ? `Reason: ${reason}` : 'This typically happens when USPS has updated address information.'}

WHAT THIS MEANS
---------------
• Re-routing is normal and happens automatically
• USPS ensures your mail reaches the correct address
• Your mail will continue to its destination
• You'll still receive delivery confirmation

Track your mail: ${trackingUrl}

Don't worry - this is normal and your mail will still be delivered to the correct address.

---
Postmarkr - Physical Mail Made Simple
  `;

  const bodyContent = `
    <div class="icon">🔄</div>
    
    <p>Hi ${userName},</p>
    
    <p>Your ${mailTypeDisplay.toLowerCase()} has been re-routed due to address changes or corrections.</p>
    
    ${createDetailSection('📬 Mail Status', EmailColors.primary, `
      <div class="detail-row"><span class="detail-label">Status:</span> <span class="highlight">Re-Routed</span></div>
      <div class="detail-row"><span class="detail-label">Mail Type:</span> ${mailTypeDisplay}</div>
      ${formatAddressHtml(recipientForEmail, 'To', EmailColors.primary)}
      ${reason ? `
        <div class="detail-row">
          <span class="detail-label">Reason:</span> 
          <span class="highlight">${reason}</span>
        </div>
      ` : ''}
    `)}
    
    ${createDetailSection('✅ Don\'t Worry!', EmailColors.primary, `
      <ul style="margin: 0; padding-left: 20px;">
        <li style="margin-bottom: 8px;">Re-routing is normal and happens automatically</li>
        <li style="margin-bottom: 8px;">USPS ensures your mail reaches the correct address</li>
        <li style="margin-bottom: 8px;">Your mail will continue to its destination</li>
        <li style="margin-bottom: 8px;">You'll still receive delivery confirmation</li>
      </ul>
    `)}
    
    ${createDetailSection('💡 Why Does This Happen?', EmailColors.primary, `
      <p style="margin: 0; color: #4B5563; font-size: 14px;">
        USPS automatically re-routes mail when they have updated address information, 
        ensuring your mail reaches the correct destination even if the address has changed.
      </p>
    `)}
    
    ${createCtaButton(trackingUrl, 'Track Re-Routing', EmailColors.primary)}
    
    <p style="margin-top: 30px; font-size: 14px; color: #6B7280;">
      Thank you for using Postmarkr! Questions? We're here to help.
    </p>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Mail Re-Routed',
    headerColor: EmailColors.primary,
    headerIcon: '🔄',
    bodyContent
  });

  return {
    subject: `🔄 Your ${mailTypeDisplay} Has Been Re-Routed`,
    text,
    html
  };
}

/**
 * Get receipt email template
 * Sent when user requests receipt via email
 */
interface ReceiptEmailData {
  mailPiece: any;
  recipientAddress: any;
  senderAddress: any;
  userName: string;
  userEmail: string;
  trackingUrl: string;
  hasPDFAttachment: boolean;
}

export function getReceiptEmail(data: ReceiptEmailData) {
  const { mailPiece, recipientAddress, senderAddress, userName, trackingUrl, hasPDFAttachment } = data;
  
  const orderNumber = generateOrderNumber(mailPiece.paymentIntentId, mailPiece.id);
  const mailTypeDisplay = getMailTypeDisplay(mailPiece.mailType);
  const cost = formatCurrency(mailPiece.cost || mailPiece.customerPrice || 0);
  
  const text = `
Hi ${userName},

Here's your receipt for Order #${orderNumber}:

ORDER DETAILS
-------------
Order Number: ${orderNumber}
Order Date: ${formatDate(mailPiece.createdAt)}
Status: ${mailPiece.status.replace('_', ' ').toUpperCase()}
Payment: ${mailPiece.paymentStatus.toUpperCase()}

MAIL SPECIFICATIONS
-------------------
Type: ${mailPiece.mailType}
Class: ${formatMailClass(mailPiece.mailClass)}
Size: ${mailPiece.mailSize}
${mailPiece.pageCount ? `Pages: ${mailPiece.pageCount}` : ''}
${mailPiece.lobTrackingNumber ? `Tracking: ${mailPiece.lobTrackingNumber}` : ''}

FROM ADDRESS
------------
${formatAddressFull(senderAddress).join('\n')}

TO ADDRESS
----------
${formatAddressFull(recipientAddress).join('\n')}

COST BREAKDOWN
--------------
Total: ${cost}

${hasPDFAttachment ? 'A detailed PDF receipt is attached to this email.' : 'A text receipt is attached to this email.'}

TRACK YOUR MAIL
---------------
View full details and track delivery: ${trackingUrl}

Questions? We're here to help!
• Email: support@postmarkr.com
• Visit our Help Center: https://postmarkr.com/help

Thank you for choosing Postmarkr!

Best regards,
The Postmarkr Team

---
Postmarkr - Physical Mail Made Simple
  `.trim();

  const bodyContent = `
    <div style="font-size: 64px; text-align: center; margin-bottom: 20px;">📄</div>
    
    <p style="text-align: center; font-size: 18px; color: #6B7280; margin-bottom: 30px;">
      Hi ${userName},
    </p>
    
    <p style="font-size: 16px; color: #374151; margin-bottom: 20px;">
      Here's your receipt for <strong>Order #${orderNumber}</strong>:
    </p>
    
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">Order Details</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
        <div><strong>Order Number:</strong> ${orderNumber}</div>
        <div><strong>Order Date:</strong> ${formatDate(mailPiece.createdAt)}</div>
        <div><strong>Status:</strong> ${mailPiece.status.replace('_', ' ').toUpperCase()}</div>
        <div><strong>Payment:</strong> ${mailPiece.paymentStatus.toUpperCase()}</div>
      </div>
    </div>
    
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">Mail Specifications</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 14px;">
        <div><strong>Type:</strong> ${mailPiece.mailType}</div>
        <div><strong>Class:</strong> ${formatMailClass(mailPiece.mailClass)}</div>
        <div><strong>Size:</strong> ${mailPiece.mailSize}</div>
        ${mailPiece.pageCount ? `<div><strong>Pages:</strong> ${mailPiece.pageCount}</div>` : ''}
        ${mailPiece.lobTrackingNumber ? `<div><strong>Tracking:</strong> ${mailPiece.lobTrackingNumber}</div>` : ''}
      </div>
    </div>
    
    <div style="background: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">Addresses</h3>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; font-size: 14px;">
        <div>
          <strong>From:</strong><br>
          ${formatAddressFull(senderAddress).map(line => `${line}<br>`).join('')}
        </div>
        <div>
          <strong>To:</strong><br>
          ${formatAddressFull(recipientAddress).map(line => `${line}<br>`).join('')}
        </div>
      </div>
    </div>
    
    <div style="background: #F0FDF4; border: 1px solid #BBF7D0; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <h3 style="color: #111827; margin: 0 0 15px 0; font-size: 16px;">Cost Breakdown</h3>
      <div style="font-size: 18px; font-weight: bold; color: #059669;">
        Total: ${cost}
      </div>
    </div>
    
    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 8px; padding: 20px; margin: 20px 0;">
      <p style="margin: 0; font-size: 14px; color: #1E40AF;">
        ${hasPDFAttachment ? '📄 A detailed PDF receipt is attached to this email.' : '📄 A text receipt is attached to this email.'}
      </p>
    </div>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${trackingUrl}" 
         style="display: inline-block; background: #10B981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">
        Track Your Mail
      </a>
    </div>
    
    <div style="border-top: 1px solid #E5E7EB; padding-top: 20px; margin-top: 30px; font-size: 14px; color: #6B7280;">
      <p>Questions? We're here to help!</p>
      <p>• Email: support@postmarkr.com<br>
      • Visit our Help Center: <a href="https://postmarkr.com/help" style="color: #10B981;">https://postmarkr.com/help</a></p>
    </div>
  `;

  const html = createEmailTemplate({
    headerTitle: 'Your Order Receipt',
    headerColor: EmailColors.primary,
    headerIcon: '📄',
    bodyContent
  });

  return {
    subject: `📄 Receipt for Order #${orderNumber} - ${mailTypeDisplay}`,
    text,
    html
  };
}

