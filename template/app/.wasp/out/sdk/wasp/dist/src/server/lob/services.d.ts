/**
 * Validate an address using Lob API
 */
export declare function validateAddress(addressData: {
    address_line1: string;
    address_line2?: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
}): Promise<{
    isValid: boolean;
    verifiedAddress: any;
    error: string | null;
}>;
/**
 * Calculate cost for mail specifications using Lob API
 */
export declare function calculateCost(mailSpecs: {
    mailType: string;
    mailClass: string;
    mailSize: string;
    toAddress: any;
    fromAddress: any;
}): Promise<{
    cost: number;
    currency: string;
    breakdown: {
        baseCost: number;
        multiplier: number;
        mailType: string;
        mailClass: string;
        mailSize: string;
        fallback: boolean;
    };
} | {
    cost: number;
    currency: string;
    breakdown: {
        baseCost: number;
        multiplier: number;
        mailType: string;
        mailClass: string;
        mailSize: string;
        lobId?: undefined;
        lobPrice?: undefined;
    };
} | {
    cost: number;
    currency: string;
    breakdown: {
        baseCost: number;
        multiplier: number;
        mailType: string;
        mailClass: string;
        mailSize: string;
        lobId: string;
        lobPrice: string;
    };
}>;
/**
 * Create a mail piece using Lob API
 */
export declare function createMailPiece(mailData: {
    to: any;
    from: any;
    mailType: string;
    mailClass: string;
    mailSize: string;
    fileUrl?: string;
    description?: string;
}): Promise<{
    id: string;
    status: string;
    trackingNumber: string;
    estimatedDeliveryDate: Date;
    cost: number;
    lobData?: undefined;
} | {
    id: any;
    status: any;
    trackingNumber: any;
    estimatedDeliveryDate: Date;
    cost: number;
    lobData: any;
}>;
/**
 * Get mail piece status from Lob API
 */
export declare function getMailPieceStatus(lobId: string): Promise<{
    id: string;
    status: string;
    trackingNumber: string;
    estimatedDeliveryDate: Date;
    events: {
        timestamp: Date;
        status: string;
        description: string;
    }[];
    mailType?: undefined;
    lobData?: undefined;
} | {
    id: string;
    status: any;
    trackingNumber: any;
    estimatedDeliveryDate: Date;
    events: {
        timestamp: Date;
        status: string;
        description: string;
    }[];
    mailType: string;
    lobData: any;
}>;
//# sourceMappingURL=services.d.ts.map