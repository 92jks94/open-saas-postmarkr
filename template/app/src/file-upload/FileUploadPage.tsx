import { FormEvent, useEffect, useState } from 'react';
import { getAllFilesByUser, getDownloadFileSignedURL, deleteFile, triggerPDFProcessing, useQuery } from 'wasp/client/operations';
import type { File as FileEntity } from 'wasp/entities';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import {
  type FileUploadError,
  type FileWithValidType,
  uploadFileWithProgress,
  validateFile,
} from './fileUploading';
import { ALLOWED_FILE_TYPES } from './validation';

export default function FileUploadPage() {
  const [fileKeyForS3, setFileKeyForS3] = useState<FileEntity['key']>('');
  const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
  const [uploadError, setUploadError] = useState<FileUploadError | null>(null);

  const allUserFiles = useQuery(getAllFilesByUser, undefined, {
    // Smart polling: only poll when there are files being processed
    refetchInterval: false, // We'll control this manually
    refetchIntervalInBackground: true, // Continue polling when tab is not active
  }) as { data: FileEntity[] | undefined; isLoading: boolean; error: any; refetch: () => void };

  // Check if there are any files currently being processed
  const hasProcessingFiles = allUserFiles.data?.some((file: FileEntity) => file.validationStatus === 'processing');

  // Smart polling effect - only poll when there are files being processed
  useEffect(() => {
    if (!hasProcessingFiles) return;

    const interval = setInterval(() => {
      allUserFiles.refetch();
    }, 1000); // Poll every 1 second

    return () => clearInterval(interval);
  }, [hasProcessingFiles, allUserFiles]);

  const { isLoading: isDownloadUrlLoading, refetch: refetchDownloadUrl } = useQuery(
    getDownloadFileSignedURL,
    { key: fileKeyForS3 },
    { enabled: false }
  );

  useEffect(() => {
    allUserFiles.refetch();
  }, []);

  useEffect(() => {
    if (fileKeyForS3.length > 0) {
      refetchDownloadUrl()
        .then((urlQuery) => {
          switch (urlQuery.status) {
            case 'error':
              console.error('Error fetching download URL', urlQuery.error);
              alert('Error fetching download');
              return;
            case 'success':
              window.open(urlQuery.data, '_blank');
              return;
          }
        })
        .finally(() => {
          setFileKeyForS3('');
        });
    }
  }, [fileKeyForS3]);

  const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();

      const formElement = e.target;
      if (!(formElement instanceof HTMLFormElement)) {
        throw new Error('Event target is not a form element');
      }

      const formData = new FormData(formElement);
      const file = formData.get('file-upload');

      if (!file || !(file instanceof File)) {
        setUploadError({
          message: 'Please select a file to upload.',
          code: 'NO_FILE',
        });
        return;
      }

      const fileValidationError = validateFile(file);
      if (fileValidationError !== null) {
        setUploadError(fileValidationError);
        return;
      }

      const { uploadResponse, createFileResult } = await uploadFileWithProgress({ 
        file: file as FileWithValidType, 
        setUploadProgressPercent 
      });
      
      // If this is a PDF file, trigger processing now that upload is complete
      if (file.type === 'application/pdf') {
        try {
          await triggerPDFProcessing({ fileId: createFileResult.fileId });
        } catch (processingError) {
          console.warn('Failed to trigger PDF processing:', processingError);
          // Don't fail the upload if processing trigger fails
        }
      }
      
      formElement.reset();
      allUserFiles.refetch();
    } catch (error) {
      console.error('Error uploading file:', error);
      setUploadError({
        message:
          error instanceof Error ? error.message : 'An unexpected error occurred while uploading the file.',
        code: 'UPLOAD_FAILED',
      });
    } finally {
      setUploadProgressPercent(0);
    }
  };

  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile({ fileId });
      allUserFiles.refetch();
    } catch (error) {
      console.error('Error deleting file:', error);
      setUploadError({
        message: error instanceof Error ? error.message : 'Failed to delete file. Please try again.',
        code: 'UPLOAD_FAILED',
      });
    }
  };

  return (
    <div className='py-10 lg:mt-10'>
      <div className='mx-auto max-w-7xl px-6 lg:px-8'>
        <div className='mx-auto max-w-4xl text-center'>
          <h2 className='mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
            <span className='text-primary'>AWS</span> File Upload
          </h2>
        </div>
        <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
          This is an example file upload page using AWS S3. Maybe your app needs this. Maybe it doesn't. But a
          lot of people asked for this feature, so here you go 🤝
        </p>
        <Card className='my-8'>
          <CardContent className='space-y-10 my-10 py-8 px-4 mx-auto sm:max-w-lg'>
            <form onSubmit={handleUpload} className='flex flex-col gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='file-upload' className='text-sm font-medium text-foreground'>
                  Select a file to upload
                </Label>
                <Input
                  type='file'
                  id='file-upload'
                  name='file-upload'
                  accept={ALLOWED_FILE_TYPES.join(',')}
                  onChange={() => setUploadError(null)}
                  className='cursor-pointer'
                />
              </div>
              <div className='space-y-2'>
                <Button 
                  type='submit' 
                  isLoading={uploadProgressPercent > 0}
                  loadingText={`Uploading ${uploadProgressPercent}%`}
                  className='w-full'
                >
                  Upload
                </Button>
                {uploadProgressPercent > 0 && <Progress value={uploadProgressPercent} className='w-full' />}
              </div>
              {uploadError && (
                <Alert variant='destructive'>
                  <AlertDescription>{uploadError.message}</AlertDescription>
                </Alert>
              )}
            </form>
            <div className='border-b-2 border-border'></div>
            <div className='space-y-4 col-span-full'>
              <div className="flex items-center justify-between">
                <CardTitle className='text-xl font-bold text-foreground'>Uploaded Files</CardTitle>
                {hasProcessingFiles && (
                  <div className="flex items-center gap-2 text-sm text-blue-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    Processing metadata...
                  </div>
                )}
              </div>
              {allUserFiles.isLoading && <p className='text-muted-foreground'>Loading...</p>}
              {allUserFiles.error && (
                <Alert variant='destructive'>
                  <AlertDescription>Error: {allUserFiles.error.message}</AlertDescription>
                </Alert>
              )}
              {!!allUserFiles.data && allUserFiles.data.length > 0 && !allUserFiles.isLoading ? (
                <div className='space-y-3'>
                  {allUserFiles.data.map((file: FileEntity) => (
                    <Card key={file.key} className='p-4'>
                      <div
                        className={cn(
                          'flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3',
                          {
                            'opacity-70': file.key === fileKeyForS3 && isDownloadUrlLoading,
                          }
                        )}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className='text-foreground font-medium'>{file.name}</p>
                            {file.validationStatus === 'processing' && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-yellow-600 mr-1"></div>
                                Processing...
                              </span>
                            )}
                          </div>
                          {/* PDF Metadata Badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {file.pageCount && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {file.pageCount} pages
                              </span>
                            )}
                            {file.pdfMetadata && typeof file.pdfMetadata === 'object' && 'dimensions' in file.pdfMetadata && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {Math.round((file.pdfMetadata as any).dimensions.width)}×{Math.round((file.pdfMetadata as any).dimensions.height)}
                              </span>
                            )}
                            {file.pdfMetadata && typeof file.pdfMetadata === 'object' && 'metadata' in file.pdfMetadata && (file.pdfMetadata as any).metadata?.modificationDate && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Modified: {new Date((file.pdfMetadata as any).metadata.modificationDate).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button
                            onClick={() => setFileKeyForS3(file.key)}
                            disabled={file.key === fileKeyForS3 && isDownloadUrlLoading}
                            variant='outline'
                            size='sm'
                          >
                            {file.key === fileKeyForS3 && isDownloadUrlLoading ? 'Loading...' : 'Download'}
                          </Button>
                          <Button
                            onClick={() => handleDelete(file.id)}
                            variant='destructive'
                            size='sm'
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className='text-muted-foreground text-center'>No files uploaded yet :(</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
