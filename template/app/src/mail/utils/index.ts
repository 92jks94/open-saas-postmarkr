/**
 * Mail Utilities - Barrel Export
 * 
 * Consolidates all mail-related utility functions from multiple sources:
 * - Existing utilities from columns.tsx (formatDate, formatCurrency, status utils)
 * - New formatting utilities (order numbers, addresses, cost breakdown)
 * - New status utilities (descriptions, progress)
 * 
 * Usage:
 * import { formatDate, generateOrderNumber, getStatusIcon } from '@/mail/utils';
 */

// ============================================================================
// EXISTING UTILITIES (from columns.tsx - already exported via mail/index.ts)
// ============================================================================

/**
 * Re-export existing utilities from columns for convenience
 * These are already battle-tested and used throughout the mail module
 */
export {
  formatDate,
  formatCurrency,
  getStatusIcon,
  getStatusBadgeVariant,
} from '../columns';

// ============================================================================
// NEW FORMATTING UTILITIES
// ============================================================================

/**
 * New formatting utilities that extend the existing ones
 * - Order number generation
 * - Short date format
 * - Mail class formatting
 * - Address formatting (compact and full)
 * - Cost breakdown calculation
 */
export {
  generateOrderNumber,
  formatDateShort,
  formatMailClass,
  formatAddressCompact,
  formatAddressFull,
  getCostBreakdown,
  isDraftReadyForPayment,
} from './formatting';

// ============================================================================
// NEW STATUS UTILITIES
// ============================================================================

/**
 * New status utilities that complement the existing ones
 * - Status descriptions
 * - Status progress percentages
 */
export {
  getStatusDescription,
  getStatusProgress,
} from './statusUtils';

