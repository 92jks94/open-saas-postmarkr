import type { File } from 'wasp/entities';
export interface FileValidationResult {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    specifications?: FileSpecifications;
}
export interface FileSpecifications {
    pageCount: number;
    orientation: 'portrait' | 'landscape' | 'square';
    dimensions: {
        width: number;
        height: number;
    };
    fileSize: number;
    isMailCompatible: boolean;
}
/**
 * Validate a file for mail processing requirements
 */
export declare function validateFileForMail(file: File, mailType: string, mailSize: string): FileValidationResult;
/**
 * Extract file specifications for mail processing
 */
export declare function getFileSpecifications(file: File): FileSpecifications;
/**
 * Process file for Lob submission
 */
export declare function processFileForMail(file: File, mailType: string, mailSize: string): {
    fileUrl: string;
    specifications: FileSpecifications;
    processingNotes: string[];
};
/**
 * Get mail type requirements
 */
export declare function getMailTypeRequirements(mailType: string): {
    maxPages: number;
    minPages: number;
    allowedOrientations: string[];
    recommendedSizes: string[];
};
