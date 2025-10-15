// ============================================================================
// SHARED STATUS UTILITIES
// ============================================================================
// This file contains shared utility functions for status styling and formatting
// across the mail system and admin interfaces.
//
// Features:
// - Consistent status badge styling across all components
// - Centralized status color management
// - Reusable status formatting functions
// - Type-safe status handling

/**
 * Get CSS classes for status badges based on status value
 * Used consistently across mail pieces, payments, and system status
 * 
 * @param status - The status string to get styling for
 * @returns CSS class string for Tailwind styling
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case 'paid':
    case 'delivered':
    case 'healthy':
    case 'fixed':
      return 'bg-green-100 text-green-800';
    case 'draft':
    case 'pending_payment':
    case 'degraded':
      return 'bg-yellow-100 text-yellow-800';
    case 'submitted':
    case 'processing':
    case 'in_transit':
      return 'bg-blue-100 text-blue-800';
    case 'failed':
    case 'returned':
    case 'unhealthy':
    case 'error':
      return 'bg-red-100 text-red-800';
    case 'submitted_to_lob':
      return 'bg-blue-100 text-blue-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

/**
 * Get Badge variant for Shadcn UI Badge component
 * Provides consistent styling across different status types
 * 
 * @param status - The status string to get variant for
 * @returns Badge variant string
 */
export function getStatusBadgeVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case 'delivered':
      return 'default';
    case 'failed':
    case 'returned':
    case 'error':
      return 'destructive';
    case 'in_transit':
    case 'processing':
      return 'secondary';
    case 'draft':
    case 'pending_payment':
      return 'outline';
    default:
      return 'secondary';
  }
}

/**
 * Get result status color for operation results
 * Used for displaying the results of batch operations
 * 
 * @param status - The result status string
 * @returns CSS class string for result status styling
 */
export function getResultStatusColor(status: string): string {
  switch (status) {
    case 'fixed':
    case 'submitted_to_lob':
      return 'bg-green-100 text-green-800';
    case 'error':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
