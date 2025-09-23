import { PDFMetadata, PDFValidationResult } from './pdfMetadata';
export interface ExtractPDFMetadataInput {
    fileId: string;
}
export interface ValidatePDFFileInput {
    fileId: string;
}
export interface ExtractPDFMetadataOutput {
    success: boolean;
    metadata?: PDFMetadata;
    error?: string;
    [key: string]: string | number | boolean | null | undefined | PDFMetadata;
}
export interface ValidatePDFFileOutput {
    success: boolean;
    validationResult?: PDFValidationResult;
    error?: string;
    [key: string]: string | number | boolean | null | undefined | PDFValidationResult;
}
export interface PDFProcessingStatus {
    status: 'pending' | 'processing' | 'completed' | 'failed';
    metadata?: PDFMetadata;
    error?: string;
    processedAt?: Date;
}
