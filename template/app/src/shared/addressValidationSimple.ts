import { z } from 'zod';
import { ADDRESS_VALIDATION_RULES, SUPPORTED_COUNTRIES, US_STATES, CANADIAN_PROVINCES } from '../address-management/validation';

/**
 * Simple address validation utility
 * Extracts the working validation logic from mail creation
 */

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
  senderAddressId: z.string().uuid('Invalid sender address ID'),
  recipientAddressId: z.string().uuid('Invalid recipient address ID'),
  fileId: z.string().uuid('Invalid file ID'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
}).refine(
  (data) => data.senderAddressId !== data.recipientAddressId,
  {
    message: 'Sender and recipient addresses must be different',
    path: ['recipientAddressId']
  }
);

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
        postalCodePattern: /^\d{5}(-\d{4})?$/,
        postalCodePlaceholder: '12345 or 12345-6789',
        postalCodeLabel: 'ZIP Code'
      },
      CA: {
        stateOptions: CANADIAN_PROVINCES,
        postalCodePattern: /^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/,
        postalCodePlaceholder: 'A1A 1A1',
        postalCodeLabel: 'Postal Code'
      },
      default: {
        stateOptions: [],
        postalCodePattern: /^[a-zA-Z0-9\s\-]+$/,
        postalCodePlaceholder: 'Postal code',
        postalCodeLabel: 'Postal Code'
      }
    };
    
    return rules[country] || rules.default;
  }
}

// Export types
export type AddressData = z.infer<typeof addressSchema>;
export type MailCreationData = z.infer<typeof mailCreationSchema>;
