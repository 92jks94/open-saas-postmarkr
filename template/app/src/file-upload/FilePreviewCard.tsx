import { useState, useEffect } from 'react';
import { getDownloadFileSignedURL, useQuery } from 'wasp/client/operations';
import { PreviewThumbnail } from '../components/ThumbnailImage';
import type { File as FileEntity } from 'wasp/entities';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { cn } from '../lib/utils';
import { PageRangeSelector } from './PageRangeSelector';
import { BYTES_PER_KB } from '../shared/constants/files';

interface FilePreviewCardProps {
  file: FileEntity;
  onDownload: () => void;
  onDelete: () => void;
  isDownloading: boolean;
}

export function FilePreviewCard({ file, onDownload, onDelete, isDownloading }: FilePreviewCardProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  // Phase 3: Page selector state
  const [showPageSelector, setShowPageSelector] = useState(false);

  // Determine if file is an image
  const isImage = file.type.startsWith('image/');
  const isPDF = file.type === 'application/pdf';

  // Load preview for images (full image, not thumbnail)
  useEffect(() => {
    if (isImage && !previewUrl) {
      setIsLoadingPreview(true);
      getDownloadFileSignedURL({ key: file.key })
        .then((url) => {
          setPreviewUrl(url);
        })
        .catch((error) => {
          console.error('Failed to load preview:', error);
        })
        .finally(() => {
          setIsLoadingPreview(false);
        });
    }
  }, [isImage, file.key, previewUrl]);

  // Handle PDF preview
  const handlePreviewPDF = async () => {
    if (!isPDF) return;
    setIsPreviewing(true);
    try {
      const url = await getDownloadFileSignedURL({ key: file.key });
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error) {
      console.error('Failed to preview PDF:', error);
    } finally {
      setIsPreviewing(false);
    }
  };

  // Phase 3: Show page selector if user clicked "Select Pages"
  if (showPageSelector && file.pageCount) {
    return (
      <PageRangeSelector
        file={{
          id: file.id,
          name: file.name,
          pageCount: file.pageCount
        }}
        onExtracted={() => {
          setShowPageSelector(false);
          // File list will auto-refresh via SSE
        }}
        onCancel={() => setShowPageSelector(false)}
      />
    );
  }

  return (
    <Card className='p-6'>
      <div
        className={cn('flex flex-col sm:flex-row items-start sm:items-center gap-6', {
          'opacity-70': isDownloading,
        })}
      >
        {/* Preview Thumbnail */}
        <div className='flex-shrink-0'>
          {isImage && (
            <div className='w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200'>
              {isLoadingPreview ? (
                <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-primary'></div>
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt={file.name}
                  className='w-full h-full object-cover'
                  onError={() => setPreviewUrl(null)}
                />
              ) : (
                <svg
                  className='w-10 h-10 text-gray-400'
                  fill='none'
                  stroke='currentColor'
                  viewBox='0 0 24 24'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z'
                  />
                </svg>
              )}
            </div>
          )}
          {isPDF && (
            <div className='relative'>
              <div
                onClick={handlePreviewPDF}
                className='w-24 h-24 bg-red-50 rounded-lg overflow-hidden flex items-center justify-center border border-red-200 cursor-pointer hover:bg-red-100 transition-colors hover:scale-105 transition-transform'
                title='Click to preview PDF'
              >
                <PreviewThumbnail file={file} />
              </div>
              <div className='absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded shadow-sm'>
                Preview
              </div>
            </div>
          )}
          {!isImage && !isPDF && (
            <div className='w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200'>
              <svg
                className='w-10 h-10 text-gray-400'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z'
                />
              </svg>
            </div>
          )}
        </div>

        {/* File Info */}
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2'>
            <p className='text-foreground font-medium truncate'>{file.name}</p>
            {file.validationStatus === 'processing' && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 flex-shrink-0'>
                <div className='animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1'></div>
                Processing...
              </span>
            )}
          </div>

          {/* File Type Badge */}
          <div className='flex flex-wrap gap-2 mt-2'>
            <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
              {file.type.split('/')[1]?.toUpperCase() || 'FILE'}
            </span>
            
            {/* PDF Metadata Badges */}
            {file.pageCount && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
                {file.pageCount} pages
              </span>
            )}
            {file.pdfMetadata &&
              typeof file.pdfMetadata === 'object' &&
              'dimensions' in file.pdfMetadata && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                  {Math.round((file.pdfMetadata as any).dimensions.width)}×
                  {Math.round((file.pdfMetadata as any).dimensions.height)}
                </span>
              )}
            {file.pdfMetadata &&
              typeof file.pdfMetadata === 'object' &&
              'metadata' in file.pdfMetadata &&
              (file.pdfMetadata as any).metadata?.modificationDate && (
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                  Modified: {new Date((file.pdfMetadata as any).metadata.modificationDate).toLocaleDateString()}
                </span>
              )}
            {file.size && (
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800'>
                {formatFileSize(file.size)}
              </span>
            )}
          </div>

          {/* Validation Error */}
          {file.validationStatus === 'invalid' && file.validationError && (
            <p className='text-sm text-red-600 mt-2'>
              Error: {file.validationError}
            </p>
          )}

          {/* Phase 3: Select Pages button for multi-page PDFs */}
          {isPDF && file.pageCount && file.pageCount > 5 && !file.selectedPages && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPageSelector(true)}
              className="mt-2"
            >
              📄 Select Pages ({file.pageCount} total)
            </Button>
          )}

          {/* Phase 3: Show if this is an extracted file */}
          {file.selectedPages && typeof file.selectedPages === 'object' && 'start' in file.selectedPages && (
            <div className="mt-2 text-sm text-muted-foreground bg-blue-50 border border-blue-200 rounded px-2 py-1 inline-block">
              📌 Pages {(file.selectedPages as any).start}-{(file.selectedPages as any).end} of {(file.selectedPages as any).total}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className='flex gap-2 flex-shrink-0'>
          {isPDF && (
            <Button
              onClick={handlePreviewPDF}
              disabled={isPreviewing}
              variant='default'
              size='sm'
            >
              {isPreviewing ? 'Opening...' : 'Preview'}
            </Button>
          )}
          <Button
            onClick={onDownload}
            disabled={isDownloading}
            variant='outline'
            size='sm'
          >
            {isDownloading ? 'Downloading...' : 'Download'}
          </Button>
          <Button onClick={onDelete} variant='destructive' size='sm'>
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
}

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));
  return Math.round(bytes / Math.pow(BYTES_PER_KB, i) * 100) / 100 + ' ' + sizes[i];
}

