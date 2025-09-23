import type { MailAddress } from 'wasp/entities';
import type { AddressType, SupportedCountry } from './validation';
export interface CreateAddressInput {
    contactName: string;
    companyName?: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country: SupportedCountry;
    label?: string;
    addressType: AddressType;
}
export interface UpdateAddressInput {
    contactName?: string;
    companyName?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: SupportedCountry;
    label?: string;
    addressType?: AddressType;
}
export interface AddressFormData extends CreateAddressInput {
}
export interface AddressSearchFilters {
    addressType?: AddressType;
    country?: SupportedCountry;
    state?: string;
    city?: string;
    searchQuery?: string;
}
export interface AddressValidationResult {
    isValid: boolean;
    standardizedAddress?: {
        addressLine1: string;
        addressLine2?: string;
        city: string;
        state: string;
        postalCode: string;
        country: string;
    };
    suggestions?: string[];
    errors?: string[];
}
export interface AddressUsageStats {
    totalUsage: number;
    lastUsedAt?: Date;
    usageByMonth: Array<{
        month: string;
        count: number;
    }>;
}
export interface AddressWithStats extends MailAddress {
    usageStats?: AddressUsageStats;
    isRecentlyUsed?: boolean;
    displayName: string;
}
export interface AddressSelection {
    id: string;
    displayName: string;
    fullAddress: string;
    addressType: AddressType;
    isDefault?: boolean;
}
