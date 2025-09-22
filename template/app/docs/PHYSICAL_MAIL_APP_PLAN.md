# Physical Mail App - PRD & Implementation Plan

## Project Overview

Building a physical mail application using the existing Wasp SaaS boilerplate template that leverages:
- **Existing Features**: Authentication, payment processing, AWS S3 file upload, landing page, admin dashboard
- **New Integration**: Lob API for physical mail printing and delivery
- **Core Functionality**: PDF upload → mail type selection → address input → payment → Lob processing → end-to-end tracking

## PRD Approach Evaluation

### Possible Approaches Considered

#### **Approach 1: Feature-First Vertical Slices**
- Build complete mail sending functionality first, then add tracking
- **Pros**: Quick MVP, immediate value
- **Cons**: May miss integration complexities

#### **Approach 2: Infrastructure-First**
- Set up Lob API, database models, and core services first
- **Pros**: Solid foundation, easier testing
- **Cons**: Delayed user-facing features

#### **Approach 3: Modified Vertical Slice (RECOMMENDED)**
- Build end-to-end features incrementally with proper integration points
- **Pros**: Balanced approach, leverages Wasp's strengths, allows for iterative development
- **Cons**: Requires careful planning

## **Recommended PRD Approach: Modified Vertical Slice**

### Why This is the Best Approach

1. **Leverages Wasp's Full-Stack Capabilities**: The template already has authentication, payment processing, file uploads, and admin dashboards. We can build on these rather than recreate them.

2. **Incremental Value Delivery**: Each slice delivers complete functionality that users can immediately use, allowing for early feedback and iteration.

3. **Risk Mitigation**: By building complete features end-to-end, we can identify integration issues early and ensure each component works properly before moving to the next.

4. **Efficient Resource Utilization**: The existing infrastructure (S3, Stripe, Auth) handles the complex parts, letting us focus on the unique mail service logic.

5. **LLM-Friendly Development**: Each slice is self-contained and can be implemented with clear, focused prompts.

## **Actionable Step-by-Step Implementation Plan**

### **Phase 1: Foundation & Core Models (Week 1)**
**Goal**: Set up database models and basic infrastructure for mail services

#### Steps:
1. **Database Schema Design**
   - Add `MailJob` model to `schema.prisma` with fields: id, userId, status, mailType, fromAddress, toAddress, pdfFileKey, lobJobId, trackingNumber, createdAt, updatedAt
   - Add `MailAddress` model for standardized address handling
   - Run `wasp db migrate-dev` to apply changes

2. **Lob API Integration Setup**
   - Create `src/mail-service/lobClient.ts` for Lob API wrapper
   - Set up environment variables for Lob API credentials
   - Create basic address validation utilities

3. **Wasp Operations Foundation**
   - Add mail-related operations to `main.wasp` (createMailJob, getMailJobs, updateMailJobStatus)
   - Create `src/mail-service/operations.ts` with basic CRUD operations

### **Phase 2: PDF Upload & Mail Creation (Week 2)**
**Goal**: Complete mail job creation workflow

#### Steps:

##### 1. **Mail File Upload System (Extends Existing File Upload)**

**1.1 Create Mail-Specific Validation**
- **Create `src/mail-upload/validation.ts`** (extends existing validation):
  ```typescript
  import { FileUploadError } from '../file-upload/fileUploading';
  
  // Mail-specific constants (separate from general file upload)
  export const MAIL_ALLOWED_FILE_TYPES = ['application/pdf'] as const;
  export const MAX_MAIL_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB for mail
  export const MAIL_PDF_REQUIREMENTS = {
    minPages: 1,
    maxPages: 50,
    requiredDimensions: { width: 8.5, height: 11 }, // Letter size
    allowedOrientations: ['portrait', 'landscape']
  } as const;
  
  // Mail-specific validation (doesn't modify existing validation)
  export function validateMailPDF(file: File): FileUploadError | null {
    if (file.type !== 'application/pdf') {
      return { message: 'Only PDF files are allowed for mail', code: 'INVALID_FILE_TYPE' };
    }
    
    if (file.size > MAX_MAIL_FILE_SIZE_BYTES) {
      return { message: `PDF size exceeds ${MAX_MAIL_FILE_SIZE_BYTES / 1024 / 1024}MB limit`, code: 'FILE_TOO_LARGE' };
    }
    
    return null;
  }
  ```

