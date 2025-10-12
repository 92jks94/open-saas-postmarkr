import * as pdfjsLib from 'pdfjs-dist';
import { PRICING_TIERS, MAX_PAGE_COUNT } from '../shared/constants/pricing';

// Configure worker - load from static assets
// The worker file is copied to /assets during build via vite-plugin-static-copy
if (typeof window !== 'undefined') {
  // In development, use the node_modules version
  // In production, use the copied static asset
  if (import.meta.env.DEV) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.js',
      import.meta.url
    ).toString();
  } else {
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/assets/pdf.worker.min.js';
  }
}

export interface PDFPreviewData {
  pageCount: number;
  thumbnailDataUrl: string; // Base64 data URL
  firstPageDimensions: { width: number; height: number };
}

/**
 * Generate thumbnail and extract metadata from PDF file
 * Runs entirely client-side before upload
 */
export async function generatePDFThumbnail(file: File): Promise<PDFPreviewData> {
  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  // Get first page
  const page = await pdf.getPage(1);
  const viewport = page.getViewport({ scale: 0.5 }); // Scale for thumbnail
  
  // Render to canvas
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d')!;
  canvas.height = viewport.height;
  canvas.width = viewport.width;
  
  await page.render({ canvasContext: context, viewport }).promise;
  
  return {
    pageCount: pdf.numPages,
    thumbnailDataUrl: canvas.toDataURL('image/jpeg', 0.7),
    firstPageDimensions: {
      width: viewport.width,
      height: viewport.height
    }
  };
}

/**
 * Estimate cost based on page count (before upload)
 */
export function estimateCostFromPages(pageCount: number): {
  tier: string;
  price: number;
  envelopeType: string;
  warning?: string;
} {
  // Find matching pricing tier
  const pricingTier = PRICING_TIERS.find(
    tier => pageCount >= tier.minPages && pageCount <= tier.maxPages
  );

  if (pricingTier) {
    return {
      tier: pricingTier.tier,
      price: pricingTier.priceInCents,
      envelopeType: pricingTier.envelopeType === 'standard_10_double_window' 
        ? 'Standard #10 Envelope' 
        : 'Flat 9x12 Envelope'
    };
  } else {
    return {
      tier: 'unsupported',
      price: 0,
      envelopeType: 'N/A',
      warning: `${pageCount} pages exceeds maximum of ${MAX_PAGE_COUNT} pages`
    };
  }
}

