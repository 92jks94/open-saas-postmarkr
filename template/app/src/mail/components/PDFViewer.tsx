import { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { getDownloadFileSignedURL } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { ChevronLeft, ChevronRight, Loader2, AlertTriangle } from 'lucide-react';

// Configure worker for react-pdf - use local worker from node_modules
// This is more reliable than CDN and ensures version compatibility
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url,
).toString(); /* @vite-ignore */

interface PDFViewerProps {
  fileKey: string;
  className?: string;
}

/**
 * PDFViewer - Large PDF preview component using react-pdf
 * Features:
 * - Full-size PDF rendering with page navigation
 * - Loading states and error handling
 * - Responsive width with max size constraint
 */
export const PDFViewer: React.FC<PDFViewerProps> = ({ fileKey, className = '' }) => {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [retryCount, setRetryCount] = useState(0);
  const MAX_RETRIES = 2; // Prevent infinite loops

  // Fetch PDF URL using existing operation
  const fetchPDFUrl = useCallback(async (isRetry = false) => {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('[PDFViewer] Fetching PDF URL for key:', fileKey, isRetry ? '(retry)' : '');
      }
      setLoading(true);
      setError(null);
      const url = await getDownloadFileSignedURL({ key: fileKey });
      
      if (typeof url === 'string' && url.length > 0) {
        setPdfUrl(url);
        if (isRetry) {
          setRetryCount(0); // Reset retry count on success
        }
        if (process.env.NODE_ENV === 'development') {
          console.log('[PDFViewer] PDF URL set successfully');
        }
      } else {
        throw new Error('Invalid PDF URL returned');
      }
    } catch (err: any) {
      let errorMessage = 'Failed to load PDF';
      
      // Handle specific error types with user-friendly messages
      if (err?.message?.includes('File not found in storage')) {
        errorMessage = 'File not found in storage. Please re-upload the file.';
      } else if (err?.message?.includes('Failed to access file storage')) {
        errorMessage = 'Unable to access file storage. Please try again later.';
      } else if (err?.message?.includes('Authentication required')) {
        errorMessage = 'Please log in to view this file.';
      } else if (err?.message?.includes('File not found or access denied')) {
        errorMessage = 'You do not have permission to view this file.';
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      console.error('[PDFViewer] Error fetching PDF:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [fileKey]);

  useEffect(() => {
    if (!fileKey) {
      console.error('[PDFViewer] No fileKey provided!');
      setError('No file key provided');
      setLoading(false);
      return;
    }
    
    // Reset retry count when fileKey changes (new file)
    setRetryCount(0);
    fetchPDFUrl(false);
  }, [fileKey, fetchPDFUrl]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      const maxWidth = Math.min(window.innerWidth * 0.6, 800);
      setContainerWidth(maxWidth);
    };
    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const handleDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset to first page
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-96 p-8">
          <Loader2 className="animate-spin h-12 w-12 text-blue-500 mb-4" />
          <p className="text-sm text-gray-600">Loading PDF...</p>
        </CardContent>
      </Card>
    );
  }

  if (error || !pdfUrl) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center h-96 p-8">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
          <p className="text-red-600 mb-4">{error || 'Failed to load PDF'}</p>
          <Button 
            variant="outline" 
            onClick={() => {
              setRetryCount(0); // Reset retry count on manual retry
              fetchPDFUrl(false);
            }}
            disabled={loading}
          >
            {loading ? 'Retrying...' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardContent className="p-6">
        {/* PDF Document */}
        <div className="flex flex-col items-center">
          <div className="w-full flex justify-center mb-4 overflow-hidden">
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
                    console.warn('[PDFViewer] Signed URL expired, refreshing... (attempt', retryCount + 1, 'of', MAX_RETRIES + ')');
                    setRetryCount(prev => prev + 1);
                    // Automatically retry with a fresh URL
                    fetchPDFUrl(true);
                  } else if (is403Error) {
                    console.error('[PDFViewer] Max retries exceeded for expired URL');
                    setError('PDF URL expired. Please refresh the page.');
                  } else {
                    console.error('[PDFViewer] Error loading PDF document:', error.message || error);
                    setError(`Failed to render PDF: ${error.message || 'Unknown error'}`);
                  }
                }}
                loading={
                  <div className="flex justify-center p-8">
                    <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  width={Math.min(containerWidth, 600)}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                  loading={
                    <div className="bg-gray-100 rounded flex items-center justify-center" 
                         style={{ width: Math.min(containerWidth, 600), height: Math.min(containerWidth, 600) * 1.3 }}>
                      <Loader2 className="animate-spin h-8 w-8 text-gray-400" />
                    </div>
                  }
                  className="shadow-lg border border-gray-200 rounded max-w-full"
                />
              </Document>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 rounded-lg border border-gray-200">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.max(1, prev - 1))}
              disabled={pageNumber === 1}
              className="flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
            </Button>

            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                Page {pageNumber} of {numPages}
              </span>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setPageNumber(prev => Math.min(numPages, prev + 1))}
              disabled={pageNumber === numPages}
              className="flex items-center gap-1"
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default PDFViewer;