**1.2 Create Mail-Specific S3 Utilities**
- **Create `src/mail-upload/s3Utils.ts`** (extends existing S3 utils):
  ```typescript
  import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
  import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
  import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
  import { TextractClient, AnalyzeDocumentCommand } from '@aws-sdk/client-textract';
  import { MAX_MAIL_FILE_SIZE_BYTES } from './validation';
  import * as path from 'path';
  import { randomUUID } from 'crypto';

  const s3Client = new S3Client({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
    },
  });

  const textractClient = new TextractClient({
    region: process.env.AWS_S3_REGION,
    credentials: {
      accessKeyId: process.env.AWS_S3_IAM_ACCESS_KEY!,
      secretAccessKey: process.env.AWS_S3_IAM_SECRET_KEY!,
    },
  });

  type MailS3Upload = {
    fileType: string;
    fileName: string;
    userId: string;
  };

  // Mail-specific S3 upload with higher size limit
  export const getMailPDFUploadURLFromS3 = async ({ fileName, fileType, userId }: MailS3Upload) => {
    const key = getMailS3Key(fileName, userId);

    const { url: s3UploadUrl, fields: s3UploadFields } = await createPresignedPost(s3Client, {
      Bucket: process.env.AWS_S3_FILES_BUCKET!,
      Key: key,
      Conditions: [['content-length-range', 0, MAX_MAIL_FILE_SIZE_BYTES]], // 25MB limit
      Fields: {
        'Content-Type': fileType,
      },
      Expires: 3600,
    });

    return { s3UploadUrl, key, s3UploadFields };
  };

  // Server-side PDF validation using AWS Textract
  export const validatePDFWithTextract = async (s3Key: string) => {
    try {
      const command = new AnalyzeDocumentCommand({
        Document: { 
          S3Object: { 
            Bucket: process.env.AWS_S3_FILES_BUCKET, 
            Name: s3Key 
          } 
        },
        FeatureTypes: ['TABLES', 'FORMS']
      });
      
      const result = await textractClient.send(command);
      return {
        isValid: true,
        metadata: {
          pageCount: result.DocumentMetadata?.Pages || 0,
          extractedText: result.Blocks?.filter(block => block.BlockType === 'LINE').length || 0
        }
      };
    } catch (error) {
      return {
        isValid: false,
        error: 'PDF validation failed - file may be corrupted or password protected'
      };
    }
  };

  function getMailS3Key(fileName: string, userId: string) {
    const ext = path.extname(fileName).slice(1);
    return `mail/${userId}/${randomUUID()}.${ext}`;
  }
  ```

