import React, { useState } from 'react';
import { FileText, ImageIcon } from 'lucide-react';
import { useThumbnail } from '../hooks/useThumbnail';
import type { File } from 'wasp/entities';
import { cn } from '../lib/utils';

interface ThumbnailImageProps {
  file: File;
  className?: string;
  fallbackClassName?: string;
  loadingClassName?: string;
  showFallbackIcon?: boolean;
  onClick?: () => void;
  alt?: string;
  // Size presets for common use cases
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'w-12 h-12',
  md: 'w-16 h-16', 
  lg: 'w-24 h-24',
  xl: 'w-48 h-48'
};

const iconSizes = {
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12', 
  xl: 'h-16 w-16'
};

/**
 * Shared component for displaying file thumbnails with consistent fallbacks
 * Handles loading states, error states, and fallback icons automatically
 */
export function ThumbnailImage({
  file,
  className = '',
  fallbackClassName = '',
  loadingClassName = '',
  showFallbackIcon = true,
  onClick,
  alt,
  size = 'md'
}: ThumbnailImageProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const { thumbnailUrl, isLoading, error, refetch, shouldShowThumbnail, shouldShowFallback, shouldShowLoading } = useThumbnail(file);
  
  const isPDF = file.type === 'application/pdf';
  const isImage = file.type.startsWith('image/');
  
  // Handle image load error with retry
  const handleImageError = () => {
    if (!imageFailed) {
      console.warn(`[ThumbnailImage] Image failed to load for file ${file.id}, attempting refresh...`);
      refetch();
      setImageFailed(true);
    }
  };

  // For images, show the actual image (not thumbnail)
  if (isImage) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          'bg-gray-50 rounded border border-gray-200 flex items-center justify-center overflow-hidden',
          onClick && 'cursor-pointer hover:bg-gray-100 transition-colors',
          className
        )}
        onClick={onClick}
      >
        <ImageIcon className={cn(iconSizes[size], 'text-blue-500')} />
      </div>
    );
  }

  // For PDFs, show thumbnail if available
  if (isPDF) {
    // Loading state
    if (shouldShowLoading) {
      return (
        <div 
          className={cn(
            sizeClasses[size],
            'bg-gray-100 rounded border border-gray-200 flex items-center justify-center',
            loadingClassName
          )}
        >
          <div className="animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" 
               style={{ width: iconSizes[size], height: iconSizes[size] }} />
        </div>
      );
    }

    // Thumbnail available and loaded
    if (shouldShowThumbnail && thumbnailUrl && !imageFailed) {
      return (
        <img
          src={thumbnailUrl}
          alt={alt || `Preview of ${file.name}`}
          className={cn(
            sizeClasses[size],
            'rounded border border-gray-300 object-contain bg-white',
            onClick && 'cursor-pointer hover:border-gray-400 transition-colors',
            className
          )}
          onClick={onClick}
          onError={handleImageError}
        />
      );
    }

    // Fallback for PDFs without thumbnails or failed loads
    if (shouldShowFallback && showFallbackIcon) {
      return (
        <div 
          className={cn(
            sizeClasses[size],
            'bg-red-50 rounded border border-red-200 flex items-center justify-center',
            onClick && 'cursor-pointer hover:bg-red-100 transition-colors',
            fallbackClassName
          )}
          onClick={onClick}
          title={error ? 'Thumbnail failed to load' : 'No thumbnail available'}
        >
          <FileText className={cn(iconSizes[size], 'text-red-600')} />
        </div>
      );
    }
  }

  // Default fallback for any other file type
  return (
    <div 
      className={cn(
        sizeClasses[size],
        'bg-gray-50 rounded border border-gray-200 flex items-center justify-center',
        onClick && 'cursor-pointer hover:bg-gray-100 transition-colors',
        fallbackClassName
      )}
      onClick={onClick}
    >
      <FileText className={cn(iconSizes[size], 'text-gray-500')} />
    </div>
  );
}

/**
 * Preset component for file list thumbnails
 */
export function FileListThumbnail({ file, onClick }: { file: File; onClick?: () => void }) {
  return (
    <ThumbnailImage
      file={file}
      size="md"
      onClick={onClick}
      className="flex-shrink-0"
    />
  );
}

/**
 * Preset component for preview thumbnails
 */
export function PreviewThumbnail({ file, onClick }: { file: File; onClick?: () => void }) {
  return (
    <ThumbnailImage
      file={file}
      size="xl"
      onClick={onClick}
      className="shadow-md"
    />
  );
}
