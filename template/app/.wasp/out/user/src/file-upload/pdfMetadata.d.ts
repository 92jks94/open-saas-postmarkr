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
    [key: string]: any;
}
export interface PDFValidationResult {
    isValid: boolean;
    metadata?: PDFMetadata;
    errors?: string[];
    [key: string]: any;
}
export declare const validatePDFMetadata: (metadata: PDFMetadata) => PDFValidationResult;
export declare const extractPDFMetadataFromBuffer: (buffer: Buffer) => Promise<PDFMetadata>;
export declare const isPDFBuffer: (buffer: Buffer) => boolean;
export declare const getPDFSizeInfo: (metadata: PDFMetadata) => string;