**1.3 Create Mail File Operations**
- **Create `src/mail-upload/operations.ts`** (separate from existing file operations):
  ```typescript
  import * as z from 'zod';
  import { HttpError } from 'wasp/server';
  import { type File } from 'wasp/entities';
  import {
    type CreateMailFile,
    type GetAllMailFilesByUser,
    type GetMailFileDownloadURL,
  } from 'wasp/server/operations';
  import { getMailPDFUploadURLFromS3, validatePDFWithTextract } from './s3Utils';
  import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';
  import { MAIL_ALLOWED_FILE_TYPES } from './validation';

  const createMailFileInputSchema = z.object({
    fileType: z.enum(MAIL_ALLOWED_FILE_TYPES),
    fileName: z.string().nonempty(),
  });

  type CreateMailFileInput = z.infer<typeof createMailFileInputSchema>;

  export const createMailFile: CreateMailFile<
    CreateMailFileInput,
    {
      s3UploadUrl: string;
      s3UploadFields: Record<string, string>;
    }
  > = async (rawArgs, context) => {
    if (!context.user) {
      throw new HttpError(401);
    }

    const { fileType, fileName } = ensureArgsSchemaOrThrowHttpError(createMailFileInputSchema, rawArgs);

    const { s3UploadUrl, s3UploadFields, key } = await getMailPDFUploadURLFromS3({
      fileType,
      fileName,
      userId: context.user.id,
    });

    // Create file record (reuses existing File model)
    await context.entities.File.create({
      data: {
        name: fileName,
        key,
        uploadUrl: s3UploadUrl,
        type: fileType,
        user: { connect: { id: context.user.id } },
      },
    });

    return {
      s3UploadUrl,
      s3UploadFields,
    };
  };

  export const getAllMailFilesByUser: GetAllMailFilesByUser<void, File[]> = async (_args, context) => {
    if (!context.user) {
      throw new HttpError(401);
    }
    
    return context.entities.File.findMany({
      where: {
        user: { id: context.user.id },
        type: 'application/pdf', // Only PDFs for mail
        key: { startsWith: 'mail/' }, // Only mail files
      },
      orderBy: { createdAt: 'desc' },
    });
  };

  export const getMailFileDownloadURL: GetMailFileDownloadURL<
    { key: string },
    string
  > = async (rawArgs, _context) => {
    const { key } = ensureArgsSchemaOrThrowHttpError(
      z.object({ key: z.string().nonempty() }), 
      rawArgs
    );
    
    // Reuse existing S3 download logic
    const command = new GetObjectCommand({
      Bucket: process.env.AWS_S3_FILES_BUCKET,
      Key: key,
    });
    return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
  };
  ```

