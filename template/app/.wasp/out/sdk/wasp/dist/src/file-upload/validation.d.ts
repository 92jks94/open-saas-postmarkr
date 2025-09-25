export declare const MAX_FILE_SIZE_BYTES: number;
export declare const ALLOWED_FILE_TYPES: readonly ["application/pdf"];
export declare const MAIL_MAX_FILE_SIZE_BYTES: number;
export declare const MAIL_ALLOWED_FILE_TYPES: readonly ["application/pdf"];
export declare const MAIL_TYPE_REQUIREMENTS: {
    readonly letter: {
        readonly maxPages: 6;
        readonly minPages: 1;
        readonly allowedOrientations: readonly ["portrait"];
        readonly recommendedSizes: readonly ["4x6"];
    };
};
export declare const MAIL_SIZE_DIMENSIONS: {
    readonly '4x6': {
        readonly width: 4;
        readonly height: 6;
    };
    readonly '6x9': {
        readonly width: 6;
        readonly height: 9;
    };
    readonly '6x11': {
        readonly width: 6;
        readonly height: 11;
    };
    readonly '6x18': {
        readonly width: 6;
        readonly height: 18;
    };
    readonly '9x12': {
        readonly width: 9;
        readonly height: 12;
    };
    readonly '12x15': {
        readonly width: 12;
        readonly height: 15;
    };
    readonly '12x18': {
        readonly width: 12;
        readonly height: 18;
    };
};
/**
 * Validate file for mail processing
 */
export declare function validateFileForMail(file: {
    type: string;
    size?: number;
    pageCount?: number;
    pdfMetadata?: any;
}, mailType: string, mailSize: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
};
//# sourceMappingURL=validation.d.ts.map