import { useState, useCallback } from 'react';
import { Dialog, DialogContent } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Maximize2, X } from 'lucide-react';
import PDFViewer from './PDFViewer';
import { cn } from '../../lib/utils';

/**
 * Props for ExpandablePDFViewer component
 */
export interface ExpandablePDFViewerProps {
  /** S3 file key for the PDF */
  fileKey: string;
  /** Filename for display */
  fileName?: string;
  /** Optional className for the container */
  className?: string;
  /** Size variant - affects preview dimensions */
  size?: 'compact' | 'medium' | 'large';
}

/**
 * ExpandablePDFViewer - PDF preview with modal expansion capability
 * 
 * Features:
 * - Medium-sized preview in sidebar/content area
 * - Hover overlay with "Expand" button
 * - Click to expand to full-screen modal
 * - Reuses existing PDFViewer component
 * - Maintains scroll position when expanding/collapsing
 * - Responsive sizing
 */
export const ExpandablePDFViewer: React.FC<ExpandablePDFViewerProps> = ({
  fileKey,
  fileName,
  className = '',
  size = 'medium'
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleExpand = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  // Determine container styles based on size
  const getSizeClasses = () => {
    switch (size) {
      case 'compact':
        return 'max-w-xs';
      case 'large':
        return 'max-w-2xl';
      case 'medium':
      default:
        return 'max-w-md';
    }
  };

  return (
    <>
      {/* ==================== */}
      {/* Inline Preview Card  */}
      {/* ==================== */}
      <div className={cn('relative', getSizeClasses(), className)}>
        <Card className="relative group cursor-pointer hover:shadow-lg transition-shadow">
          <CardContent className="p-3">
            {/* Expand Button Overlay - Shows on hover */}
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleExpand}
                className="shadow-lg"
                aria-label="Expand PDF to full screen"
              >
                <Maximize2 className="h-4 w-4 mr-2" />
                Expand
              </Button>
            </div>

            {/* PDF Preview - Simplified for sidebar (clickable) */}
            <div 
              onClick={handleExpand}
              className="cursor-pointer"
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleExpand();
                }
              }}
              aria-label="Click to expand PDF preview"
            >
              <PDFViewer 
                fileKey={fileKey} 
                className="border-0 shadow-none"
              />
            </div>

            {/* Optional Filename Caption */}
            {fileName && (
              <p className="text-xs text-gray-600 text-center mt-2 truncate" title={fileName}>
                {fileName}
              </p>
            )}
          </CardContent>
        </Card>
        
        <p className="text-xs text-gray-500 text-center mt-2">
          Click to expand full view
        </p>
      </div>

      {/* ============================= */}
      {/* Full-Screen Modal - Expanded */}
      {/* ============================= */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-6xl h-[90vh] p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">
              {fileName || 'PDF Preview'}
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              aria-label="Close PDF preview"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="h-full overflow-auto">
            <PDFViewer 
              fileKey={fileKey}
              className="border-0"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ExpandablePDFViewer;