**1.4 Create Mail File Upload Components**
- **Create `src/mail-upload/components/MailFileUpload.tsx`**:
  ```typescript
  import { FormEvent, useState } from 'react';
  import { createMailFile, getAllMailFilesByUser, getMailFileDownloadURL, useQuery } from 'wasp/client/operations';
  import type { File } from 'wasp/entities';
  import { Alert, AlertDescription } from '../../components/ui/alert';
  import { Button } from '../../components/ui/button';
  import { Card, CardContent, CardTitle } from '../../components/ui/card';
  import { Input } from '../../components/ui/input';
  import { Label } from '../../components/ui/label';
  import { Progress } from '../../components/ui/progress';
  import { validateMailPDF } from '../validation';
  import { uploadMailPDFWithProgress } from '../mailFileUploading';

  export default function MailFileUpload() {
    const [fileKeyForS3, setFileKeyForS3] = useState<File['key']>('');
    const [uploadProgressPercent, setUploadProgressPercent] = useState<number>(0);
    const [uploadError, setUploadError] = useState<string | null>(null);

    const allUserMailFiles = useQuery(getAllMailFilesByUser, undefined, {
      enabled: false,
    });

    const { isLoading: isDownloadUrlLoading, refetch: refetchDownloadUrl } = useQuery(
      getMailFileDownloadURL,
      { key: fileKeyForS3 },
      { enabled: false }
    );

    const handleUpload = async (e: FormEvent<HTMLFormElement>) => {
      try {
        e.preventDefault();
        const formElement = e.target as HTMLFormElement;
        const formData = new FormData(formElement);
        const file = formData.get('file-upload') as File;

        if (!file) {
          setUploadError('Please select a PDF file to upload.');
          return;
        }

        // Validate PDF for mail
        const validationError = validateMailPDF(file);
        if (validationError) {
          setUploadError(validationError.message);
          return;
        }

        await uploadMailPDFWithProgress({ 
          file, 
          setUploadProgressPercent 
        });
        
        formElement.reset();
        allUserMailFiles.refetch();
      } catch (error) {
        console.error('Error uploading mail file:', error);
        setUploadError('An unexpected error occurred while uploading the file.');
      } finally {
        setUploadProgressPercent(0);
      }
    };

    return (
      <div className='py-10 lg:mt-10'>
        <div className='mx-auto max-w-7xl px-6 lg:px-8'>
          <div className='mx-auto max-w-4xl text-center'>
            <h2 className='mt-2 text-4xl font-bold tracking-tight text-foreground sm:text-5xl'>
              <span className='text-primary'>Mail</span> PDF Upload
            </h2>
          </div>
          <p className='mx-auto mt-6 max-w-2xl text-center text-lg leading-8 text-muted-foreground'>
            Upload PDF documents for physical mail delivery. Files are validated for mail compatibility.
          </p>
          
          <Card className='my-8'>
            <CardContent className='space-y-10 my-10 py-8 px-4 mx-auto sm:max-w-lg'>
              <form onSubmit={handleUpload} className='flex flex-col gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='file-upload' className='text-sm font-medium text-foreground'>
                    Select a PDF file for mail
                  </Label>
                  <Input
                    type='file'
                    id='file-upload'
                    name='file-upload'
                    accept='application/pdf'
                    onChange={() => setUploadError(null)}
                    className='cursor-pointer'
                  />
                </div>
                <div className='space-y-2'>
                  <Button type='submit' disabled={uploadProgressPercent > 0} className='w-full'>
                    {uploadProgressPercent > 0 ? `Uploading ${uploadProgressPercent}%` : 'Upload PDF'}
                  </Button>
                  {uploadProgressPercent > 0 && <Progress value={uploadProgressPercent} className='w-full' />}
                </div>
                {uploadError && (
                  <Alert variant='destructive'>
                    <AlertDescription>{uploadError}</AlertDescription>
                  </Alert>
                )}
              </form>
              
              <div className='border-b-2 border-border'></div>
              
              <div className='space-y-4 col-span-full'>
                <CardTitle className='text-xl font-bold text-foreground'>Uploaded Mail Files</CardTitle>
                {allUserMailFiles.isLoading && <p className='text-muted-foreground'>Loading...</p>}
                {allUserMailFiles.error && (
                  <Alert variant='destructive'>
                    <AlertDescription>Error: {allUserMailFiles.error.message}</AlertDescription>
                  </Alert>
                )}
                {!!allUserMailFiles.data && allUserMailFiles.data.length > 0 && !allUserMailFiles.isLoading ? (
                  <div className='space-y-3'>
                    {allUserMailFiles.data.map((file: File) => (
                      <Card key={file.key} className='p-4'>
                        <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3'>
                          <p className='text-foreground font-medium'>{file.name}</p>
                          <Button
                            onClick={() => setFileKeyForS3(file.key)}
                            disabled={file.key === fileKeyForS3 && isDownloadUrlLoading}
                            variant='outline'
                            size='sm'
                          >
                            {file.key === fileKeyForS3 && isDownloadUrlLoading ? 'Loading...' : 'Download'}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className='text-muted-foreground text-center'>No mail files uploaded yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
  ```

**1.5 Create Mail File Upload Utilities**
- **Create `src/mail-upload/mailFileUploading.ts`** (extends existing fileUploading):
  ```typescript
  import { createMailFile } from 'wasp/client/operations';
  import axios from 'axios';
  import { MAIL_ALLOWED_FILE_TYPES, MAX_MAIL_FILE_SIZE_BYTES } from './validation';

  export type MailFileWithValidType = File & { type: typeof MAIL_ALLOWED_FILE_TYPES[number] };

  interface MailFileUploadProgress {
    file: MailFileWithValidType;
    setUploadProgressPercent: (percentage: number) => void;
  }

  export async function uploadMailPDFWithProgress({ file, setUploadProgressPercent }: MailFileUploadProgress) {
    const { s3UploadUrl, s3UploadFields } = await createMailFile({ 
      fileType: file.type, 
      fileName: file.name 
    });

    const formData = getMailFileUploadFormData(file, s3UploadFields);

    return axios.post(s3UploadUrl, formData, {
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const percentage = Math.round((progressEvent.loaded / progressEvent.total) * 100);
          setUploadProgressPercent(percentage);
        }
      },
    });
  }

  function getMailFileUploadFormData(file: File, s3UploadFields: Record<string, string>) {
    const formData = new FormData();
    Object.entries(s3UploadFields).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append('file', file);
    return formData;
  }
  ```

