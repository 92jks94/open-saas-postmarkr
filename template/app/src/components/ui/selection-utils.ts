/**
 * Selection Utilities
 * Reusable functions for handling row selection in TanStack Table components
 */

import { RowSelectionState } from '@tanstack/react-table';

/**
 * Calculate the count of selected rows
 */
export const getSelectedCount = (rowSelection: RowSelectionState): number => {
  return Object.keys(rowSelection).filter(key => rowSelection[key]).length;
};

/**
 * Toggle selection state for a specific row
 */
export const toggleRowSelection = (
  rowSelection: RowSelectionState, 
  rowId: string
): RowSelectionState => {
  const newSelection = { ...rowSelection };
  if (newSelection[rowId]) {
    delete newSelection[rowId];
  } else {
    newSelection[rowId] = true;
  }
  return newSelection;
};

/**
 * Get CSS classes for selected state
 */
export const getSelectionClasses = (isSelected: boolean): string => {
  return isSelected ? 'ring-2 ring-primary bg-primary/5' : '';
};

/**
 * Check if any rows are selected
 */
export const hasSelectedRows = (rowSelection: RowSelectionState): boolean => {
  return getSelectedCount(rowSelection) > 0;
};

/**
 * UI Utilities
 * Reusable functions for common UI patterns
 */

/**
 * Get hover effect classes for interactive cards
 */
export const getCardHoverClasses = (): string => {
  return 'hover:shadow-lg hover:-translate-y-1 hover:bg-gray-50/50 transition-all duration-200 cursor-pointer';
};

/**
 * Get conditional text color classes for buttons
 */
export const getButtonTextClasses = (isActive: boolean): string => {
  return isActive ? '' : 'text-muted-foreground';
};

/**
 * Mail Action Utilities
 * Reusable functions for common mail piece actions
 */

/**
 * Open Lob dashboard for mail piece
 */
export const openLobDashboard = (lobId: string): void => {
  window.open(`https://dashboard.lob.com/letters/${lobId}`, '_blank');
};

/**
 * Navigate to duplicate mail piece creation
 */
export const navigateToDuplicate = (navigate: (path: string) => void, mailPieceId: string): void => {
  navigate(`/mail/create?duplicate=${mailPieceId}`);
};
