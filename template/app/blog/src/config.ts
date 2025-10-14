/**
 * Site Configuration
 * 
 * Centralized configuration for the Postmarkr blog.
 * Import this file in components instead of hardcoding values.
 */

export const SITE_CONFIG = {
  // URLs
  mainSiteUrl: 'https://postmarkr.com',
  blogUrl: 'https://blog.postmarkr.com',
  githubRepo: 'https://github.com/wasp-lang/open-saas-postmarkr',
  
  // Contact & Social
  email: 'hello@postmarkr.com',
  // Add social links when ready (currently excluded from launch scope)
  social: {
    // twitter: '',
    // linkedin: '',
    // github: '',
  },
  
  // CTA Defaults
  cta: {
    title: 'Ready to send physical mail from anywhere?',
    description: 'Join thousands of remote workers and businesses using Postmarkr for professional mail services.',
    primaryButton: {
      text: 'Get Started Now',
      url: 'https://postmarkr.com/signup',
    },
    secondaryButton: {
      text: 'View Pricing',
      url: 'https://postmarkr.com/#pricing',
    },
  },
  
  // Analytics
  googleAnalyticsId: import.meta.env.GOOGLE_ANALYTICS_ID || import.meta.env.PUBLIC_GOOGLE_ANALYTICS_ID || 'G-6H2SB3GJDW',
  
  // SEO
  defaultOGImage: '/banner-images/default-banner.webp',
  organizationName: 'Postmarkr',
  siteTitle: 'Postmarkr Blog',
  siteDescription: 'Expert guides on virtual mailboxes, certified mail, digital mail services, and remote business mail solutions. Tips and best practices from Postmarkr mail service professionals.',
  
  // Branding
  colors: {
    primary: '239 84% 67%',
    secondary: '217 91% 60%',
  },
  
  // Content
  postsPerPage: 5,
  recentPostsCount: 10,
  
  // Images
  bannerImagePath: '/banner-images',
  defaultBannerImage: 'default-banner.webp',
} as const;

// Type for the config (useful for TypeScript consumers)
export type SiteConfig = typeof SITE_CONFIG;

