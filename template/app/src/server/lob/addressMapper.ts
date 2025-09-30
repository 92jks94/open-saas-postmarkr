/**
 * Address field mapping utilities for Lob API integration
 * 
 * This module provides consistent mapping between internal address format
 * and Lob API's expected format to prevent field naming inconsistencies.
 */

export interface InternalAddress {
  contactName?: string;
  name?: string;
  companyName?: string;
  company?: string;
  address_line1: string;  // Now matches Lob API exactly
  address_line2?: string; // Now matches Lob API exactly
  address_city: string;   // Now matches Lob API exactly
  address_state: string;  // Now matches Lob API exactly
  address_zip: string;    // Now matches Lob API exactly
  address_country: string; // Now matches Lob API exactly
}

export interface LobAddress {
  name?: string;
  company?: string;
  address_line1: string;
  address_line2?: string;
  address_city: string;
  address_state: string;
  address_zip: string;
  address_country: string;
}

/**
 * Convert internal address format to Lob API format
 * 
 * @param internalAddress - Address in internal format
 * @returns Address formatted for Lob API
 */
export function mapToLobAddress(internalAddress: InternalAddress): LobAddress {
  return {
    name: internalAddress.contactName || internalAddress.name || 'Recipient',
    company: internalAddress.companyName || internalAddress.company,
    address_line1: internalAddress.address_line1,
    address_line2: internalAddress.address_line2,
    address_city: internalAddress.address_city,
    address_state: internalAddress.address_state,
    address_zip: internalAddress.address_zip,
    address_country: internalAddress.address_country,
  };
}

/**
 * Convert Lob API address format to internal format
 * 
 * @param lobAddress - Address from Lob API response
 * @returns Address in internal format
 */
export function mapFromLobAddress(lobAddress: LobAddress): InternalAddress {
  return {
    contactName: lobAddress.name,
    companyName: lobAddress.company,
    address_line1: lobAddress.address_line1,
    address_line2: lobAddress.address_line2,
    address_city: lobAddress.address_city,
    address_state: lobAddress.address_state,
    address_zip: lobAddress.address_zip,
    address_country: lobAddress.address_country,
  };
}

/**
 * Validate that an address has all required fields for Lob API
 * 
 * @param address - Address to validate
 * @returns True if address is valid for Lob API
 */
export function validateLobAddress(address: InternalAddress): boolean {
  const checks = {
    name: !!(address.contactName || address.name), // Name is required for Lob API
    address_line1: !!address.address_line1,
    address_city: !!address.address_city,
    address_state: !!address.address_state,
    address_zip: !!address.address_zip,
    address_country: !!address.address_country,
  };
  
  const isValid = !!(
    checks.name &&
    checks.address_line1 &&
    checks.address_city &&
    checks.address_state &&
    checks.address_zip &&
    checks.address_country
  );
  
  console.log('🔍 Address validation checks:', { ...checks, isValid });
  return isValid;
}

/**
 * Get detailed validation errors for an address
 * 
 * @param address - Address to validate
 * @returns Array of missing required fields
 */
export function getAddressValidationErrors(address: InternalAddress): string[] {
  const errors: string[] = [];
  
  if (!address.contactName && !address.name) {
    errors.push('Name is required');
  }
  if (!address.address_line1) {
    errors.push('Address line 1 is required');
  }
  if (!address.address_city) {
    errors.push('City is required');
  }
  if (!address.address_state) {
    errors.push('State is required');
  }
  if (!address.address_zip) {
    errors.push('ZIP code is required');
  }
  if (!address.address_country) {
    errors.push('Country is required');
  }
  
  return errors;
}

/**
 * Create a standardized address object from various input formats
 * Handles both internal format and Lob API format inputs
 * 
 * @param address - Address in any supported format
 * @returns Standardized internal address format
 */
export function normalizeAddress(address: any): InternalAddress {
  const normalized = {
    contactName: address.contactName || address.name,
    companyName: address.companyName || address.company,
    address_line1: address.address_line1 || address.addressLine1 || address.primary_line,
    address_line2: address.address_line2 ?? address.addressLine2 ?? address.secondary_line,
    address_city: address.address_city || address.city,
    address_state: address.address_state || address.state,
    address_zip: address.address_zip || address.postalCode || address.zip_code,
    address_country: address.address_country || address.country || 'US',
  };
  
  console.log('🔄 Address normalization:', { input: address, output: normalized });
  return normalized;
}
