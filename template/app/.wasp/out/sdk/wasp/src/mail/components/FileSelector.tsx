import React, { useState, useEffect } from 'react';
import { useQuery, getAllFilesByUser } from 'wasp/client/operations';
import type { File } from 'wasp/entities';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { CheckCircle, XCircle, FileText, Upload, AlertTriangle } from 'lucide-react';

interface FileSelectorProps {
  selectedFileId: string | null;
  onFileSelect: (fileId: string | null) => void;
  mailType: string;
  mailSize: string;
  className?: string;
}

interface FileValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

const FileSelector: React.FC<FileSelectorProps> = ({
  selectedFileId,
  onFileSelect,
  mailType,
  mailSize,
  className = ''
}) => {
  const { data: files, isLoading, error } = useQuery(getAllFilesByUser);
  const [validationResults, setValidationResults] = useState<Record<string, FileValidationResult>>({});

  // Validate files for mail compatibility
  useEffect(() => {
    if (files) {
      const results: Record<string, FileValidationResult> = {};
      
      files.forEach((file: File) => {
        const validation = validateFileForMail(file, mailType, mailSize);
        results[file.id] = validation;
      });
      
      setValidationResults(results);
    }
  }, [files, mailType, mailSize]);

  const validateFileForMail = (file: File, mailType: string, mailSize: string): FileValidationResult => {
    // Client-side validation logic (moved from server-side validation)
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check file type
    if (file.type !== 'application/pdf') {
      errors.push('Only PDF files are supported for mail');
    }

    // Check file size (10MB limit for mail)
    const MAIL_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
    if (file.size && file.size > MAIL_MAX_FILE_SIZE_BYTES) {
      errors.push('File size must be less than 10MB for mail processing');
    }

    // Check page count for mail type
    const MAIL_TYPE_REQUIREMENTS = {
      'postcard': { maxPages: 1, minPages: 1 },
      'letter': { maxPages: 6, minPages: 1 },
      'check': { maxPages: 1, minPages: 1 },
      'self_mailer': { maxPages: 4, minPages: 1 },
      'catalog': { maxPages: 50, minPages: 2 },
      'booklet': { maxPages: 20, minPages: 2 }
    };

    if (file.pageCount) {
      const requirements = MAIL_TYPE_REQUIREMENTS[mailType as keyof typeof MAIL_TYPE_REQUIREMENTS];
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

  const getValidationIcon = (fileId: string) => {
    const validation = validationResults[fileId];
    if (!validation) return <AlertTriangle className="h-4 w-4 text-gray-400" />;
    
    if (validation.isValid) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    } else {
      return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getValidationBadge = (fileId: string) => {
    const validation = validationResults[fileId];
    if (!validation) return null;
    
    if (validation.isValid) {
      return <Badge variant="secondary" className="bg-green-100 text-green-800">Valid</Badge>;
    } else {
      return <Badge variant="destructive">Invalid</Badge>;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  const validFiles = files?.filter((file: File) => {
    const validation = validationResults[file.id];
    return validation?.isValid;
  }) || [];

  const invalidFiles = files?.filter((file: File) => {
    const validation = validationResults[file.id];
    return validation && !validation.isValid;
  }) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Select File
        </CardTitle>
        <p className="text-sm text-gray-600">
          Choose a PDF file to send. Only validated files are shown.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {files?.length === 0 ? (
          <div className="text-center py-8">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No files uploaded yet</p>
            <Button variant="outline" onClick={() => window.location.href = '/file-upload'}>
              Upload Files
            </Button>
          </div>
        ) : (
          <>
            {/* Valid Files */}
            {validFiles.length > 0 && (
              <div className="space-y-2">
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
                          {getValidationIcon(file.id)}
                          <div>
                            <p className="font-medium text-sm">{file.name}</p>
                            <p className="text-xs text-gray-500">
                              {file.pageCount ? `${file.pageCount} pages` : 'Unknown pages'} • 
                              {file.size ? formatFileSize(file.size) : 'Unknown size'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
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
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-700">Invalid Files</h4>
                {invalidFiles.map((file: File) => {
                  const validation = validationResults[file.id];
                  
                  return (
                    <div key={file.id} className="border border-red-200 rounded-lg p-3 bg-red-50">
                      <div className="flex items-center gap-3">
                        {getValidationIcon(file.id)}
                        <div>
                          <p className="font-medium text-sm">{file.name}</p>
                          <div className="text-xs text-red-600">
                            {validation?.errors.map((error, index) => (
                              <p key={index}>• {error}</p>
                            ))}
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
            <div className="pt-4 border-t">
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = '/file-upload'}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload More Files
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default FileSelector;
