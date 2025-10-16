import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, getAllFilesByUser, getDownloadFileSignedURL, getThumbnailURL } from 'wasp/client/operations';
import { PreviewThumbnail } from '../../components/ThumbnailImage';
import type { File } from 'wasp/entities';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle, XCircle, FileText, Upload, AlertTriangle, DollarSign, Package, FileStack, Plus } from 'lucide-react';
import { MAX_FILE_SIZE_BYTES, MAIL_TYPE_PAGE_REQUIREMENTS, BYTES_PER_KB } from '../../shared/constants/files';
import { getPricingTierForPageCount } from '../../shared/constants/pricing';
import QuickUploadModal from './QuickUploadModal';

/**
 * Props for the FileSelector component */
interface FileSelectorProps {
  /** Currently selected file ID */
  selectedFileId: string | null;
  /** Callback when file selection changes */
  onFileSelect: (fileId: string | null) => void;
  /** Type of mail piece (affects file requirements) */
  mailType: string;
  /** Size of mail piece (affects file dimensions) */
  mailSize: string;
  /** Address placement option (affects page count calculation) */
  addressPlacement?: 'top_first_page' | 'insert_blank_page';
  /** Optional CSS classes for styling */
  className?: string;
  /** Whether to show the comprehensive file preview card below (defaults to true) */
  showPreview?: boolean;
  /** Compact mode: collapses file list when a file is selected (defaults to false) */
  compact?: boolean;
}

/**
 * Result of file validation against mail requirements
 */
interface FileValidationResult {
  /** Whether the file meets all requirements */
  isValid: boolean;
  /** List of validation errors that prevent usage */
  errors: string[];
  /** List of warnings about potential issues */
  warnings: string[];
}

// Note: Using constants from shared/constants/files.ts

/**
 * Component to display comprehensive file preview with thumbnail and cost receipt
 */
