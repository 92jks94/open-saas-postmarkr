/**
 * SEO Component
 * 
 * Manages per-page SEO metadata using react-helmet-async.
 * Place this component at the top of each page to set page-specific metadata.
 * 
 * Example usage:
 * ```tsx
 * <Seo 
 *   title="About Us"
 *   description="Learn about our mission"
 *   canonical="https://postmarkr.com/about"
 * />
 * ```
 */

import { Helmet } from 'react-helmet-async';
import { useLocation } from 'react-router-dom';
import { getCanonicalUrl, buildPageTitle } from './seoConfig';

export interface SeoProps {
  /** Page title (will be appended with site name if not included) */
  title?: string;
  /** Meta description */
  description?: string;
  /** Canonical URL (auto-generated from current path if not provided) */
  canonical?: string;
  /** OpenGraph image URL */
  ogImage?: string;
  /** OpenGraph type */
  ogType?: 'website' | 'article';
  /** Keywords for meta keywords tag */
  keywords?: string;
  /** If true, adds noindex, nofollow meta tags */
  noindex?: boolean;
  /** Additional meta tags */
  children?: React.ReactNode;
}

export function Seo({
  title,
  description,
  canonical,
  ogImage = 'https://postmarkr.com/public-banner.webp',
  ogType = 'website',
  keywords,
  noindex = false,
  children,
}: SeoProps) {
  const location = useLocation();
  
  // Auto-generate canonical if not provided
  const canonicalUrl = canonical || getCanonicalUrl(location.pathname);
  
  // Build full title with site name
  const fullTitle = title ? buildPageTitle(title) : 'Postmarkr - Virtual Mailbox & Automated Mail Service';
  
  return (
    <Helmet>
      {/* Basic meta tags */}
      {title && <title>{fullTitle}</title>}
      {description && <meta name="description" content={description} />}
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="author" content="Postmarkr" />
      
      {/* Canonical URL */}
      <link rel="canonical" href={canonicalUrl} />
      
      {/* Robots meta tag */}
      {noindex && <meta name="robots" content="noindex, nofollow" />}
      
      {/* OpenGraph tags */}
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonicalUrl} />
      {title && <meta property="og:title" content={fullTitle} />}
      {description && <meta property="og:description" content={description} />}
      <meta property="og:image" content={ogImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <meta property="og:image:alt" content={title || 'Postmarkr Virtual Mailbox Service'} />
      <meta property="og:site_name" content="Postmarkr" />
      
      {/* Twitter Card tags */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content={canonicalUrl} />
      {title && <meta name="twitter:title" content={fullTitle} />}
      {description && <meta name="twitter:description" content={description} />}
      <meta name="twitter:image" content={ogImage} />
      <meta name="twitter:image:alt" content={title || 'Postmarkr Virtual Mailbox Service'} />
      
      {/* Additional custom meta tags */}
      {children}
    </Helmet>
  );
}

