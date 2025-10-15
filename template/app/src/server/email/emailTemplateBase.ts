/**
 * Shared Email Template Base
 * 
 * This module contains the base HTML structure and shared CSS styles
 * used across all email templates to ensure consistency and maintainability.
 */

/**
 * Get shared CSS styles for all emails
 * These styles ensure consistent branding and responsive design
 */
function getSharedEmailStyles(): string {
  return `
<style>
  body { 
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; 
    line-height: 1.6; 
    color: #333; 
    margin: 0; 
    padding: 0; 
    background-color: #f4f4f4; 
  }
  .container { 
    max-width: 600px; 
    margin: 0 auto; 
    background-color: #ffffff; 
  }
  .header { 
    color: #ffffff; 
    padding: 30px 20px; 
    text-align: center; 
  }
  .header h1 { 
    margin: 0; 
    font-size: 24px; 
  }
  .content { 
    padding: 30px 20px; 
  }
  .icon { 
    font-size: 48px; 
    text-align: center; 
    margin-bottom: 20px; 
  }
  .section { 
    margin-bottom: 30px; 
  }
  .section-title { 
    font-size: 18px; 
    font-weight: 600; 
    margin-bottom: 10px; 
    border-bottom: 2px solid #E5E7EB; 
    padding-bottom: 5px; 
  }
  .detail-row { 
    margin-bottom: 8px; 
  }
  .detail-label { 
    font-weight: 600; 
    color: #6B7280; 
  }
  .address-block { 
    background-color: #F9FAFB; 
    padding: 15px; 
    border-radius: 8px; 
    margin-bottom: 15px; 
    border-left: 4px solid currentColor; 
  }
  .address-label { 
    font-size: 12px; 
    font-weight: 600; 
    color: #6B7280; 
    text-transform: uppercase; 
    margin-bottom: 5px; 
  }
  .cta-button { 
    display: inline-block; 
    color: #ffffff !important; 
    padding: 14px 28px; 
    text-decoration: none; 
    border-radius: 8px; 
    font-weight: 600; 
    margin: 20px 0; 
  }
  .cta-button:hover { 
    opacity: 0.9; 
  }
  .footer { 
    background-color: #F9FAFB; 
    padding: 20px; 
    text-align: center; 
    font-size: 14px; 
    color: #6B7280; 
    border-top: 1px solid #E5E7EB; 
  }
  .highlight { 
    background-color: #FEF3C7; 
    padding: 2px 6px; 
    border-radius: 4px; 
  }
</style>
  `;
}

/**
 * Get shared email footer
 */
function getSharedFooter(): string {
  return `
<div class="footer">
  <p><strong>Postmarkr</strong> - Physical Mail Made Simple</p>
  <p>Questions? Reply to this email or contact <a href="mailto:support@postmarkr.com">support@postmarkr.com</a></p>
</div>
  `;
}

/**
 * Color palette for different email types
 */
export const EmailColors = {
  primary: '#4F46E5',    // Indigo - Payment confirmation, general
  success: '#10B981',    // Green - Submitted, delivered
  warning: '#F59E0B',    // Amber - In transit, payment issues
  error: '#EF4444',      // Red - Failed delivery
  purple: '#7C3AED',     // Purple - Welcome email
  green: '#10B981',      // Green - Mail sent
  orange: '#F59E0B',     // Orange - Processed for delivery
  blue: '#3B82F6',       // Blue - Re-routed
} as const;

/**
 * Create a complete email HTML structure with consistent styling
 * 
 * @param options Configuration for the email template
 * @returns Complete HTML email string
 */
export function createEmailTemplate(options: {
  headerTitle: string;
  headerColor: string;
  headerIcon?: string;
  bodyContent: string;
}): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${getSharedEmailStyles()}
</head>
<body>
  <div class="container">
    <div class="header" style="background-color: ${options.headerColor}">
      <h1>${options.headerIcon || ''} ${options.headerTitle}</h1>
    </div>
    
    <div class="content">
      ${options.bodyContent}
    </div>
    
    ${getSharedFooter()}
  </div>
</body>
</html>
  `;
}

/**
 * Convert MailAddress from database format (snake_case) to email template format (camelCase)
 */
export function convertMailAddressForEmail(dbAddress: {
  contactName: string;
  address_line1: string;
  address_line2?: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
}): {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
} {
  return {
    name: dbAddress.contactName,
    addressLine1: dbAddress.address_line1,
    addressLine2: dbAddress.address_line2,
    city: dbAddress.address_city,
    state: dbAddress.address_state,
    zipCode: dbAddress.address_zip,
  };
}

/**
 * Format address as HTML block
 */
export function formatAddressHtml(address: {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}, label: string, borderColor: string = '#4F46E5'): string {
  return `
<div class="address-block" style="border-left-color: ${borderColor}">
  <div class="address-label">${label}</div>
  <strong>${address.name}</strong><br>
  ${address.addressLine1}${address.addressLine2 ? '<br>' + address.addressLine2 : ''}<br>
  ${address.city}, ${address.state} ${address.zipCode}
</div>
  `;
}

/**
 * Format address as plain text
 */
export function formatAddressText(address: {
  name: string;
  addressLine1: string;
  addressLine2?: string | null;
  city: string;
  state: string;
  zipCode: string;
}, label?: string): string {
  const lines = [
    label ? `${label}:` : '',
    address.name,
    address.addressLine1,
    address.addressLine2 || '',
    `${address.city}, ${address.state} ${address.zipCode}`
  ].filter(Boolean);
  
  return lines.join('\n');
}

/**
 * Create a CTA button with custom color
 */
export function createCtaButton(url: string, text: string, color: string = EmailColors.primary): string {
  return `<center><a href="${url}" class="cta-button" style="background-color: ${color}">${text}</a></center>`;
}

/**
 * Create a detail section with title
 */
export function createDetailSection(title: string, titleColor: string, content: string): string {
  return `
<div class="section">
  <div class="section-title" style="color: ${titleColor}">${title}</div>
  ${content}
</div>
  `;
}

