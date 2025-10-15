import { useQuery } from 'wasp/client/operations';
import { getThumbnailURL } from 'wasp/client/operations';
import type { File } from 'wasp/entities';

/**
 * Shared hook for loading PDF thumbnails
 * Provides consistent error handling and loading states across all components
 */
export function useThumbnail(file: File) {
  const isPDF = file.type === 'application/pdf';
  const hasThumbnailKey = !!file.thumbnailKey;
  
  const query = useQuery(
    getThumbnailURL,
    { fileId: file.id },
    {
      enabled: isPDF && hasThumbnailKey,
      refetchInterval: false,
      // Retry on error to handle expired URLs
      retry: (failureCount, error: any) => {
        // Don't retry if it's a 404 (thumbnail doesn't exist)
        if (error?.message?.includes('not found') || error?.status === 404) {
          return false;
        }
        // Retry up to 2 times for other errors (expired URLs, network issues)
        return failureCount < 2;
      }
    }
  );

  return {
    thumbnailUrl: query.data,
    isLoading: query.isLoading,
    error: query.error,
    refetch: query.refetch,
    isEnabled: isPDF && hasThumbnailKey,
    // Helper flags for common use cases
    shouldShowThumbnail: isPDF && hasThumbnailKey && !query.isLoading && !!query.data,
    shouldShowFallback: isPDF && (!hasThumbnailKey || query.error),
    shouldShowLoading: isPDF && hasThumbnailKey && query.isLoading
  };
}
