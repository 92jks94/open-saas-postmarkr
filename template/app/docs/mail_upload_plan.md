# Mail File Upload Implementation Plan - AI-Optimized

## Overview

This document outlines the complete implementation plan for mail file upload functionality in the Wasp SaaS application. This plan is specifically designed for AI-assisted development, focusing on simplicity, iterative implementation, and robust error handling while maintaining backward compatibility.

## Key Design Principles

### 1. AI-Optimized Development
- **Progressive Complexity**: Start simple, add features incrementally
- **Clear Error Boundaries**: Explicit error handling at each level
- **Simplified Data Model**: Reduce complex relationships for easier AI understanding
- **Immediate User Value**: Basic functionality works right away

### 2. Non-Breaking Changes
- Preserve existing `File` model and functionality
- Extend rather than modify existing systems
- Maintain current file upload capabilities

### 3. Mail-Specific Requirements
- 25MB file size limit (vs 5MB for general files)
- PDF-only validation with magic bytes checking
- Progressive validation (immediate → fast → background)
- Robust error recovery and cleanup procedures

### 4. Production-Ready Features
- **Security**: Magic bytes validation, server-side processing
- **UX**: Immediate feedback, no waiting for background processes
- **Reliability**: Explicit error recovery, cleanup procedures
- **Testing**: Comprehensive test suite with guardrails against hallucinations

## Technology Stack

### Dependencies
```json
{
  "dependencies": {
    "react-pdf": "^8.0.0",
    "pdfjs-dist": "^4.0.0", 
    "@aws-sdk/client-textract": "^3.523.0"
  }
}
```

### AWS Services
- **S3**: File storage with mail-specific presigned URLs
- **Textract**: Server-side PDF validation and metadata extraction
- **Existing Infrastructure**: Leverage current S3/auth/payment systems

## Implementation Plan - AI-Optimized Phases

### Phase 1: Basic PDF Upload (Week 1)
**Goal**: Get basic PDF upload working with immediate feedback

#### 1.1 Simplified Database Schema
```prisma
// Keep existing File model unchanged - NO MODIFICATIONS
model File {
  id        String   @id @default(uuid())
  createdAt DateTime @default(now())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  name      String
  type      String
  key       String
  uploadUrl String
}

// Simplified MailFile model - stores essential data directly
model MailFile {
  id               String   @id @default(uuid())
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt
  
  // Essential file data (no complex joins needed)
  fileName         String
  fileKey          String
  fileSize         Int
  fileType         String   @default("application/pdf")
  
  // Reference to original file (optional)
  fileId           String?  // Keep for reference, not required
  
  // Mail-specific metadata
  validationStatus String   @default("pending") // 'pending', 'valid', 'invalid', 'processing'
  validationError  String?
  pageCount        Int?
  
  // User relationship
  userId           String
  user             User     @relation(fields: [userId], references: [id])
  
  // Mail job relationships
  mailJobs         MailJob[]
}
```

#### 1.2 Enhanced PDF Validation with Magic Bytes
```typescript
// src/server/mail-service/validation.ts
export const validatePDFFile = (file: File): { isValid: boolean; error?: string } => {
  // Basic client-side validation
  if (file.type !== 'application/pdf') {
    return { isValid: false, error: 'Only PDF files are allowed' };
  }
  
  if (file.size > 25 * 1024 * 1024) {
    return { isValid: false, error: 'File size must be under 25MB' };
  }
  
  if (file.size === 0) {
    return { isValid: false, error: 'File appears to be empty' };
  }
  
  return { isValid: true };
};

// Server-side magic bytes validation (CRITICAL SECURITY)
export const validatePDFMagicBytes = (buffer: Buffer): boolean => {
  return buffer.slice(0, 4).toString() === '%PDF';
};

// Progressive validation stages
export const validatePDFStructure = async (buffer: Buffer): Promise<{
  isValid: boolean;
  pageCount?: number;
  error?: string;
}> => {
  try {
    // Basic PDF structure validation
    // This is fast and can be done immediately
    const pdfHeader = buffer.slice(0, 4).toString();
    if (pdfHeader !== '%PDF') {
      return { isValid: false, error: 'Not a valid PDF file' };
    }
    
    // Basic page count estimation (fast)
    const pageCount = (buffer.toString().match(/\/Type\s*\/Page[^s]/g) || []).length;
    
    if (pageCount === 0) {
      return { isValid: false, error: 'PDF appears to be empty' };
    }
    
    if (pageCount > 50) {
      return { isValid: false, error: 'PDF exceeds maximum 50 pages for mail' };
    }
    
    return { isValid: true, pageCount };
  } catch (error) {
    return { isValid: false, error: 'PDF structure validation failed' };
  }
};
```

