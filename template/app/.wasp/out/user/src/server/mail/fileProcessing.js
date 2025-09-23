import { HttpError } from 'wasp/server';
/**
 * Validate a file for mail processing requirements
 */
export function validateFileForMail(file, mailType, mailSize) {
    const errors = [];
    const warnings = [];
    // Check file type
    if (!file.type.includes('pdf')) {
        errors.push('Only PDF files are supported for mail');
    }
    // Check file size (max 10MB for mail)
    if (file.size && file.size > 10 * 1024 * 1024) {
        errors.push('File size must be less than 10MB');
    }
    // Check if file is validated
    if (file.validationStatus === 'invalid') {
        errors.push('File failed validation');
    }
    if (file.validationStatus === 'pending') {
        warnings.push('File validation in progress');
    }
    // Check page count for different mail types
    if (file.pageCount) {
        if (mailType === 'postcard' && file.pageCount !== 1) {
            errors.push('Postcards must be single page');
        }
        if (mailType === 'letter' && file.pageCount > 6) {
            warnings.push('Letters with more than 6 pages may incur additional costs');
        }
        if (mailType === 'catalog' && file.pageCount < 2) {
            warnings.push('Catalogs typically have multiple pages');
        }
    }
    // Check PDF metadata for orientation
    if (file.pdfMetadata) {
        const metadata = file.pdfMetadata;
        if (metadata.orientation && metadata.orientation !== 'portrait') {
            warnings.push('Landscape orientation may affect mail processing');
        }
    }
    // Check mail size compatibility
    const sizeCompatibility = checkMailSizeCompatibility(file, mailType, mailSize);
    if (!sizeCompatibility.isCompatible) {
        errors.push(...sizeCompatibility.errors);
        warnings.push(...sizeCompatibility.warnings);
    }
    const specifications = getFileSpecifications(file);
    return {
        isValid: errors.length === 0,
        errors,
        warnings,
        specifications
    };
}
/**
 * Extract file specifications for mail processing
 */
export function getFileSpecifications(file) {
    const metadata = file.pdfMetadata;
    return {
        pageCount: file.pageCount || 1,
        orientation: metadata?.orientation || 'portrait',
        dimensions: {
            width: metadata?.width || 0,
            height: metadata?.height || 0
        },
        fileSize: file.size || 0,
        isMailCompatible: file.validationStatus === 'valid'
    };
}
/**
 * Process file for Lob submission
 */
export function processFileForMail(file, mailType, mailSize) {
    const specifications = getFileSpecifications(file);
    const processingNotes = [];
    // Validate file before processing
    const validation = validateFileForMail(file, mailType, mailSize);
    if (!validation.isValid) {
        throw new HttpError(400, `File validation failed: ${validation.errors.join(', ')}`);
    }
    // Add processing notes
    if (validation.warnings.length > 0) {
        processingNotes.push(...validation.warnings);
    }
    // Check if file needs resizing for mail specifications
    const sizeCheck = checkMailSizeCompatibility(file, mailType, mailSize);
    if (sizeCheck.needsResizing) {
        processingNotes.push('File may need resizing for optimal mail processing');
    }
    // Generate file URL for Lob submission
    const fileUrl = file.uploadUrl; // Use existing upload URL
    return {
        fileUrl,
        specifications,
        processingNotes
    };
}
/**
 * Check mail size compatibility
 */
function checkMailSizeCompatibility(file, mailType, mailSize) {
    const errors = [];
    const warnings = [];
    let needsResizing = false;
    // Define mail size requirements
    const mailSizeRequirements = {
        '4x6': { width: 4, height: 6 },
        '6x9': { width: 6, height: 9 },
        '6x11': { width: 6, height: 11 },
        '6x18': { width: 6, height: 18 },
        '9x12': { width: 9, height: 12 },
        '12x15': { width: 12, height: 15 },
        '12x18': { width: 12, height: 18 }
    };
    const requiredSize = mailSizeRequirements[mailSize];
    if (!requiredSize) {
        errors.push(`Invalid mail size: ${mailSize}`);
        return { isCompatible: false, needsResizing: false, errors, warnings };
    }
    // Check file dimensions if available
    const metadata = file.pdfMetadata;
    if (metadata?.width && metadata?.height) {
        const fileWidth = metadata.width;
        const fileHeight = metadata.height;
        // Check if dimensions match mail size (with tolerance)
        const tolerance = 0.1; // 10% tolerance
        const widthMatch = Math.abs(fileWidth - requiredSize.width) <= (requiredSize.width * tolerance);
        const heightMatch = Math.abs(fileHeight - requiredSize.height) <= (requiredSize.height * tolerance);
        if (!widthMatch || !heightMatch) {
            needsResizing = true;
            warnings.push(`File dimensions (${fileWidth}" × ${fileHeight}") don't match mail size (${requiredSize.width}" × ${requiredSize.height}")`);
        }
    }
    else {
        warnings.push('File dimensions not available - will be processed as-is');
    }
    return {
        isCompatible: errors.length === 0,
        needsResizing,
        errors,
        warnings
    };
}
/**
 * Get mail type requirements
 */
export function getMailTypeRequirements(mailType) {
    const requirements = {
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
    return requirements[mailType] || requirements['letter'];
}
