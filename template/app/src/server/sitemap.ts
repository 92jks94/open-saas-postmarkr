/**
 * Dynamic Sitemap Generator
 * 
 * Generates sitemap.xml dynamically from defined public routes.
 * This ensures the sitemap always reflects actual application routes
 * and prevents "incorrect pages in sitemap" SEO issues.
 * 
 * Note: Only includes public, indexable pages.
 * Excludes authenticated routes, admin pages, and auth flows.
 */

interface SitemapPage {
  url: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
  lastmod?: string;
}

/**
 * Public pages that should appear in sitemap
 * Add new public marketing pages here as they're created
 */
const PUBLIC_PAGES: SitemapPage[] = [
  {
    url: '/',
    changefreq: 'weekly',
    priority: 1.0,
  },
  {
    url: '/about',
    changefreq: 'monthly',
    priority: 0.7,
  },
  {
    url: '/privacy',
    changefreq: 'yearly',
    priority: 0.3,
  },
  {
    url: '/terms',
    changefreq: 'yearly',
    priority: 0.3,
  },
];

/**
 * Generate sitemap XML from page definitions
 */
function generateSitemapXml(pages: SitemapPage[], baseUrl: string): string {
  const today = new Date().toISOString().split('T')[0];
  
  const urlEntries = pages.map(page => {
    const lastmod = page.lastmod || today;
    return `  <url>
    <loc>${baseUrl}${page.url}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;
}

/**
 * Serve the dynamically generated sitemap
 * This API endpoint is configured in main.wasp as:
 * api sitemap { fn: import { serveSitemap } from "@src/server/sitemap", httpRoute: (GET, "/sitemap.xml"), auth: false }
 */
export async function serveSitemap(req: any, res: any, context: any) {
  try {
    // Get base URL from environment or default to production URL
    const baseUrl = process.env.WASP_WEB_CLIENT_URL || 'https://postmarkr.com';
    
    // Generate sitemap XML
    const sitemapContent = generateSitemapXml(PUBLIC_PAGES, baseUrl);
    
    // Set proper headers for XML content
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Log for monitoring
    console.log(`📄 Serving sitemap with ${PUBLIC_PAGES.length} pages`);
    
    // Send the XML content
    res.status(200).send(sitemapContent);
  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    res.status(500).json({ error: 'Failed to generate sitemap' });
  }
}
