// TypeScript type definitions for address management
// Following the pattern from src/file-upload/types.ts

import type { MailAddress } from 'wasp/entities';
import type { AddressType, SupportedCountry, USState, CanadianProvince } from './validation';

// Input types for creating addresses
export interface CreateAddressInput {
  contactName: string;
  companyName?: string;
  address_line1: string;
  address_line2?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: SupportedCountry;
  label?: string;
  addressType: AddressType;
}

// Input types for updating addresses
export interface UpdateAddressInput {
  contactName?: string;
  companyName?: string;
  address_line1?: string;
  address_line2?: string;
  address_city?: string;
  address_state?: string;
  address_zip?: string;
  address_country?: SupportedCountry;
  label?: string;
  addressType?: AddressType;
}

// Address form data
export interface AddressFormData extends CreateAddressInput {}

// Address search filters
export interface AddressSearchFilters {
  addressType?: AddressType;
  country?: SupportedCountry;
  state?: string;
  city?: string;
  searchQuery?: string;
}

// Address validation result (for future Lob API integration)
export interface AddressValidationResult {
  isValid: boolean;
  standardizedAddress?: {
    address_line1: string;
    address_line2?: string;
    address_city: string;
    address_state: string;
    address_zip: string;
    address_country: string;
  };
  suggestions?: string[];
  errors?: string[];
}

// Address usage statistics
export interface AddressUsageStats {
  totalUsage: number;
  lastUsedAt?: Date;
  usageByMonth: Array<{
    month: string;
    count: number;
  }>;
}

// Extended address type with computed properties
export interface AddressWithStats extends MailAddress {
  usageStats?: AddressUsageStats;
  isRecentlyUsed?: boolean;
  displayName: string;
}

// Address selection for mail creation
export interface AddressSelection {
  id: string;
  displayName: string;
  fullAddress: string;
  addressType: AddressType;
  isDefault?: boolean;
}