#### 1.3 Simplified S3 Operations
```typescript
// src/server/mail-service/s3Utils.ts
export const createMailFileUpload = async (fileName: string, userId: string) => {
  const fileKey = `mail/${userId}/${uuidv4()}-${fileName}`;
  
  const { url: uploadUrl, fields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: fileKey,
    Conditions: [
      ['content-length-range', 0, 25 * 1024 * 1024],
      ['eq', '$Content-Type', 'application/pdf'],
    ],
    Fields: { 'Content-Type': 'application/pdf' },
    Expires: 3600,
  });

  return { uploadUrl, fileKey, fields };
};
```

#### 1.4 Basic Operations
```typescript
// src/server/mail-service/operations.ts
export const createMailFile: CreateMailFile = async ({ fileName, fileSize }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  // Basic validation
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new HttpError(400, 'Only PDF files are allowed');
  }

  const { uploadUrl, fileKey, fields } = await createMailFileUpload(fileName, context.user.id);

  // Create mail file record directly (no complex joins)
  const mailFile = await context.entities.MailFile.create({
    data: {
      fileName,
      fileKey,
      fileSize,
      userId: context.user.id,
      validationStatus: 'pending'
    }
  });

  return { 
    mailFileId: mailFile.id,
    uploadUrl, 
    fields 
  };
};
```

#### 1.5 Simple Upload Component
```typescript
// src/client/mail-service/SimpleMailUpload.tsx
export function SimpleMailUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleFileSelect = (file: File) => {
    setError(null);
    setSuccess(false);
    
    const validation = validatePDFFile(file);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const { uploadUrl, fields, mailFileId } = await createMailFile({
        fileName: selectedFile.name,
        fileSize: selectedFile.size
      });

      // Upload to S3
      const formData = new FormData();
      Object.entries(fields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', selectedFile);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setSuccess(true);
        setSelectedFile(null);
        // Trigger validation in background
        await validateMailFile({ mailFileId });
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload PDF for Mailing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          type="file"
          accept="application/pdf"
          onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
        />
        
        {error && <Alert variant="destructive">{error}</Alert>}
        {success && <Alert className="border-green-200 bg-green-50">Upload successful!</Alert>}
        
        {selectedFile && (
          <div className="space-y-2">
            <p>Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)</p>
            <Button onClick={handleUpload} disabled={isUploading}>
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 2: File Management UI (Week 2)
**Goal**: Build file listing and management interface

#### 2.1 Create src/server/mail-service/s3Utils.ts
```typescript
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { v4 as uuidv4 } from 'uuid';

const s3Client = new S3Client({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
  },
});

export const MAX_MAIL_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export interface S3Upload {
  fileName: string;
  userId: string;
}

export const getMailPDFUploadURL = async ({ fileName, userId }: S3Upload) => {
  const key = `users/${userId}/mail/${uuidv4()}-${fileName}`;
  
  const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
    Conditions: [
      ['content-length-range', 0, MAX_MAIL_FILE_SIZE_BYTES], // 25MB limit
      ['eq', '$Content-Type', 'application/pdf'], // PDF only
    ],
    Fields: { 'Content-Type': 'application/pdf' },
    Expires: 3600,
  });

  return { s3UploadUrl, key, s3UploadFields };
};

export const getMailFileDownloadURL = async (key: string) => {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_FILES_BUCKET!,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
};
```

### Phase 3: Server-Side PDF Validation

#### 3.1 Create src/server/mail-service/pdfValidation.ts
```typescript
import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';

const textractClient = new TextractClient({
  region: process.env.AWS_S3_REGION,
  credentials: {
    accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
    secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
  },
});