**1.6 Database Schema (Separate Models)**
- **Add to `schema.prisma`** (doesn't modify existing File model):
  ```prisma
  // Keep existing File model unchanged - no modifications
  
  // New separate model for mail-specific metadata
  model MailFile {
    id              String      @id @default(uuid())
    createdAt       DateTime    @default(now())
    updatedAt       DateTime    @updatedAt
    
    user            User        @relation(fields: [userId], references: [id])
    userId          String
    
    file            File        @relation(fields: [fileId], references: [id])
    fileId          String      @unique
    
    // Mail-specific metadata
    pageCount       Int?
    isValidated     Boolean     @default(false)
    validationError String?
    mailJobs        MailJob[]
  }
  ```

**1.7 Wasp Operations Configuration**
- **Add to `main.wasp`** (new operations, doesn't modify existing):
  ```wasp
  //#region Mail File Upload
  action createMailFile {
    fn: import { createMailFile } from "@src/mail-upload/operations",
    entities: [User, File]
  }

  query getAllMailFilesByUser {
    fn: import { getAllMailFilesByUser } from "@src/mail-upload/operations",
    entities: [User, File]
  }

  query getMailFileDownloadURL {
    fn: import { getMailFileDownloadURL } from "@src/mail-upload/operations",
    entities: [User, File]
  }
  //#endregion
  ```

**1.8 Dependencies to Add**
- **Update `package.json`**:
  ```json
  {
    "dependencies": {
      "react-pdf": "^8.0.0",
      "pdfjs-dist": "^4.0.0",
      "@aws-sdk/client-textract": "^3.523.0"
    }
  }
  ```

**1.9 Integration Points**
- **Coexistence**: Mail upload system runs parallel to existing file upload
- **S3**: Uses same bucket with different key prefixes (`mail/` vs general files)
- **Database**: Reuses existing File model, adds MailFile for metadata
- **UI**: Follows same patterns as existing file upload but mail-specific
- **Validation**: Server-side validation with AWS Textract for better security
- **Performance**: 25MB limit for mail files vs 5MB for general files

2. **Mail Creation Form**
   - Create `src/mail-service/MailCreationPage.tsx`
   - Build address input forms with validation
   - Add mail type selection (First Class, Certified, etc.)
   - Integrate with existing file upload system

3. **Address Management**
   - Create address book functionality
   - Add address validation using Lob's address verification API
   - Implement address autocomplete

### **Phase 3: Payment Integration (Week 3)**
**Goal**: Integrate mail costs with existing payment system

#### Steps:
1. **Pricing Model**
   - Extend `src/payment/plans.ts` to include mail service pricing
   - Add mail-specific pricing calculations based on mail type and destination
   - Create pricing display components

2. **Payment Flow Integration**
   - Modify existing Stripe integration to handle mail service payments
   - Add mail job creation after successful payment
   - Implement payment failure handling and rollback

3. **Credit System Enhancement**
   - Extend existing credit system to support mail services
   - Add credit consumption tracking for mail jobs

### **Phase 4: Lob API Integration & Processing (Week 4)**
**Goal**: Complete integration with Lob for actual mail processing

#### Steps:
1. **Lob Job Creation**
   - Implement `createLobJob` function in `src/mail-service/lobClient.ts`
   - Add PDF to Lob conversion logic
   - Handle Lob API errors and retries

2. **Background Processing**
   - Create Wasp job for processing mail jobs
   - Implement queue system for handling multiple mail jobs
   - Add error handling and retry logic

3. **Status Updates**
   - Set up webhook handling for Lob status updates
   - Create `src/mail-service/webhook.ts` for processing Lob callbacks
   - Implement real-time status updates

### **Phase 5: Tracking & User Experience (Week 5)**
**Goal**: Complete end-to-end tracking and user dashboard

#### Steps:
1. **Tracking Dashboard**
   - Create `src/mail-service/TrackingPage.tsx`
   - Display mail job status and tracking information
   - Add estimated delivery dates

2. **Notifications**
   - Integrate with existing email system for status updates
   - Add in-app notifications for mail status changes
   - Create email templates for mail confirmations

3. **Admin Features**
   - Extend admin dashboard to show mail job analytics
   - Add mail service metrics to existing analytics
   - Create mail job management interface

### **Phase 6: Polish & Optimization (Week 6)**
**Goal**: Production readiness and user experience refinement

#### Steps:
1. **Error Handling & Validation**
   - Comprehensive error handling throughout the mail flow
   - Input validation and sanitization
   - User-friendly error messages

2. **Performance Optimization**
   - Optimize file upload and processing
   - Implement caching for frequently accessed data
   - Add loading states and progress indicators

3. **Testing & Documentation**
   - End-to-end testing of mail creation flow
   - Unit tests for critical functions
   - User documentation and help system

## **Why This Plan Style Works Best**

### **1. Leverages Existing Infrastructure**
Each phase builds on the existing Wasp features rather than recreating them.

### **2. Clear Dependencies**
Each phase has clear prerequisites and deliverables, making it easy to track progress.

### **3. Incremental Value**
Users can start using basic mail features after Phase 2, with full functionality by Phase 4.

### **4. Risk Management**
Early phases identify integration challenges before building complex features.

### **5. LLM-Friendly**
Each step is focused and specific, making it easy to generate targeted prompts for implementation.

### **6. Flexible Timeline**
Phases can be adjusted based on complexity and requirements.

## **Technical Considerations**

### **Database Models Needed**
```prisma
model MailJob {
  id              String      @id @default(uuid())
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  
  status          String      // 'pending', 'processing', 'sent', 'delivered', 'failed'
  mailType        String      // 'first_class', 'certified', 'priority'
  fromAddress     Json        // MailAddress object
  toAddress       Json        // MailAddress object
  pdfFileKey      String      // S3 key for uploaded PDF
  lobJobId        String?     // Lob API job ID
  trackingNumber  String?     // Lob tracking number
  cost            Float       // Cost in cents
  estimatedDelivery DateTime? // Estimated delivery date
}

model MailAddress {
  id              String      @id @default(uuid())
  createdAt       DateTime    @default(now())
  
  user            User        @relation(fields: [userId], references: [id])
  userId          String
  
  name            String
  company         String?
  addressLine1    String
  addressLine2    String?
  city            String
  state           String
  zipCode         String
  country         String      @default("US")
  isDefault       Boolean     @default(false)
}
```

### **Key Integration Points**
- **File Upload**: Extend existing S3 integration for PDF handling
- **Payment**: Leverage existing Stripe integration with mail-specific pricing
- **Auth**: Use existing user authentication and authorization
- **Admin**: Extend existing admin dashboard for mail job management

### **Environment Variables Needed**
```
LOB_API_KEY=your_lob_api_key
LOB_WEBHOOK_SECRET=your_webhook_secret
MAIL_SERVICE_ENABLED=true
```

This plan provides a structured, actionable roadmap that leverages your existing Wasp boilerplate while building a comprehensive physical mail service. Each phase delivers working functionality that can be tested and refined before moving to the next level of complexity.
