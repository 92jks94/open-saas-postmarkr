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
  addressLine1?: string;
  address_line1?: string;
  addressLine2?: string;
  address_line2?: string;
  city: string;
  state: string;
  postalCode?: string;
  zip_code?: string;
  country: string;
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
    address_line1: internalAddress.addressLine1 || internalAddress.address_line1 || '',
    address_line2: internalAddress.addressLine2 || internalAddress.address_line2,
    address_city: internalAddress.city,
    address_state: internalAddress.state,
    address_zip: internalAddress.postalCode || internalAddress.zip_code || '',
    address_country: internalAddress.country || 'US',
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
    addressLine1: lobAddress.address_line1,
    addressLine2: lobAddress.address_line2,
    city: lobAddress.address_city,
    state: lobAddress.address_state,
    postalCode: lobAddress.address_zip,
    country: lobAddress.address_country,
  };
}

/**
 * Validate that an address has all required fields for Lob API
 * 
 * @param address - Address to validate
 * @returns True if address is valid for Lob API
 */
export function validateLobAddress(address: InternalAddress): boolean {
  return !!(
    address.addressLine1 || address.address_line1 &&
    address.city &&
    address.state &&
    (address.postalCode || address.zip_code) &&
    address.country
  );
}

/**
 * Create a standardized address object from various input formats
 * Handles both internal format and Lob API format inputs
 * 
 * @param address - Address in any supported format
 * @returns Standardized internal address format
 */
export function normalizeAddress(address: any): InternalAddress {
  return {
    contactName: address.contactName || address.name,
    companyName: address.companyName || address.company,
    addressLine1: address.addressLine1 || address.address_line1,
    addressLine2: address.addressLine2 || address.address_line2,
    city: address.city,
    state: address.state,
    postalCode: address.postalCode || address.zip_code,
    country: address.country || 'US',
  };
}
