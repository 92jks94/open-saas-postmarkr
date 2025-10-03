/**
 * Page-based pricing system for MVP
 * - 1-5 pages: $2.50 (Standard #10 double-window envelope)
 * - 6-20 pages: $7.50 (9x12" flat single-window envelope)
 * - 21-60 pages: $15.00 (9x12" flat single-window envelope)
 */

export interface PageBasedPricingConfig {
  tier: string;
  minPages: number;
  maxPages: number;
  price: number; // Price in cents
  envelopeType: string;
  description: string;
}

export const PAGE_BASED_PRICING: PageBasedPricingConfig[] = [
  {
    tier: 'tier_1',
    minPages: 1,
    maxPages: 5,
    price: 250, // $2.50
    envelopeType: 'standard_10_double_window',
    description: '1-5 pages - Standard #10 double-window envelope'
  },
  {
    tier: 'tier_2',
    minPages: 6,
    maxPages: 20,
    price: 750, // $7.50
    envelopeType: 'flat_9x12_single_window',
    description: '6-20 pages - 9x12" flat single-window envelope'
  },
  {
    tier: 'tier_3',
    minPages: 21,
    maxPages: 60,
    price: 1500, // $15.00
    envelopeType: 'flat_9x12_single_window',
    description: '21-60 pages - 9x12" flat single-window envelope'
  }
];

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

  if (effectivePageCount > 60) {
    throw new Error('Documents with more than 60 pages are not supported');
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
  return pageCount > 0 && pageCount <= 60;
}

/**
 * Get error message for invalid page count
 */
export function getPageCountErrorMessage(pageCount: number): string {
  if (pageCount <= 0) {
    return 'Document must have at least 1 page';
  }
  if (pageCount > 60) {
    return 'Documents with more than 60 pages are not supported. Please split your document into smaller parts.';
  }
  return '';
}