const ComprehensiveFilePreview: React.FC<{ 
  file: File; 
  addressPlacement?: 'top_first_page' | 'insert_blank_page';
  onClose: () => void;
}> = ({ file, addressPlacement = 'insert_blank_page', onClose }) => {
  const isPDF = file.type === 'application/pdf';
  const pageCount = file.pageCount || 0;
  
  // Calculate total pages with address placement
  const totalPages = addressPlacement === 'insert_blank_page' ? pageCount + 1 : pageCount;
  
  // Get pricing information
  const pricingTier = getPricingTierForPageCount(totalPages);
  
  // Handle PDF preview
  const handlePreviewPDF = async () => {
    if (!isPDF) return;
    try {
      const url = await getDownloadFileSignedURL({ key: file.key });
      if (url) {
        window.open(url, '_blank');
      }
    } catch (error: any) {
      console.error('Failed to preview PDF:', error);
      
      // Show user-friendly error message for missing files
      if (error?.message?.includes('File not found in storage')) {
        alert('This file is no longer available in storage. Please re-upload the file.');
      } else {
        alert('Failed to preview PDF. Please try again.');
      }
    }
  };
  
  return (
    <Card className="mt-4 border-2 border-blue-500">
      <CardHeader className="bg-blue-50">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileStack className="h-5 w-5" />
              {file.name}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              {pageCount} page{pageCount !== 1 ? 's' : ''} • Selected for mailing
            </p>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={onClose}
            className="text-gray-600 hover:text-gray-900"
          >
            Change File
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        {/* First Page Preview */}
        {isPDF && file.thumbnailKey && (
          <div>
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Document Preview
            </h4>
            
            <div className="flex flex-col items-center">
              <PreviewThumbnail file={file} />
              
              <p className="text-xs text-gray-500 mt-2 text-center">
                Preview of first page • {pageCount} total page{pageCount !== 1 ? 's' : ''}
              </p>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handlePreviewPDF}
                className="mt-3"
              >
                View Full PDF
              </Button>
            </div>
          </div>
        )}
        
        {/* Cost Receipt */}
        {pricingTier && (
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Cost Breakdown
            </h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Document Pages:</span>
                <span className="font-medium">{pageCount} page{pageCount !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-gray-600">Address Placement:</span>
                <span className="font-medium">
                  {addressPlacement === 'insert_blank_page' 
                    ? '+1 page (insert blank)' 
                    : 'Top of first page'
                  }
                </span>
              </div>
              
              <div className="flex justify-between pt-2 border-t border-gray-300">
                <span className="text-gray-600">Total Pages to Mail:</span>
                <span className="font-semibold">{totalPages} page{totalPages !== 1 ? 's' : ''}</span>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t border-gray-300">
                <div>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    Envelope Type:
                  </span>
                  <span className="text-xs text-gray-500 block mt-0.5">
                    {pricingTier.description}
                  </span>
                </div>
              </div>
              
              <div className="flex justify-between items-center pt-3 border-t-2 border-gray-400 mt-3">
                <span className="font-semibold text-gray-900">Total Cost:</span>
                <span className="text-2xl font-bold text-green-600">
                  ${pricingTier.priceInDollars.toFixed(2)}
                </span>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-3">
              Price includes printing, envelope, postage, and delivery tracking.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

/**
 * Component to display file thumbnail with loading/error states
 */
const FileThumbnail: React.FC<{ file: File }> = ({ file }) => {
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const isPDF = file.type === 'application/pdf';
  
  // Fetch thumbnail for PDFs only - refetch on error (handles expired URLs)
  const { data: thumbnailUrl, isLoading, refetch } = useQuery(
    getThumbnailURL,
    { fileId: file.id },
    { 
      enabled: isPDF && !!file.thumbnailKey,
      refetchInterval: false
    }
  );

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

  if (!isPDF || !file.thumbnailKey) {
    // Fallback icon for non-PDFs or missing thumbnails - still clickable for preview
    return (
      <div 
        onClick={handlePreviewPDF}
        className="w-16 h-16 bg-red-50 rounded border border-red-200 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-red-100 transition-colors hover:scale-105 transition-transform"
        title="Click to preview PDF"
      >
        <FileText className="h-8 w-8 text-red-600" />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="w-16 h-16 bg-gray-100 rounded border border-gray-200 flex items-center justify-center flex-shrink-0">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-600"></div>
      </div>
    );
  }

  if (thumbnailUrl && typeof thumbnailUrl === 'string' && !thumbnailFailed) {
    return (
      <div 
        onClick={handlePreviewPDF}
        className="w-16 h-16 rounded border border-gray-200 overflow-hidden flex-shrink-0 cursor-pointer hover:scale-105 transition-transform relative group"
        title="Click to preview PDF"
      >
        <img
          src={thumbnailUrl}
          alt={`${file.name} thumbnail`}
          className="w-full h-full object-cover"
          onError={(e) => {
            // Try to refetch once in case URL expired
            if (!thumbnailFailed) {
              console.warn('[FileThumbnail] Thumbnail failed to load, attempting refresh...');
              refetch();
              setThumbnailFailed(true);
            }
          }}
        />
        {/* Preview overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            {isPreviewing ? (
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
            ) : (
              <div className="bg-white bg-opacity-90 rounded-full p-1">
                <FileText className="h-4 w-4 text-gray-700" />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback icon - still clickable for preview
  return (
    <div 
      onClick={handlePreviewPDF}
      className="w-16 h-16 bg-red-50 rounded border border-red-200 flex items-center justify-center flex-shrink-0 cursor-pointer hover:bg-red-100 transition-colors hover:scale-105 transition-transform"
      title="Click to preview PDF"
    >
      <FileText className="h-8 w-8 text-red-600" />
    </div>
  );
};

/**
 * Validate a file for mail processing requirements
 */
const validateFileForMail = (file: File, mailType: string, mailSize: string): FileValidationResult => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check file type
  if (file.type !== 'application/pdf') {
    errors.push('Only PDF files are supported for mail');
  }

  // Check file size limit for mail
  if (file.size && file.size > MAX_FILE_SIZE_BYTES) {
    errors.push(`File size must be less than ${MAX_FILE_SIZE_BYTES / (1024 * 1024)}MB for mail processing`);
  }

  // Check page count for mail type
  if (file.pageCount) {
    const requirements = MAIL_TYPE_PAGE_REQUIREMENTS[mailType as keyof typeof MAIL_TYPE_PAGE_REQUIREMENTS];
    if (requirements) {
      if (file.pageCount > requirements.maxPages) {
        errors.push(`${mailType} cannot have more than ${requirements.maxPages} pages`);
      }
      if (file.pageCount < requirements.minPages) {
        warnings.push(`${mailType} typically has at least ${requirements.minPages} pages`);
      }
    }
  }

  // Check if file is validated
  if (file.validationStatus === 'invalid') {
    errors.push('File failed validation');
  }

  if (file.validationStatus === 'pending') {
    warnings.push('File validation in progress');
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings
  };
};

const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFileId,
  onFileSelect,
  mailType,
  mailSize,
  addressPlacement = 'insert_blank_page',
  className = '',
  showPreview = true,
  compact = false
}) => {
  const { data: files, isLoading, error } = useQuery(getAllFilesByUser);
  const [showUploadModal, setShowUploadModal] = useState(false);
  
  // Find the selected file
  const selectedFile = useMemo(() => {
    return files?.find((f: File) => f.id === selectedFileId) || null;
  }, [files, selectedFileId]);

  // Memoize validation results to prevent re-validation on every render
  const validationResults = useMemo(() => {
    if (!files) return {};
    
    const results: Record<string, FileValidationResult> = {};
    files.forEach((file: File) => {
      results[file.id] = validateFileForMail(file, mailType, mailSize);
    });
    
    return results;
  }, [files, mailType, mailSize]);

  // Memoize filtered files to prevent recalculation on every render
  const validFiles = useMemo(() => {
    if (!files) return [];
    return files.filter((file: File) => {
      const validation = validationResults[file.id];
      return validation?.isValid;
    });
  }, [files, validationResults]);

  const invalidFiles = useMemo(() => {
    if (!files) return [];
    return files.filter((file: File) => {
      const validation = validationResults[file.id];
      return validation && !validation.isValid;
    });
  }, [files, validationResults]);

  // Memoize helper functions to prevent recreation on every render
  const getValidationIcon = useCallback((fileId: string) => {
    const validation = validationResults[fileId];
    if (!validation) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  }, [validationResults]);

  const getValidationBadge = useCallback((fileId: string) => {
    const validation = validationResults[fileId];
    if (!validation) return null;
    
    if (validation.isValid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>;
    } else {
      return <Badge variant="destructive">Invalid</Badge>;
    }
  }, [validationResults]);

  const formatFileSize = useCallback((bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(BYTES_PER_KB));
    return parseFloat((bytes / Math.pow(BYTES_PER_KB, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-500">Loading files...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Select File
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Failed to load files. Please try again.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // In compact mode, show minimal selected file info
  const showCompactView = compact && selectedFile;

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Select File
                {selectedFileId && (
                  <CheckCircle className="h-5 w-5 text-green-500 ml-1" />
                )}
              </CardTitle>
              {!showCompactView && (
                <p className="text-sm text-gray-600 mt-1">
                  Choose a PDF file to send. Only validated files are shown.
                </p>
              )}
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowUploadModal(true)}
              className="flex-shrink-0"
            >
              <Plus className="h-4 w-4 mr-1" />
              Quick Upload
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Compact View: Show selected file with change button */}
          {showCompactView ? (
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border border-border transition-all duration-200 hover:border-primary/50">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">File</p>
                    <p className="font-medium text-sm">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {selectedFile.pageCount ? `${selectedFile.pageCount} pages` : 'Unknown pages'} • 
                      {selectedFile.size ? formatFileSize(selectedFile.size) : 'Unknown size'}
                    </p>
                  </div>
                </div>
              </div>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => onFileSelect(null)}
              >
                Change
              </Button>
            </div>
          ) : files?.length === 0 ? (
            <div className="text-center py-8">
              <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">No files uploaded yet</p>
              <Button variant="outline" onClick={() => setShowUploadModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Upload Your First File
              </Button>
            </div>
          ) : (
          <>
            {/* Valid Files */}
            {validFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Available Files</h4>
                {validFiles.map((file: File) => {
                  const validation = validationResults[file.id];
                  const isSelected = selectedFileId === file.id;
                  
                  return (
                    <div
                      key={file.id}
                      className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => onFileSelect(isSelected ? null : file.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <FileThumbnail file={file} />
                          <div className="flex items-start gap-2">
                            {getValidationIcon(file.id)}
                            <div>
                              <p className="font-medium text-sm">{file.name}</p>
                              <p className="text-xs text-gray-500">
                                {file.pageCount ? `${file.pageCount} pages` : 'Unknown pages'} • 
                                {file.size ? formatFileSize(file.size) : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {getValidationBadge(file.id)}
                          {isSelected && (
                            <Badge variant="default" className="bg-blue-100 text-blue-800">
                              Selected
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {/* Show warnings */}
                      {validation?.warnings.length > 0 && (
                        <div className="mt-2">
                          {validation.warnings.map((warning, index) => (
                            <p key={index} className="text-xs text-yellow-600">
                              ⚠️ {warning}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Invalid Files */}
            {invalidFiles.length > 0 && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-700">Invalid Files</h4>
                {invalidFiles.map((file: File) => {
                  const validation = validationResults[file.id];
                  
                  return (
                    <div key={file.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-center gap-3">
                        <FileThumbnail file={file} />
                        <div className="flex items-start gap-2 flex-1">
                          {getValidationIcon(file.id)}
                          <div className="flex-1">
                            <p className="font-medium text-sm">{file.name}</p>
                            <div className="text-xs text-red-600 mt-1">
                              {validation?.errors.map((error, index) => (
                                <p key={index}>• {error}</p>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* No valid files message */}
            {validFiles.length === 0 && files && files.length > 0 && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  No valid files found for mail. Please upload PDF files and ensure they pass validation.
                </AlertDescription>
              </Alert>
            )}

            {/* Upload more files button */}
          </>
        )}
        </CardContent>
      </Card>
      
      {/* Comprehensive Preview - Shows when file is selected (can be disabled via showPreview prop) */}
      {showPreview && selectedFile && (
        <ComprehensiveFilePreview
          file={selectedFile}
          addressPlacement={addressPlacement}
          onClose={() => onFileSelect(null)}
        />
      )}

      {/* Quick Upload Modal */}
      <QuickUploadModal
        isOpen={showUploadModal}
        onClose={() => setShowUploadModal(false)}
        onSuccess={(file) => {
          onFileSelect(file.id);
          setShowUploadModal(false);
        }}
      />
    </div>
  );
};

// Wrap component with React.memo to prevent re-renders when props haven't changed
export default React.memo(FileSelector);
