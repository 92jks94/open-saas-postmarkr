// ============================================================================
// SHARED UTILITIES
// ============================================================================
// This file contains utility functions used across the application.
// These are common helper functions that don't belong to specific features.
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Utility function for combining CSS classes with Tailwind CSS
 *
 * Combines clsx for conditional classes and tailwind-merge for proper
 * Tailwind CSS class merging and conflict resolution.
 *
 * @param inputs - CSS class values to combine
 * @returns Merged CSS class string
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=utils.js.map