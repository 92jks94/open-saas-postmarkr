/**
 * Utility functions for formatting mail-related data
 * 
 * Note: formatDate and formatCurrency are available from '../columns'
 * This file contains only NEW utilities that don't duplicate existing code
 */

/**
 * Generate a user-friendly order number from payment intent ID or mail piece ID
 */
export function generateOrderNumber(paymentIntentId?: string | null, mailPieceId?: string): string {
  if (paymentIntentId) {
    // Use last 8 characters of payment intent ID
    return paymentIntentId.slice(-8).toUpperCase();
  }
  
  if (mailPieceId) {
    // Fallback to mail piece ID with prefix
    return `MP-${mailPieceId.slice(0, 8).toUpperCase()}`;
  }
  
  return 'N/A';
}

/**
 * Format date to short format (different from existing formatDate)
 */
export function formatDateShort(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format mail class for display
 */
export function formatMailClass(mailClass: string): string {
  const classes: Record<string, string> = {
    'usps_first_class': 'USPS First Class',
    'usps_express': 'USPS Express',
    'usps_priority': 'USPS Priority',
    'usps_standard': 'USPS Standard',
  };
  return classes[mailClass] || mailClass.replace('_', ' ').replace('usps ', 'USPS ');
}

/**
 * Format address for compact display
 */
export function formatAddressCompact(address: {
  contactName: string;
  companyName?: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
}): string {
  const name = address.contactName || address.companyName || 'Unknown';
  return `${name}, ${address.address_city}, ${address.address_state} ${address.address_zip}`;
}

/**
 * Format address for full display
 */
export function formatAddressFull(address: {
  contactName: string;
  companyName?: string | null;
  address_line1: string;
  address_line2?: string | null;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
}): string[] {
  const lines: string[] = [];
  
  if (address.contactName) {
    lines.push(address.contactName);
  }
  
  if (address.companyName) {
    lines.push(address.companyName);
  }
  
  lines.push(address.address_line1);
  
  if (address.address_line2) {
    lines.push(address.address_line2);
  }
  
  lines.push(`${address.address_city}, ${address.address_state} ${address.address_zip}`);
  lines.push(address.address_country);
  
  return lines;
}

/**
 * Get cost breakdown for display
 */
export function getCostBreakdown(totalCost: number, pageCount?: number | null): {
  subtotal: number;
  processing: number;
  total: number;
} {
  // Simple breakdown: 85% for mail service, 15% for processing
  const processing = totalCost * 0.15;
  const subtotal = totalCost - processing;
  
  return {
    subtotal: Math.max(0, subtotal),
    processing: Math.max(0, processing),
    total: totalCost
  };
}