export interface PDFValidationResult {
  isValid: boolean;
  pageCount?: number;
  dimensions?: { width: number; height: number };
  error?: string;
  textractJobId?: string;
}

export const validateMailPDF = async (s3Key: string): Promise<PDFValidationResult> => {
  try {
    const command = new AnalyzeDocumentCommand({
      Document: { 
        S3Object: { 
          Bucket: process.env.AWS_S3_FILES_BUCKET!, 
          Name: s3Key 
        } 
      },
      FeatureTypes: ['TABLES', 'FORMS']
    });

    const result = await textractClient.send(command);
    
    // Extract PDF metadata from Textract response
    const pageCount = result.DocumentMetadata?.Pages || 0;
    
    // Validate mail requirements
    if (pageCount === 0) {
      return { isValid: false, error: 'PDF appears to be empty or corrupted' };
    }
    
    if (pageCount > 50) {
      return { isValid: false, error: 'PDF exceeds maximum 50 pages for mail' };
    }

    return {
      isValid: true,
      pageCount,
      textractJobId: result.JobId
    };
    
  } catch (error) {
    return { 
      isValid: false, 
      error: `PDF validation failed: ${error.message}` 
    };
  }
};
```

### Phase 4: Mail File Operations

#### 4.1 Create src/server/mail-service/operations.ts
```typescript
import { HttpError } from 'wasp/server';
import type { CreateMailFile, GetMailFile, GetAllMailFilesByUser } from 'wasp/server/operations';
import type { MailFile } from 'wasp/entities';
import { getMailPDFUploadURL } from './s3Utils';
import { validateMailPDF } from './pdfValidation';

export const createMailFile: CreateMailFile = async ({ fileName }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  // Validate file type
  if (!fileName.toLowerCase().endsWith('.pdf')) {
    throw new HttpError(400, 'Only PDF files are allowed for mail');
  }

  // Get mail-specific S3 upload URL (25MB limit)
  const { s3UploadUrl, key, s3UploadFields } = await getMailPDFUploadURL({
    fileName,
    userId: context.user.id
  });

  // Create base file record
  const file = await context.entities.File.create({
    data: {
      name: fileName,
      type: 'application/pdf',
      key: key,
      uploadUrl: s3UploadUrl,
      userId: context.user.id
    }
  });

  // Create mail file record
  const mailFile = await context.entities.MailFile.create({
    data: {
      fileId: file.id,
      validationStatus: 'pending'
    }
  });

  return { 
    fileId: file.id,
    mailFileId: mailFile.id,
    s3UploadUrl, 
    s3UploadFields 
  };
};

export const getMailFile: GetMailFile = async ({ id }, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  const mailFile = await context.entities.MailFile.findFirst({
    where: { 
      id,
      file: { userId: context.user.id }
    },
    include: { file: true }
  });

  if (!mailFile) {
    throw new HttpError(404, 'Mail file not found');
  }

  return mailFile;
};

export const getAllMailFilesByUser: GetAllMailFilesByUser = async (_, context) => {
  if (!context.user) {
    throw new HttpError(401, 'User not authenticated');
  }

  return context.entities.MailFile.findMany({
    where: {
      file: { userId: context.user.id }
    },
    include: { file: true },
    orderBy: { createdAt: 'desc' }
  });
};

// Background job to validate PDF after upload
export const validateUploadedMailPDF = async (mailFileId: string, context) => {
  const mailFile = await context.entities.MailFile.findUnique({
    where: { id: mailFileId },
    include: { file: true }
  });

  if (!mailFile) return;

  const validationResult = await validateMailPDF(mailFile.file.key);

  await context.entities.MailFile.update({
    where: { id: mailFileId },
    data: {
      validationStatus: validationResult.isValid ? 'valid' : 'invalid',
      validationError: validationResult.error,
      pdfMetadata: validationResult,
      textractJobId: validationResult.textractJobId
    }
  });
};
```

### Phase 5: Wasp Operations Configuration

#### 5.1 Update main.wasp
```wasp
//#region Mail File Upload
action createMailFile {
  fn: import { createMailFile } from "@src/server/mail-service/operations.ts",
  entities: [User, File, MailFile]
}

query getMailFile {
  fn: import { getMailFile } from "@src/server/mail-service/operations.ts",
  entities: [User, File, MailFile]
}

