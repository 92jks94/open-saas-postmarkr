import * as pdfjsLib from 'pdfjs-dist';

// Configure worker - load from node_modules for reliability
// This prevents failures when CDN is blocked or unavailable
if (typeof window !== 'undefined') {
  // Use the worker from the installed package
  // Vite will handle bundling this properly
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
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
  if (pageCount >= 1 && pageCount <= 5) {
    return {
      tier: 'tier_1',
      price: 250, // $2.50 in cents (matching backend)
      envelopeType: 'Standard #10 Envelope'
    };
  } else if (pageCount >= 6 && pageCount <= 20) {
    return {
      tier: 'tier_2',
      price: 750, // $7.50 in cents
      envelopeType: 'Flat 9x12 Envelope'
    };
  } else if (pageCount >= 21 && pageCount <= 50) {
    return {
      tier: 'tier_3',
      price: 1500, // $15.00 in cents
      envelopeType: 'Flat 9x12 Envelope'
    };
  } else {
    return {
      tier: 'unsupported',
      price: 0,
      envelopeType: 'N/A',
      warning: `${pageCount} pages exceeds maximum of 50 pages`
    };
  }
}

