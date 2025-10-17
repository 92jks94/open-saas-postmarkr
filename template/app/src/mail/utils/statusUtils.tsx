/**
 * Status utility functions for mail pieces
 * 
 * Note: getStatusIcon and getStatusBadgeVariant are available from '../columns'
 * This file contains only NEW utilities that don't duplicate existing code
 */

/**
 * Get description for mail piece status
 */
export function getStatusDescription(status: string): string {
  const descriptions: Record<string, string> = {
    'draft': 'Mail piece is in draft status and ready for payment',
    'pending_payment': 'Payment is required before processing can begin',
    'paid': 'Payment confirmed, preparing for submission',
    'submitted': 'Submitted to Lob for processing',
    'processing': 'Your mail piece is being processed and prepared for delivery',
    'in_transit': 'Your mail piece is in transit to the destination',
    'delivered': 'Mail piece has been successfully delivered',
    'failed': 'Processing failed - please contact support',
    'returned': 'Mail piece was returned to sender'
  };
  return descriptions[status] || 'Unknown status';
}

/**
 * Get progress percentage for mail piece status
 */
export function getStatusProgress(status: string): number {
  const statusProgress: Record<string, number> = {
    'draft': 10,
    'pending_payment': 20,
    'paid': 30,
    'submitted': 40,
    'processing': 60,
    'in_transit': 80,
    'delivered': 100,
    'failed': 0,
    'returned': 0
  };
  return statusProgress[status] || 0;
}

