import { useEffect, useState } from 'react';
import { getAllFilesByUser, getDownloadFileSignedURL, deleteFile, useQuery } from 'wasp/client/operations';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Progress } from '../components/ui/progress';
import { cn } from '../lib/utils';
import { uploadFileWithProgress, validateFile, } from './fileUploading';
import { ALLOWED_FILE_TYPES } from './validation';
export default function FileUploadPage() {
    const [fileKeyForS3, setFileKeyForS3] = useState('');
    const [uploadProgressPercent, setUploadProgressPercent] = useState(0);
    const [uploadError, setUploadError] = useState(null);
    const allUserFiles = useQuery(getAllFilesByUser, undefined, {
    // Enable automatic refetching - manual refetches will still work
    // and won't conflict with automatic ones
    });
    const { isLoading: isDownloadUrlLoading, refetch: refetchDownloadUrl } = useQuery(getDownloadFileSignedURL, { key: fileKeyForS3 }, { enabled: false });
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
    const handleUpload = async (e) => {
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
            await uploadFileWithProgress({ file: file, setUploadProgressPercent });
            formElement.reset();
            allUserFiles.refetch();
        }
        catch (error) {
            console.error('Error uploading file:', error);
            setUploadError({
                message: error instanceof Error ? error.message : 'An unexpected error occurred while uploading the file.',
                code: 'UPLOAD_FAILED',
            });
        }
        finally {
            setUploadProgressPercent(0);
        }
    };
    const handleDelete = async (fileId) => {
        try {
            await deleteFile({ fileId });
            allUserFiles.refetch();
        }
        catch (error) {
            console.error('Error deleting file:', error);
            setUploadError({
                message: error instanceof Error ? error.message : 'Failed to delete file. Please try again.',
                code: 'UPLOAD_FAILED',
            });
        }
    };
    return (<div className='py-10 lg:mt-10'>
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
                <Input type='file' id='file-upload' name='file-upload' accept={ALLOWED_FILE_TYPES.join(',')} onChange={() => setUploadError(null)} className='cursor-pointer'/>
              </div>
              <div className='space-y-2'>
                <Button type='submit' disabled={uploadProgressPercent > 0} className='w-full'>
                  {uploadProgressPercent > 0 ? `Uploading ${uploadProgressPercent}%` : 'Upload'}
                </Button>
                {uploadProgressPercent > 0 && <Progress value={uploadProgressPercent} className='w-full'/>}
              </div>
              {uploadError && (<Alert variant='destructive'>
                  <AlertDescription>{uploadError.message}</AlertDescription>
                </Alert>)}
            </form>
            <div className='border-b-2 border-border'></div>
            <div className='space-y-4 col-span-full'>
              <CardTitle className='text-xl font-bold text-foreground'>Uploaded Files</CardTitle>
              {allUserFiles.isLoading && <p className='text-muted-foreground'>Loading...</p>}
              {allUserFiles.error && (<Alert variant='destructive'>
                  <AlertDescription>Error: {allUserFiles.error.message}</AlertDescription>
                </Alert>)}
              {!!allUserFiles.data && allUserFiles.data.length > 0 && !allUserFiles.isLoading ? (<div className='space-y-3'>
                  {allUserFiles.data.map((file) => (<Card key={file.key} className='p-4'>
                      <div className={cn('flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3', {
                    'opacity-70': file.key === fileKeyForS3 && isDownloadUrlLoading,
                })}>
                        <div className="flex-1 min-w-0">
                          <p className='text-foreground font-medium'>{file.name}</p>
                          {/* PDF Metadata Badges */}
                          <div className="flex flex-wrap gap-2 mt-2">
                            {file.pageCount && (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                {file.pageCount} pages
                              </span>)}
                            {file.pdfMetadata && typeof file.pdfMetadata === 'object' && 'dimensions' in file.pdfMetadata && (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                {Math.round(file.pdfMetadata.dimensions.width)}×{Math.round(file.pdfMetadata.dimensions.height)}
                              </span>)}
                            {file.pdfMetadata && typeof file.pdfMetadata === 'object' && 'metadata' in file.pdfMetadata && file.pdfMetadata.metadata?.modificationDate && (<span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                Modified: {new Date(file.pdfMetadata.metadata.modificationDate).toLocaleDateString()}
                              </span>)}
                          </div>
                        </div>
                        <div className='flex gap-2'>
                          <Button onClick={() => setFileKeyForS3(file.key)} disabled={file.key === fileKeyForS3 && isDownloadUrlLoading} variant='outline' size='sm'>
                            {file.key === fileKeyForS3 && isDownloadUrlLoading ? 'Loading...' : 'Download'}
                          </Button>
                          <Button onClick={() => handleDelete(file.id)} variant='destructive' size='sm'>
                            Delete
                          </Button>
                        </div>
                      </div>
                    </Card>))}
                </div>) : (<p className='text-muted-foreground text-center'>No files uploaded yet :(</p>)}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>);
}
//# sourceMappingURL=FileUploadPage.jsx.map