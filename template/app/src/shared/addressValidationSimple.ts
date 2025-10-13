import { z } from 'zod';

/**
 * Unified address validation module
 * Consolidates validation logic from multiple files into a single source of truth
 */

// Supported countries for address validation
export const SUPPORTED_COUNTRIES = [
  'US', 'CA', 'GB', 'AU', 'DE', 'FR', 'IT', 'ES', 
  'NL', 'BE', 'CH', 'AT', 'SE', 'NO', 'DK', 'FI'
] as const;

// US States
export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
] as const;

// Canadian Provinces
export const CANADIAN_PROVINCES = [
  'AB', 'BC', 'MB', 'NB', 'NL', 'NS', 'ON', 'PE', 'QC', 'SK', 'NT', 'NU', 'YT'
] as const;

// Address types
export const ADDRESS_TYPES = ['sender', 'recipient', 'both'] as const;
export type AddressType = typeof ADDRESS_TYPES[number];

// Basic address validation schema - simple and working
export const addressSchema = z.object({
  contactName: z.string().min(1, 'Contact name is required'),
  companyName: z.string().optional(),
  address_line1: z.string().min(1, 'Address line 1 is required'),
  address_line2: z.string().optional(),
  address_city: z.string().min(1, 'City is required'),
  address_state: z.string().min(1, 'State/Province is required'),
  address_zip: z.string().min(1, 'Postal code is required'),
  address_country: z.enum([...SUPPORTED_COUNTRIES] as [string, ...string[]]),
  label: z.string().optional(),
  addressType: z.enum(['sender', 'recipient', 'both']).default('both'),
});

// Mail creation validation schema - copy from working mail validation
export const mailCreationSchema = z.object({
  senderAddressId: z.string().uuid(),
  recipientAddressId: z.string().uuid(),
  fileId: z.string().uuid(),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
});

/**
 * Simple validation functions that actually work
 */
export class SimpleAddressValidator {
  /**
   * Validate address data
   */
  static validateAddress(data: any): { isValid: boolean; errors: Record<string, string> } {
    try {
      addressSchema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  /**
   * Validate mail creation data
   */
  static validateMailCreation(data: any): { isValid: boolean; errors: Record<string, string> } {
    try {
      mailCreationSchema.parse(data);
      return { isValid: true, errors: {} };
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errors: Record<string, string> = {};
        error.errors.forEach((err) => {
          const path = err.path.join('.');
          errors[path] = err.message;
        });
        return { isValid: false, errors };
      }
      return { isValid: false, errors: { general: 'Validation failed' } };
    }
  }

  /**
   * Get country-specific validation rules
   */
  static getCountryRules(country: string) {
    const rules: Record<string, any> = {
      US: {
        stateOptions: US_STATES,
        stateLabel: 'State',
        statePlaceholder: 'CA',
        stateMaxLength: 2,
        postalCodePattern: /^\d{5}(-\d{4})?$/,
        postalCodePlaceholder: '12345 or 12345-6789',
        postalCodeLabel: 'ZIP Code',
        zipLabel: 'ZIP Code',
        zipPlaceholder: '12345'
      },
      CA: {
        stateOptions: CANADIAN_PROVINCES,
        stateLabel: 'Province',
        statePlaceholder: 'ON',
        stateMaxLength: 2,
        postalCodePattern: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
        postalCodePlaceholder: 'A1A 1A1',
        postalCodeLabel: 'Postal Code',
        zipLabel: 'Postal Code',
        zipPlaceholder: 'A1A 1A1'
      },
      default: {
        stateOptions: [],
        stateLabel: 'State/Province',
        statePlaceholder: 'State or Province',
        stateMaxLength: 50,
        postalCodePattern: /^[a-zA-Z0-9\s\-]+$/,
        postalCodePlaceholder: 'Postal code',
        postalCodeLabel: 'Postal Code',
        zipLabel: 'Postal Code',
        zipPlaceholder: 'Postal code'
      }
    };
    
    return rules[country] || rules.default;
  }
}

// Export types
export type AddressData = z.infer<typeof addressSchema>;
export type MailCreationData = z.infer<typeof mailCreationSchema>;
