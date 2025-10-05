import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Serve the sitemap.xml file as static content
 * This API endpoint serves the sitemap.xml file with proper XML content-type headers
 */
export async function serveSitemap(req: any, res: any, context: any) {
  try {
    // Read the sitemap.xml file from the public directory
    const sitemapPath = join(process.cwd(), 'public', 'sitemap.xml');
    const sitemapContent = readFileSync(sitemapPath, 'utf8');
    
    // Set proper headers for XML content
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    
    // Send the XML content
    res.status(200).send(sitemapContent);
  } catch (error) {
    console.error('Error serving sitemap:', error);
    res.status(404).json({ error: 'Sitemap not found' });
  }
}
