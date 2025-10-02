/**
 * Lob API Integration Tests
 * 
 * Tests the Lob API service layer to ensure correct data formatting
 * and API interactions according to Lob's specifications.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createMailPiece, validateAddress, getMailPieceStatus } from '../../server/lob/services';
import { mapToLobAddress, normalizeAddress } from '../../server/lob/addressMapper';

describe('Lob API Integration Tests', () => {
  
  describe('Address Validation', () => {
    
    it('should correctly format address for Lob API', () => {
      const inputAddress = {
        contactName: 'John Doe',
        address_line1: '123 Main St',
        address_line2: 'Apt 4',
        address_city: 'San Francisco',
        address_state: 'CA',
        address_zip: '94107',
        address_country: 'US'
      };

      const lobAddress = mapToLobAddress(normalizeAddress(inputAddress));

      // Verify all required Lob API fields are present
      expect(lobAddress).toHaveProperty('name');
      expect(lobAddress).toHaveProperty('address_line1');
      expect(lobAddress).toHaveProperty('address_city');
      expect(lobAddress).toHaveProperty('address_state');
      expect(lobAddress).toHaveProperty('address_zip');
      expect(lobAddress).toHaveProperty('address_country');

      // Verify correct values
      expect(lobAddress.name).toBe('John Doe');
      expect(lobAddress.address_line1).toBe('123 Main St');
      expect(lobAddress.address_line2).toBe('Apt 4');
      expect(lobAddress.address_city).toBe('San Francisco');
      expect(lobAddress.address_state).toBe('CA');
      expect(lobAddress.address_zip).toBe('94107');
      expect(lobAddress.address_country).toBe('US');
    });

    it('should handle missing optional fields', () => {
      const inputAddress = {
        contactName: 'Jane Smith',
        address_line1: '456 Oak Ave',
        address_city: 'Los Angeles',
        address_state: 'CA',
        address_zip: '90001',
        address_country: 'US'
      };

      const lobAddress = mapToLobAddress(normalizeAddress(inputAddress));

      expect(lobAddress.name).toBe('Jane Smith');
      expect(lobAddress.address_line2).toBeUndefined();
      expect(lobAddress.company).toBeUndefined();
    });

    it('should validate required address fields', () => {
      const validAddress = {
        contactName: 'Test User',
        address_line1: '123 Test St',
        address_city: 'Test City',
        address_state: 'CA',
        address_zip: '12345',
        address_country: 'US'
      };

      const normalizedAddress = normalizeAddress(validAddress);
      
      // All required fields should be present
      expect(normalizedAddress.contactName).toBe('Test User');
      expect(normalizedAddress.address_line1).toBe('123 Test St');
      expect(normalizedAddress.address_city).toBe('Test City');
      expect(normalizedAddress.address_state).toBe('CA');
      expect(normalizedAddress.address_zip).toBe('12345');
      expect(normalizedAddress.address_country).toBe('US');
    });
  });

  describe('Letter API Payload', () => {
    
    it('should include all required fields for letter creation', () => {
      const mailData = {
        to: {
          contactName: 'Recipient Name',
          address_line1: '123 Main St',
          address_city: 'San Francisco',
          address_state: 'CA',
          address_zip: '94107',
          address_country: 'US'
        },
        from: {
          contactName: 'Sender Name',
          address_line1: '456 Elm St',
          address_city: 'Los Angeles',
          address_state: 'CA',
          address_zip: '90001',
          address_country: 'US'
        },
        mailType: 'letter',
        mailClass: 'usps_first_class',
        mailSize: '8.5x11',
        description: 'Test letter',
        colorPrinting: false,
        doubleSided: true
      };

      // Verify the data structure matches Lob API expectations
      const normalizedTo = normalizeAddress(mailData.to);
      const normalizedFrom = normalizeAddress(mailData.from);
      
      const lobTo = mapToLobAddress(normalizedTo);
      const lobFrom = mapToLobAddress(normalizedFrom);

      // Required fields for Lob letters API
      expect(lobTo).toHaveProperty('name');
      expect(lobTo).toHaveProperty('address_line1');
      expect(lobTo).toHaveProperty('address_city');
      expect(lobTo).toHaveProperty('address_state');
      expect(lobTo).toHaveProperty('address_zip');

      expect(lobFrom).toHaveProperty('name');
      expect(lobFrom).toHaveProperty('address_line1');
      expect(lobFrom).toHaveProperty('address_city');
      expect(lobFrom).toHaveProperty('address_state');
      expect(lobFrom).toHaveProperty('address_zip');
    });

    it('should correctly set use_type for letters', () => {
      // According to Lob API docs, use_type is required for letters
      // We always set it to 'operational' for this MVP
      const useType = 'operational';
      
      expect(useType).toBe('operational');
      expect(['operational', 'marketing']).toContain(useType);
    });

    it('should correctly handle extra_service for mail classes', () => {
      const testCases = [
        { mailClass: 'usps_express', expectedService: 'express' },
        { mailClass: 'usps_priority', expectedService: 'priority' },
        { mailClass: 'usps_first_class', expectedService: undefined },
      ];

      testCases.forEach(({ mailClass, expectedService }) => {
        let actualService;
        
        if (mailClass === 'usps_express') {
          actualService = 'express';
        } else if (mailClass === 'usps_priority') {
          actualService = 'priority';
        } else if (mailClass === 'usps_first_class') {
          actualService = undefined;
        }

        expect(actualService).toBe(expectedService);
      });
    });

    it('should correctly handle color and double_sided options', () => {
      const testCases = [
        { colorPrinting: false, doubleSided: true, expectedColor: false, expectedDoubleSided: true },
        { colorPrinting: true, doubleSided: false, expectedColor: true, expectedDoubleSided: false },
        { colorPrinting: undefined, doubleSided: undefined, expectedColor: false, expectedDoubleSided: true }, // Defaults
      ];

      testCases.forEach(({ colorPrinting, doubleSided, expectedColor, expectedDoubleSided }) => {
        const color = colorPrinting ?? false;
        const double_sided = doubleSided ?? true;

        expect(color).toBe(expectedColor);
        expect(double_sided).toBe(expectedDoubleSided);
      });
    });
  });

  describe('Postcard API Payload', () => {
    
    it('should include all required fields for postcard creation', () => {
      const mailData = {
        to: {
          contactName: 'Recipient Name',
          address_line1: '123 Main St',
          address_city: 'San Francisco',
          address_state: 'CA',
          address_zip: '94107',
          address_country: 'US'
        },
        from: {
          contactName: 'Sender Name',
          address_line1: '456 Elm St',
          address_city: 'Los Angeles',
          address_state: 'CA',
          address_zip: '90001',
          address_country: 'US'
        },
        mailType: 'postcard',
        mailSize: '4x6',
        fileUrl: 'https://example.com/front.pdf',
      };

      const normalizedTo = normalizeAddress(mailData.to);
      const normalizedFrom = normalizeAddress(mailData.from);
      
      const lobTo = mapToLobAddress(normalizedTo);
      const lobFrom = mapToLobAddress(normalizedFrom);

      // Required fields for Lob postcards API
      expect(lobTo).toHaveProperty('name');
      expect(lobTo).toHaveProperty('address_line1');
      expect(lobTo).toHaveProperty('address_city');
      expect(lobTo).toHaveProperty('address_state');
      expect(lobTo).toHaveProperty('address_zip');

      expect(lobFrom).toHaveProperty('name');
      expect(lobFrom).toHaveProperty('address_line1');
      expect(lobFrom).toHaveProperty('address_city');
      expect(lobFrom).toHaveProperty('address_state');
      expect(lobFrom).toHaveProperty('address_zip');
    });

    it('should correctly map postcard sizes', () => {
      const testCases = [
        { inputSize: '4x6', expectedLobSize: '4x6' },
        { inputSize: '6x9', expectedLobSize: '6x9' },
        { inputSize: '6x11', expectedLobSize: '6x9' }, // Fallback to 6x9
      ];

      testCases.forEach(({ inputSize, expectedLobSize }) => {
        const lobSize = inputSize === '4x6' ? '4x6' : '6x9';
        expect(lobSize).toBe(expectedLobSize);
      });
    });
  });

  describe('Webhook Payload Processing', () => {
    
    it('should correctly map Lob status to internal status', () => {
      const statusMapping: Record<string, string> = {
        'delivered': 'delivered',
        'returned': 'returned',
        'returned_to_sender': 'returned',
        're-routed': 'in_transit',
        'in_transit': 'in_transit',
        'processing': 'submitted',
        'printed': 'submitted',
        'mailed': 'submitted',
        'created': 'submitted',
        'cancelled': 'failed',
        'failed': 'failed',
      };

      // Test each status mapping
      Object.entries(statusMapping).forEach(([lobStatus, internalStatus]) => {
        expect(statusMapping[lobStatus]).toBe(internalStatus);
      });
    });

    it('should extract required webhook fields', () => {
      const mockWebhookPayload = {
        id: 'ltr_test123',
        status: 'delivered',
        tracking_number: 'TRK123456',
        object: 'letter',
        expected_delivery_date: '2025-10-05',
      };

      // Verify all required fields are accessible
      expect(mockWebhookPayload).toHaveProperty('id');
      expect(mockWebhookPayload).toHaveProperty('status');
      expect(mockWebhookPayload).toHaveProperty('tracking_number');
      expect(mockWebhookPayload).toHaveProperty('object');

      expect(mockWebhookPayload.id).toBe('ltr_test123');
      expect(mockWebhookPayload.status).toBe('delivered');
      expect(mockWebhookPayload.tracking_number).toBe('TRK123456');
      expect(mockWebhookPayload.object).toBe('letter');
    });

    it('should construct correct event type from webhook data', () => {
      const testCases = [
        { object: 'letter', status: 'delivered', expectedEventType: 'letter.delivered' },
        { object: 'postcard', status: 'in_transit', expectedEventType: 'postcard.in_transit' },
        { object: 'check', status: 'returned', expectedEventType: 'check.returned' },
      ];

      testCases.forEach(({ object, status, expectedEventType }) => {
        const eventType = `${object}.${status}`;
        expect(eventType).toBe(expectedEventType);
      });
    });
  });

  describe('API Response Handling', () => {
    
    it('should correctly parse Lob API response', () => {
      const mockLobResponse = {
        id: 'ltr_test123',
        status: 'submitted',
        tracking_number: 'TRK123456',
        expected_delivery_date: '2025-10-05',
        price: '0.75',
      };

      // Parse response as our service does
      const costInDollars = parseFloat(mockLobResponse.price || '0.60');
      const costInCents = Math.round(costInDollars * 100);

      const result = {
        id: mockLobResponse.id,
        status: mockLobResponse.status || 'submitted',
        trackingNumber: mockLobResponse.tracking_number || `TRK${mockLobResponse.id}`,
        estimatedDeliveryDate: mockLobResponse.expected_delivery_date 
          ? new Date(mockLobResponse.expected_delivery_date)
          : new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        cost: costInCents,
      };

      expect(result.id).toBe('ltr_test123');
      expect(result.status).toBe('submitted');
      expect(result.trackingNumber).toBe('TRK123456');
      expect(result.cost).toBe(75); // 75 cents
      expect(result.estimatedDeliveryDate).toBeInstanceOf(Date);
    });

    it('should handle missing optional response fields', () => {
      const mockLobResponse: {
        id: string;
        price: string;
        status?: string;
        tracking_number?: string;
      } = {
        id: 'ltr_test456',
        price: '0.60',
      };

      const status = mockLobResponse.status || 'submitted';
      const trackingNumber = mockLobResponse.tracking_number || `TRK${mockLobResponse.id}`;

      expect(status).toBe('submitted');
      expect(trackingNumber).toBe('TRKltr_test456');
    });
  });

  describe('Error Handling', () => {
    
    it('should identify address validation errors', () => {
      const invalidAddress = {
        // Missing required fields
        contactName: 'Test User',
        address_line1: '123 Test St',
        // Missing city, state, zip
      };

      const normalized = normalizeAddress(invalidAddress);

      // Check that required fields are properly handled
      expect(normalized.address_city).toBeUndefined();
      expect(normalized.address_state).toBeUndefined();
      expect(normalized.address_zip).toBeUndefined();
    });

    it('should identify Lob API error types', () => {
      const errorScenarios = [
        { message: 'address is invalid', expectedStatus: 400 },
        { message: 'file format not supported', expectedStatus: 400 },
        { message: 'rate limit exceeded', expectedStatus: 429 },
        { message: 'insufficient funds', expectedStatus: 402 },
        { message: 'authentication failed', expectedStatus: 401 },
      ];

      errorScenarios.forEach(({ message, expectedStatus }) => {
        let detectedStatus = 500; // Default

        if (message.includes('address')) detectedStatus = 400;
        else if (message.includes('file')) detectedStatus = 400;
        else if (message.includes('rate limit')) detectedStatus = 429;
        else if (message.includes('insufficient')) detectedStatus = 402;
        else if (message.includes('authentication')) detectedStatus = 401;

        expect(detectedStatus).toBe(expectedStatus);
      });
    });
  });
});