query getAllMailFilesByUser {
  fn: import { getAllMailFilesByUser } from "@src/server/mail-service/operations.ts",
  entities: [User, File, MailFile]
}
//#endregion
```

### Phase 6: Client-Side Components

#### 6.1 Create src/client/mail-service/MailFileUpload.tsx
```typescript
import { useState } from 'react';
import { createMailFile } from 'wasp/client/operations';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Progress } from '../../components/ui/progress';
import { Alert, AlertDescription } from '../../components/ui/alert';

export function MailFileUpload({ onFileUploaded }: { onFileUploaded: (fileId: string) => void }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setError(null);
    
    // Basic client-side validation
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed');
      return;
    }
    
    if (file.size > 25 * 1024 * 1024) {
      setError('File size must be under 25MB');
      return;
    }
    
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      // Get upload URL from server
      const { s3UploadUrl, s3UploadFields, mailFileId } = await createMailFile({
        fileName: selectedFile.name
      });

      // Upload to S3 with progress tracking
      const formData = new FormData();
      Object.entries(s3UploadFields).forEach(([key, value]) => {
        formData.append(key, value);
      });
      formData.append('file', selectedFile);

      const xhr = new XMLHttpRequest();
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setUploadProgress(Math.round((e.loaded / e.total) * 100));
        }
      });

      xhr.onload = () => {
        if (xhr.status === 204) {
          onFileUploaded(mailFileId);
          setIsUploading(false);
          setSelectedFile(null);
          setUploadProgress(0);
        } else {
          setError('Upload failed');
          setIsUploading(false);
        }
      };

      xhr.onerror = () => {
        setError('Upload failed');
        setIsUploading(false);
      };

      xhr.open('POST', s3UploadUrl);
      xhr.send(formData);

    } catch (error) {
      setError(error.message);
      setIsUploading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Upload PDF for Mailing</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Select PDF File</Label>
          <Input
            id="file-upload"
            type="file"
            accept="application/pdf"
            onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
            className="cursor-pointer"
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {selectedFile && !error && (
          <div className="space-y-2">
            <div className="text-sm text-muted-foreground">
              Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)}MB)
            </div>
            
            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? `Uploading ${uploadProgress}%` : 'Upload PDF'}
            </Button>
            
            {isUploading && (
              <Progress value={uploadProgress} className="w-full" />
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 6.2 Create src/client/mail-service/PDFValidationStatus.tsx
```typescript
import { useEffect, useState } from 'react';
import { useQuery } from 'wasp/client/operations';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Card, CardContent } from '../../components/ui/card';

export function PDFValidationStatus({ mailFileId }: { mailFileId: string }) {
  const { data: mailFile, isLoading } = useQuery(getMailFile, { id: mailFileId });

  if (isLoading) return <div>Checking PDF...</div>;

  const status = mailFile?.validationStatus;

  return (
    <Card className="w-full">
      <CardContent className="pt-6">
        {status === 'pending' && (
          <Alert>
            <AlertDescription>
              🔄 Validating PDF for mail requirements...
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'valid' && (
          <Alert className="border-green-200 bg-green-50">
            <AlertDescription className="text-green-800">
              ✅ PDF validated successfully! Ready for mailing.
              {mailFile.pdfMetadata?.pageCount && (
                <div className="text-sm text-green-600 mt-1">
                  {mailFile.pdfMetadata.pageCount} pages detected
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}
        
        {status === 'invalid' && (
          <Alert variant="destructive">
            <AlertDescription>
              ❌ PDF validation failed: {mailFile.validationError}
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
```

#### 6.3 Create src/client/mail-service/MailFileList.tsx
```typescript
import { useQuery } from 'wasp/client/operations';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { PDFValidationStatus } from './PDFValidationStatus';

export function MailFileList() {
  const { data: mailFiles, isLoading, error } = useQuery(getAllMailFilesByUser);

  if (isLoading) return <div>Loading mail files...</div>;
  if (error) return <div>Error loading files: {error.message}</div>;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Your Mail Files</CardTitle>
      </CardHeader>
      <CardContent>
        {mailFiles && mailFiles.length > 0 ? (
          <div className="space-y-4">
            {mailFiles.map((mailFile) => (
              <div key={mailFile.id} className="border rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-medium">{mailFile.file.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      Uploaded {new Date(mailFile.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                </div>
                <PDFValidationStatus mailFileId={mailFile.id} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No mail files uploaded yet
          </p>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 7: Background Job for PDF Validation

#### 7.1 Create src/server/mail-service/jobs.ts
```typescript
import { validateUploadedMailPDF } from './operations';

export const processMailFileValidation = async (mailFileId: string, context) => {
  try {
    await validateUploadedMailPDF(mailFileId, context);
  } catch (error) {
    console.error('Failed to validate mail file:', error);
    
    // Update status to invalid if validation fails
    await context.entities.MailFile.update({
      where: { id: mailFileId },
      data: {
        validationStatus: 'invalid',
        validationError: 'Validation process failed'
      }
    });
  }
};
```

#### 7.2 Update main.wasp for background job
```wasp
//#region Mail File Processing
job processMailFileValidation {
  executor: PgBoss,
  perform: {
    fn: import { processMailFileValidation } from "@src/server/mail-service/jobs.ts"
  },
  entities: [MailFile, File]
}
//#endregion
```

### Phase 8: Integration with Existing System

#### 8.1 Update src/client/App.tsx (if needed)
```typescript
// Add mail service routes to existing routing
import { MailFileUpload } from './mail-service/MailFileUpload';
import { MailFileList } from './mail-service/MailFileList';

// Add to your existing routing structure
```

#### 8.2 Environment Variables
Add to `.env.server`:
```env
# Existing AWS S3 variables (already configured)
AWS_S3_REGION=your-region
AWS_S3_IAM_ACCESS_KEY=your-access-key
AWS_S3_IAM_SECRET_KEY=your-secret-key
AWS_S3_FILES_BUCKET=your-bucket-name

# No additional variables needed - reuses existing S3 setup
```

## Testing Strategy

### 1. Unit Tests
- Test PDF validation logic
- Test S3 upload functions
- Test mail file operations

### 2. Integration Tests
- Test complete upload flow
- Test validation status updates
- Test error handling

### 3. End-to-End Tests
- Test user upload experience
- Test file validation feedback
- Test file management

## Security Considerations

### 1. File Validation
- Server-side PDF validation prevents malicious files
- File type restrictions (PDF only)
- Size limits prevent abuse

### 2. Access Control
- User authentication required
- Users can only access their own files
- Proper authorization checks

### 3. S3 Security
- Presigned URLs with expiration
- Proper bucket policies
- Secure file access patterns

## Performance Considerations

### 1. File Size Limits
- 25MB limit for mail files
- Progress tracking for large uploads
- Background processing for validation

### 2. Caching
- File metadata caching
- Validation status caching
- Efficient database queries

### 3. Error Handling
- Graceful degradation
- User-friendly error messages
- Proper logging and monitoring

## Deployment Checklist

### 1. Database
- [ ] Run migration to add MailFile model
- [ ] Verify existing File model unchanged
- [ ] Test database relationships

### 2. Dependencies
- [ ] Install new npm packages
- [ ] Verify React 18 compatibility
- [ ] Test AWS SDK integration

### 3. AWS Configuration
- [ ] Verify S3 bucket permissions
- [ ] Test Textract access
- [ ] Configure proper IAM roles

### 4. Application
- [ ] Add Wasp operations to main.wasp
- [ ] Deploy background jobs
- [ ] Test complete upload flow

## Monitoring and Maintenance

### 1. Logging
- Upload success/failure rates
- Validation error tracking
- Performance metrics

### 2. Alerts
- Failed uploads
- Validation errors
- S3 access issues

### 3. Maintenance
- Regular cleanup of old files
- Monitor storage usage
- Update validation rules as needed

## Conclusion

This implementation plan provides a robust, secure, and maintainable mail file upload system that extends the existing Wasp application without breaking changes. The approach follows best practices for file handling, security, and user experience while leveraging AWS services for professional-grade document processing.

The phased approach allows for incremental development and testing, ensuring each component works correctly before moving to the next phase. The non-breaking design ensures existing functionality remains intact while adding powerful new mail capabilities.
