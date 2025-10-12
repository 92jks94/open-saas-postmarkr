import { PDFDocument } from 'pdf-lib';
import { MAX_PDF_DIMENSION_PIXELS } from '../shared/constants/files';

export interface PDFMetadata {
  pageCount: number;
  dimensions: {
    width: number;
    height: number;
  };
  metadata: {
    title?: string;
    author?: string;
    subject?: string;
    creator?: string;
    producer?: string;
    creationDate?: Date;
    modificationDate?: Date;
  };
  [key: string]: any; // Index signature for Wasp JSON serialization
}

export interface PDFValidationResult {
  isValid: boolean;
  metadata?: PDFMetadata;
  errors?: string[];
  [key: string]: any; // Index signature for Wasp JSON serialization
}

export const validatePDFMetadata = (metadata: PDFMetadata): PDFValidationResult => {
  const errors: string[] = [];

  // Validate page count
  if (metadata.pageCount <= 0) {
    errors.push('PDF must have at least one page');
  }
  
  if (metadata.pageCount > 50) {
    errors.push('PDF has too many pages (maximum 50 allowed)');
  }

  // Validate dimensions
  if (metadata.dimensions.width < 200 || metadata.dimensions.height < 200) {
    errors.push('PDF dimensions are too small (minimum 200x200 pixels)');
  }

  if (metadata.dimensions.width > MAX_PDF_DIMENSION_PIXELS || metadata.dimensions.height > MAX_PDF_DIMENSION_PIXELS) {
    errors.push(`PDF dimensions are too large (maximum ${MAX_PDF_DIMENSION_PIXELS}x${MAX_PDF_DIMENSION_PIXELS} pixels)`);
  }

  return {
    isValid: errors.length === 0,
    metadata,
    errors: errors.length > 0 ? errors : undefined
  };
};

export const extractPDFMetadataFromBuffer = async (buffer: Buffer): Promise<PDFMetadata> => {
  try {
    const pdfDoc = await PDFDocument.load(buffer);
    
    // Get page count
    const pageCount = pdfDoc.getPageCount();
    
    // Get dimensions from first page
    const firstPage = pdfDoc.getPage(0);
    const { width, height } = firstPage.getSize();
    
    // Get document metadata
    const title = pdfDoc.getTitle();
    const author = pdfDoc.getAuthor();
    const subject = pdfDoc.getSubject();
    const creator = pdfDoc.getCreator();
    const producer = pdfDoc.getProducer();
    const creationDate = pdfDoc.getCreationDate();
    const modificationDate = pdfDoc.getModificationDate();

    return {
      pageCount,
      dimensions: {
        width,
        height
      },
      metadata: {
        title: title || undefined,
        author: author || undefined,
        subject: subject || undefined,
        creator: creator || undefined,
        producer: producer || undefined,
        creationDate: creationDate || undefined,
        modificationDate: modificationDate || undefined
      }
    };
  } catch (error) {
    throw new Error(`Failed to extract PDF metadata: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const isPDFBuffer = (buffer: Buffer): boolean => {
  // Check PDF magic bytes
  const pdfHeader = buffer.subarray(0, 4);
  return pdfHeader.toString() === '%PDF';
};

export const getPDFSizeInfo = (metadata: PDFMetadata): string => {
  const { width, height } = metadata.dimensions;
  const orientation = width > height ? 'landscape' : 'portrait';
  return `${Math.round(width)}x${Math.round(height)} (${orientation})`;
};
