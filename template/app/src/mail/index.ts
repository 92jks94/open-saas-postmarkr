/**
 * Mail Module Exports
 * Centralized exports for mail-related components, types, and utilities
 * 
 * This module provides:
 * - TanStack Table column definitions and helpers
 * - Reusable mail components (cards, receipts, viewers)
 * - Formatting and status utilities (consolidated)
 * - Type definitions
 */

// ============================================================================
// TANSTACK TABLE - Column Definitions and Types
// ============================================================================

/**
 * TanStack Table integration for mail pieces
 * - Column definitions with sorting/filtering
 * - Type-safe column helpers
 */
export {
  createMailPieceColumns,
  mailPieceColumns,
  type MailPieceWithRelations,
} from './columns';

// ============================================================================
// UTILITIES - Consolidated from multiple sources
// ============================================================================

/**
 * All mail-related utility functions
 * Includes both existing utilities (from columns) and new utilities
 * Import everything from one place: import { formatDate, generateOrderNumber } from '@/mail/utils'
 */
export * from './utils';

// ============================================================================
// COMPONENTS - Reusable UI Components
// ============================================================================

/**
 * Mail-specific components
 */
export { MailPieceCard } from './components/MailPieceCard';
export { OrderReceipt } from './components/OrderReceipt';
export { PDFViewer } from './components/PDFViewer';
export { MailPreview } from './components/MailPreview';

