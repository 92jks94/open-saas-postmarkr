/**
 * Page-based pricing system for MVP
 * - 1-5 pages: $2.50 (Standard #10 double-window envelope)
 * - 6-20 pages: $7.50 (9x12" flat single-window envelope)
 * - 21-50 pages: $15.00 (9x12" flat single-window envelope)
 */

import { PRICING_TIERS, MIN_PAGE_COUNT, MAX_PAGE_COUNT, type PricingTier } from '../../shared/constants/pricing';

export interface PageBasedPricingConfig {
  tier: string;
  minPages: number;
  maxPages: number;
  price: number; // Price in cents
  envelopeType: string;
  description: string;
}

// Map shared pricing tiers to PageBasedPricingConfig format
export const PAGE_BASED_PRICING: PageBasedPricingConfig[] = PRICING_TIERS.map(tier => ({
  tier: tier.tier,
  minPages: tier.minPages,
  maxPages: tier.maxPages,
  price: tier.priceInCents,
  envelopeType: tier.envelopeType,
  description: tier.description
}));

/**
 * Calculate pricing tier based on page count
 */
export function calculatePricingTier(pageCount: number, addressPlacement?: 'top_first_page' | 'insert_blank_page'): {
  tier: string;
  price: number;
  envelopeType: string;
  description: string;
  isValid: boolean;
} {
  // Validate page count
  if (pageCount <= 0) {
    throw new Error('Page count must be greater than 0');
  }

  // Add extra page for insert_blank_page option
  const effectivePageCount = addressPlacement === 'insert_blank_page' ? pageCount + 1 : pageCount;

  if (effectivePageCount > MAX_PAGE_COUNT) {
    throw new Error(`Documents with more than ${MAX_PAGE_COUNT} pages are not supported`);
  }

  // Find the appropriate pricing tier based on effective page count
  const pricingConfig = PAGE_BASED_PRICING.find(
    config => effectivePageCount >= config.minPages && effectivePageCount <= config.maxPages
  );

  if (!pricingConfig) {
    throw new Error(`No pricing tier found for ${effectivePageCount} pages`);
  }

  return {
    tier: pricingConfig.tier,
    price: pricingConfig.price,
    envelopeType: pricingConfig.envelopeType,
    description: pricingConfig.description,
    isValid: true
  };
}

/**
 * Get pricing information for a specific tier
 */
export function getPricingForTier(tier: string): PageBasedPricingConfig | null {
  return PAGE_BASED_PRICING.find(config => config.tier === tier) || null;
}

/**
 * Validate page count and return pricing info
 */
export function validateAndCalculatePricing(pageCount: number, addressPlacement?: 'top_first_page' | 'insert_blank_page'): {
  isValid: boolean;
  error?: string;
  pricing?: {
    tier: string;
    price: number;
    envelopeType: string;
    description: string;
  };
} {
  try {
    const pricing = calculatePricingTier(pageCount, addressPlacement);
    return {
      isValid: true,
      pricing: {
        tier: pricing.tier,
        price: pricing.price,
        envelopeType: pricing.envelopeType,
        description: pricing.description
      }
    };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Get all available pricing tiers
 */
export function getAllPricingTiers(): PageBasedPricingConfig[] {
  return PAGE_BASED_PRICING;
}

/**
 * Check if page count is valid for processing
 */
export function isPageCountValid(pageCount: number): boolean {
  return pageCount >= MIN_PAGE_COUNT && pageCount <= MAX_PAGE_COUNT;
}

/**
 * Get error message for invalid page count
 */
export function getPageCountErrorMessage(pageCount: number): string {
  if (pageCount < MIN_PAGE_COUNT) {
    return `Document must have at least ${MIN_PAGE_COUNT} page`;
  }
  if (pageCount > MAX_PAGE_COUNT) {
    return `Documents with more than ${MAX_PAGE_COUNT} pages are not supported. Please split your document into smaller parts.`;
  }
  return '';
}
