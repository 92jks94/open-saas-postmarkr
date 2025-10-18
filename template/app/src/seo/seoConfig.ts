/**
 * SEO Configuration
 * 
 * Central configuration for site-wide SEO defaults and per-route metadata.
 * This ensures consistent SEO implementation across all pages.
 */

export interface PageSeoConfig {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  ogType?: 'website' | 'article';
  noindex?: boolean;
  keywords?: string;
}

/**
 * Site-wide SEO defaults
 * Applied to all pages unless overridden by route-specific config
 */
export const DEFAULT_SEO: PageSeoConfig = {
  title: 'Postmarkr - Virtual Mailbox & Automated Mail Service',
  description: 'Send certified mail & manage business correspondence without visiting the post office. Virtual mailbox, automated mail sending, and secure digital mail management for remote teams.',
  ogImage: 'https://postmarkr.com/public-banner.webp',
  ogType: 'website',
  keywords: 'virtual mailbox, certified mail automation, digital mail service, remote business mail, virtual print room, USPS certified mail, mail without printer, business mail management, virtual address, mail forwarding service, secure mail handling, remote work mail solutions',
};

/**
 * Route-specific SEO configurations
 * Keys should match route paths (without trailing slash)
 */
export const ROUTE_SEO_CONFIG: Record<string, PageSeoConfig> = {
  '/': {
    title: 'Postmarkr - Virtual Mailbox & Automated Mail Service',
    description: 'Send certified mail & manage business correspondence without visiting the post office. Virtual mailbox, automated mail sending, and secure digital mail management for remote teams.',
    ogImage: 'https://postmarkr.com/public-banner.webp',
    ogType: 'website',
    keywords: 'virtual mailbox, certified mail automation, digital mail service, remote business mail',
  },
  '/about': {
    title: 'About Postmarkr - Making Physical Mail Simple',
    description: 'Making physical mail simple for remote businesses and modern professionals. Learn about our mission to provide professional mail services accessible from anywhere.',
    ogImage: 'https://postmarkr.com/public-banner.webp',
    ogType: 'website',
  },
  '/privacy': {
    title: 'Privacy Policy - Postmarkr',
    description: 'Learn how Postmarkr collects, uses, and protects your information. We implement bank-level encryption and secure handling of sensitive documents.',
    ogImage: 'https://postmarkr.com/public-banner.webp',
    ogType: 'website',
  },
  '/terms': {
    title: 'Terms of Service - Postmarkr',
    description: 'Terms and conditions for using Postmarkr\'s virtual mailbox and automated mail service. Learn about service usage, payment terms, and user responsibilities.',
    ogImage: 'https://postmarkr.com/public-banner.webp',
    ogType: 'website',
  },
};

/**
 * Get SEO config for a specific route
 * Falls back to default config if route not found
 */
export function getSeoConfigForRoute(pathname: string): PageSeoConfig {
  // Normalize pathname (remove trailing slash)
  const normalizedPath = pathname === '/' ? '/' : pathname.replace(/\/$/, '');
  
  return ROUTE_SEO_CONFIG[normalizedPath] || DEFAULT_SEO;
}

/**
 * Build full page title with site name
 */
export function buildPageTitle(title: string, includeSiteName: boolean = true): string {
  if (!includeSiteName || title.includes('Postmarkr')) {
    return title;
  }
  return `${title} | Postmarkr`;
}

/**
 * Get canonical URL for current path
 */
export function getCanonicalUrl(pathname: string): string {
  const baseUrl = 'https://postmarkr.com';
  // Ensure single leading slash, no trailing slash (except for root)
  const normalizedPath = pathname === '/' ? '' : pathname.replace(/\/$/, '');
  return `${baseUrl}${normalizedPath}`;
}

