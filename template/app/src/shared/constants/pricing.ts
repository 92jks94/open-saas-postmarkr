/**
 * Pricing constants for mail pieces
 * Single source of truth for all pricing-related values
 * Used by both client (estimates) and server (billing)
 */

export interface PricingTier {
  tier: string;
  minPages: number;
  maxPages: number;
  priceInCents: number;
  priceInDollars: number;
  envelopeType: string;
  description: string;
}

/**
 * Pricing tiers for mail pieces based on page count
 */
export const PRICING_TIERS: readonly PricingTier[] = [
  {
    tier: 'tier_1',
    minPages: 1,
    maxPages: 5,
    priceInCents: 250,      // $2.50
    priceInDollars: 2.50,
    envelopeType: 'standard_10_double_window',
    description: '1-5 pages - Standard #10 double-window envelope'
  },
  {
    tier: 'tier_2',
    minPages: 6,
    maxPages: 20,
    priceInCents: 750,      // $7.50
    priceInDollars: 7.50,
    envelopeType: 'flat_9x12_single_window',
    description: '6-20 pages - 9x12" flat single-window envelope'
  },
  {
    tier: 'tier_3',
    minPages: 21,
    maxPages: 50,
    priceInCents: 1500,     // $15.00
    priceInDollars: 15.00,
    envelopeType: 'flat_9x12_single_window',
    description: '21-50 pages - 9x12" flat single-window envelope'
  }
] as const;

/**
 * Minimum and maximum page counts
 */
export const MIN_PAGE_COUNT = 1;
export const MAX_PAGE_COUNT = 50;

/**
 * Helper function to get pricing tier for a given page count
 */
export function getPricingTierForPageCount(pageCount: number): PricingTier | null {
  return PRICING_TIERS.find(tier => pageCount >= tier.minPages && pageCount <= tier.maxPages) || null;
}

/**
 * Helper function to validate page count is within acceptable range
 */
export function isValidPageCount(pageCount: number): boolean {
  return pageCount >= MIN_PAGE_COUNT && pageCount <= MAX_PAGE_COUNT;
}

