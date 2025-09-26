import { SimpleAddressValidator } from '../addressValidationSimple';

describe('SimpleAddressValidator', () => {
  describe('validateAddress', () => {
    it('should validate a valid US address', () => {
      const validAddress = {
        contactName: 'John Doe',
        companyName: 'Acme Corp',
        address_line1: '123 Main St',
        address_line2: 'Suite 100',
        address_city: 'New York',
        address_state: 'NY',
        address_zip: '10001',
        address_country: 'US',
        label: 'Office',
        addressType: 'both' as const,
      };

      const result = SimpleAddressValidator.validateAddress(validAddress);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject missing required fields', () => {
      const invalidAddress = {
        contactName: '', // Missing required field
        address_line1: '123 Main St',
        address_city: 'New York',
        address_state: 'NY',
        address_zip: '10001',
        address_country: 'US',
        addressType: 'both' as const,
      };

      const result = SimpleAddressValidator.validateAddress(invalidAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.contactName).toContain('required');
    });

    it('should reject invalid country', () => {
      const invalidAddress = {
        contactName: 'John Doe',
        address_line1: '123 Main St',
        address_city: 'New York',
        address_state: 'NY',
        address_zip: '10001',
        address_country: 'INVALID', // Invalid country
        addressType: 'both' as const,
      };

      const result = SimpleAddressValidator.validateAddress(invalidAddress);
      expect(result.isValid).toBe(false);
      expect(result.errors.address_country).toBeDefined();
    });
  });

  describe('validateMailCreation', () => {
    it('should validate valid mail creation data', () => {
      const validData = {
        senderAddressId: '123e4567-e89b-12d3-a456-426614174000',
        recipientAddressId: '123e4567-e89b-12d3-a456-426614174001',
        fileId: '123e4567-e89b-12d3-a456-426614174002',
        description: 'Test mail piece',
      };

      const result = SimpleAddressValidator.validateMailCreation(validData);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual({});
    });

    it('should reject same sender and recipient', () => {
      const invalidData = {
        senderAddressId: '123e4567-e89b-12d3-a456-426614174000',
        recipientAddressId: '123e4567-e89b-12d3-a456-426614174000', // Same as sender
        fileId: '123e4567-e89b-12d3-a456-426614174002',
        description: 'Test mail piece',
      };

      const result = SimpleAddressValidator.validateMailCreation(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.recipientAddressId).toContain('must be different');
    });

    it('should reject description that is too long', () => {
      const invalidData = {
        senderAddressId: '123e4567-e89b-12d3-a456-426614174000',
        recipientAddressId: '123e4567-e89b-12d3-a456-426614174001',
        fileId: '123e4567-e89b-12d3-a456-426614174002',
        description: 'a'.repeat(501), // Too long
      };

      const result = SimpleAddressValidator.validateMailCreation(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.description).toContain('less than 500 characters');
    });
  });

  describe('getCountryRules', () => {
    it('should return US validation rules', () => {
      const rules = SimpleAddressValidator.getCountryRules('US');
      expect(rules.postalCodePattern).toEqual(/^\d{5}(-\d{4})?$/);
      expect(rules.postalCodePlaceholder).toBe('12345 or 12345-6789');
      expect(rules.postalCodeLabel).toBe('ZIP Code');
    });

    it('should return Canadian validation rules', () => {
      const rules = SimpleAddressValidator.getCountryRules('CA');
      expect(rules.postalCodePattern).toEqual(/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/);
      expect(rules.postalCodePlaceholder).toBe('A1A 1A1');
      expect(rules.postalCodeLabel).toBe('Postal Code');
    });

    it('should return default rules for unsupported countries', () => {
      const rules = SimpleAddressValidator.getCountryRules('FR');
      expect(rules.postalCodePattern).toEqual(/^[a-zA-Z0-9\s\-]+$/);
      expect(rules.postalCodePlaceholder).toBe('Postal code');
      expect(rules.postalCodeLabel).toBe('Postal Code');
    });
  });
});
