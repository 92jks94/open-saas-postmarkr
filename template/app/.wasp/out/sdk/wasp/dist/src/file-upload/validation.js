// Set this to the max file size you want to allow (currently 5MB).
// Nathan - Updated to 10MB and restricted to pdf only
export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const ALLOWED_FILE_TYPES = [
    'application/pdf',
];
// Mail-specific validation constants
export const MAIL_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB for mail
export const MAIL_ALLOWED_FILE_TYPES = ['application/pdf'];
// Mail type requirements
export const MAIL_TYPE_REQUIREMENTS = {
    'postcard': {
        maxPages: 1,
        minPages: 1,
        allowedOrientations: ['portrait', 'landscape'],
        recommendedSizes: ['4x6']
    },
    'letter': {
        maxPages: 6,
        minPages: 1,
        allowedOrientations: ['portrait'],
        recommendedSizes: ['6x9', '6x11']
    },
    'check': {
        maxPages: 1,
        minPages: 1,
        allowedOrientations: ['portrait'],
        recommendedSizes: ['6x9']
    },
    'self_mailer': {
        maxPages: 4,
        minPages: 1,
        allowedOrientations: ['portrait', 'landscape'],
        recommendedSizes: ['6x9', '6x11', '6x18']
    },
    'catalog': {
        maxPages: 50,
        minPages: 2,
        allowedOrientations: ['portrait'],
        recommendedSizes: ['9x12', '12x15', '12x18']
    },
    'booklet': {
        maxPages: 20,
        minPages: 2,
        allowedOrientations: ['portrait'],
        recommendedSizes: ['6x9', '9x12']
    }
};
// Mail size dimensions (in inches)
export const MAIL_SIZE_DIMENSIONS = {
    '4x6': { width: 4, height: 6 },
    '6x9': { width: 6, height: 9 },
    '6x11': { width: 6, height: 11 },
    '6x18': { width: 6, height: 18 },
    '9x12': { width: 9, height: 12 },
    '12x15': { width: 12, height: 15 },
    '12x18': { width: 12, height: 18 }
};
/**
 * Validate file for mail processing
 */
export function validateFileForMail(file, mailType, mailSize) {
    const errors = [];
    const warnings = [];
    // Check file type
    if (!MAIL_ALLOWED_FILE_TYPES.includes(file.type)) {
        errors.push('Only PDF files are supported for mail');
    }
    // Check file size
    if (file.size && file.size > MAIL_MAX_FILE_SIZE_BYTES) {
        errors.push('File size must be less than 10MB for mail processing');
    }
    // Check page count for mail type
    if (file.pageCount) {
        const requirements = MAIL_TYPE_REQUIREMENTS[mailType];
        if (requirements) {
            if (file.pageCount > requirements.maxPages) {
                errors.push(`${mailType} cannot have more than ${requirements.maxPages} pages`);
            }
            if (file.pageCount < requirements.minPages) {
                warnings.push(`${mailType} typically has at least ${requirements.minPages} pages`);
            }
        }
    }
    // Check orientation
    if (file.pdfMetadata?.orientation) {
        const requirements = MAIL_TYPE_REQUIREMENTS[mailType];
        if (requirements && !requirements.allowedOrientations.includes(file.pdfMetadata.orientation)) {
            warnings.push(`${mailType} works best with ${requirements.allowedOrientations.join(' or ')} orientation`);
        }
    }
    // Check mail size compatibility
    const sizeDimensions = MAIL_SIZE_DIMENSIONS[mailSize];
    if (sizeDimensions && file.pdfMetadata?.width && file.pdfMetadata?.height) {
        const tolerance = 0.1; // 10% tolerance
        const widthMatch = Math.abs(file.pdfMetadata.width - sizeDimensions.width) <= (sizeDimensions.width * tolerance);
        const heightMatch = Math.abs(file.pdfMetadata.height - sizeDimensions.height) <= (sizeDimensions.height * tolerance);
        if (!widthMatch || !heightMatch) {
            warnings.push(`File dimensions don't match mail size ${mailSize} - may need resizing`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
        warnings
    };
}
//# sourceMappingURL=validation.js.map