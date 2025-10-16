import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getDownloadFileSignedURL } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

// Configure worker for react-pdf - reuse existing configuration
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString(); /* @vite-ignore */

interface CompactPDFViewerProps {
  fileKey: string;
  className?: string;
  /** Maximum width for the PDF viewer */
  maxWidth?: number;
  /** Maximum height for the PDF viewer */
  maxHeight?: number;
}

/**
 * CompactPDFViewer - Small PDF preview component for order summary
 * Features:
 * - Compact PDF rendering with page navigation
 * - Loading states and error handling
 * - Responsive sizing with constraints
 * - Reuses existing react-pdf setup and operations
 */
export const CompactPDFViewer: React.FC<CompactPDFViewerProps> = ({ 
  fileKey, 
  className = '',
  maxWidth = 200,
  maxHeight = 280
}) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2;

  // Fetch PDF URL using existing operation
  const fetchPDFUrl = useCallback(async (isRetry = false) => {
    try {
      if (!fileKey) {
        console.error('[CompactPDFViewer] No fileKey provided!');
        setError('No file key provided');
        setLoading(false);
        return;
      }

      console.log('[CompactPDFViewer] Fetching PDF URL for key:', fileKey, isRetry ? '(retry)' : '');
      
      const url = await getDownloadFileSignedURL({ key: fileKey });
      
      if (url && typeof url === 'string') {
        console.log('[CompactPDFViewer] PDF URL set successfully');
        setPdfUrl(url);
        setError(null);
      } else {
        throw new Error('Invalid URL returned from server');
      }
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error';
      console.error('[CompactPDFViewer] Error fetching PDF:', errorMessage);
      setError(`Failed to load PDF: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  }, [fileKey]);

  // Load PDF URL on mount and when fileKey changes
  useEffect(() => {
    if (fileKey) {
      setLoading(true);
      setError(null);
      setRetryCount(0);
      fetchPDFUrl();
    }
  }, [fileKey, fetchPDFUrl]);

  // Handle successful document load
  const handleDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    console.log('[CompactPDFViewer] PDF loaded successfully, pages:', numPages);
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page
    setError(null);
  }, []);

  // Navigation handlers
  const goToPreviousPage = useCallback(() => {
    setPageNumber(prev => Math.max(1, prev - 1));
  }, []);

  const goToNextPage = useCallback(() => {
    setPageNumber(prev => Math.min(numPages, prev + 1));
  }, [numPages]);

  // Error state
  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-red-50 border border-red-200 rounded-lg ${className}`}>
        <AlertTriangle className="h-6 w-6 text-red-500 mb-2" />
        <p className="text-xs text-red-600 text-center">Failed to load PDF</p>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchPDFUrl(true)}
          className="mt-2 text-xs"
        >
          Retry
        </Button>
      </div>
    );
  }

  // Loading state
  if (loading || !pdfUrl) {
    return (
      <div className={`flex flex-col items-center justify-center p-4 bg-muted border rounded-lg ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mb-2" />
        <p className="text-xs text-muted-foreground">Loading PDF...</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* PDF Document */}
      <div className="w-full flex justify-center mb-3 overflow-hidden">
        <div className="max-w-full">
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            onLoadError={(error) => {
              // Check if this is a 403 error (expired signed URL)
              const is403Error = error && (
                error.message?.includes('403') || 
                error.message?.includes('Forbidden') ||
                String(error).includes('403')
              );
              
              if (is403Error && retryCount < MAX_RETRIES) {
                console.warn('[CompactPDFViewer] Signed URL expired, refreshing... (attempt', retryCount + 1, 'of', MAX_RETRIES + ')');
                setRetryCount(prev => prev + 1);
                // Automatically retry with a fresh URL
                fetchPDFUrl(true);
              } else if (is403Error) {
                console.error('[CompactPDFViewer] Max retries exceeded for expired URL');
                setError('PDF URL expired. Please refresh the page.');
              } else {
                console.error('[CompactPDFViewer] Error loading PDF document:', error.message || error);
                setError(`Failed to render PDF: ${error.message || 'Unknown error'}`);
              }
            }}
            loading={
              <div className="flex justify-center p-4">
                <Loader2 className="animate-spin h-6 w-6 text-gray-400" />
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={Math.min(maxWidth, 180)}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <div className="bg-gray-100 rounded flex items-center justify-center" 
                     style={{ width: Math.min(maxWidth, 180), height: Math.min(maxWidth, 180) * 1.3 }}>
                  <Loader2 className="animate-spin h-4 w-4 text-gray-400" />
                </div>
              }
              className="shadow-sm border border-gray-200 rounded max-w-full"
            />
          </Document>
        </div>
      </div>

      {/* Navigation Controls */}
      {numPages > 1 && (
        <div className="w-full flex items-center justify-between px-2 py-2 bg-muted/50 rounded-lg border">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousPage}
            disabled={pageNumber === 1}
            className="h-6 w-6 p-0"
          >
            <ChevronLeft className="h-3 w-3" />
          </Button>

          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-muted-foreground">
              {pageNumber}/{numPages}
            </span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextPage}
            disabled={pageNumber === numPages}
            className="h-6 w-6 p-0"
          >
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default CompactPDFViewer;
