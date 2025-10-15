/**
 * Simple status mapping constants for Lob API
 * MVP approach - centralizes existing mappings to eliminate duplication
 */

export const LOB_STATUS_MAPPING = {
  'delivered': 'delivered',
  'returned': 'returned',
  'returned_to_sender': 'returned',
  're-routed': 'in_transit',
  'in_transit': 'in_transit',
  'processed_for_delivery': 'in_local_area',
  'in_local_area': 'in_local_area',
  'processing': 'submitted',
  'printed': 'submitted',
  'mailed': 'submitted',
  'created': 'submitted',
  'cancelled': 'failed',
  'failed': 'failed',
} as const;

/**
 * Maps Lob status to internal status with fallback
 * 
 * @param lobStatus - Status from Lob API
 * @param fallback - Fallback status if mapping not found
 * @returns Mapped internal status
 */
export function mapLobStatus(lobStatus: string, fallback: string = 'unknown'): string {
  return (LOB_STATUS_MAPPING as Record<string, string>)[lobStatus] || fallback;
}
