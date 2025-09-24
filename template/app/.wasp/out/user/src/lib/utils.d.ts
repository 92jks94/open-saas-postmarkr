import { type ClassValue } from 'clsx';
/**
 * Utility function for combining CSS classes with Tailwind CSS
 *
 * Combines clsx for conditional classes and tailwind-merge for proper
 * Tailwind CSS class merging and conflict resolution.
 *
 * @param inputs - CSS class values to combine
 * @returns Merged CSS class string
 */
export declare function cn(...inputs: ClassValue[]): string;
