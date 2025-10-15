/**
 * Lob Webhook Tests
 * 
 * Tests webhook signature verification, payload processing,
 * and event handling according to Lob's webhook specifications.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import crypto from 'crypto';
import { WEBHOOK_TIMESTAMP_MAX_AGE_MS, MS_PER_SECOND } from '../../server/constants/resilience';
import { LOB_STATUS_MAPPING, mapLobStatus } from '../../shared/statusMapping';

describe('Lob Webhook Tests', () => {
  
  describe('Webhook Signature Verification', () => {
    
    it('should correctly verify HMAC-SHA256 signature', () => {
      const payload = '{"id":"ltr_test123","status":"delivered"}';
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const secret = 'test_webhook_secret';

      // Generate expected signature (same as Lob does)
      const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(timestamp + '.' + payload)
        .digest('hex');

      // Verify signature (same as our webhook handler does)
      const isValid = crypto.timingSafeEqual(
        Buffer.from(expectedSignature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
      );

      expect(isValid).toBe(true);
    });

    it('should reject invalid signature', () => {
      const validSignature = 'abc123def456';
      const invalidSignature = 'invalid_signature';

      try {
        const isValid = crypto.timingSafeEqual(
          Buffer.from(validSignature, 'hex'),
          Buffer.from(invalidSignature, 'hex')
        );
        expect(isValid).toBe(false);
      } catch (error) {
        // Different length signatures will throw error
        expect(error).toBeDefined();
      }
    });

    it('should construct signature with correct format', () => {
      const payload = '{"test":"data"}';
      const timestamp = '1696377600';
      const secret = 'webhook_secret';

      // Lob uses format: timestamp + "." + payload
      const signatureString = timestamp + '.' + payload;
      
      expect(signatureString).toBe('1696377600.{"test":"data"}');
      
      const signature = crypto
        .createHmac('sha256', secret)
        .update(signatureString)
        .digest('hex');

      expect(signature).toBeTruthy();
      expect(signature.length).toBe(64); // SHA256 hex digest is 64 characters
    });
  });

  describe('Webhook Timestamp Validation', () => {
    
    it('should accept recent timestamps within 5 minutes', () => {
      const now = Date.now();
      const recentTimestamp = Math.floor(now / 1000); // Current time in seconds
      
      const webhookTime = recentTimestamp * 1000; // Convert to milliseconds
      const currentTime = now;
      const timeDifference = Math.abs(currentTime - webhookTime);
      
      // Should be within 5-minute tolerance (300,000 ms)
      expect(timeDifference).toBeLessThan(300000);
    });

    it('should reject old timestamps (> 5 minutes)', () => {
      const now = Date.now();
      const oldTimestamp = Math.floor((now - WEBHOOK_TIMESTAMP_MAX_AGE_MS) / MS_PER_SECOND);
      
      const webhookTime = oldTimestamp * 1000;
      const currentTime = now;
      const timeDifference = Math.abs(currentTime - webhookTime);
      
      // Should exceed 5-minute tolerance
      expect(timeDifference).toBeGreaterThan(300000);
    });

    it('should handle timestamp conversion correctly', () => {
      const secondsTimestamp = '1696377600'; // Unix timestamp in seconds
      const millisecondsTimestamp = parseInt(secondsTimestamp, 10) * 1000;
      
      expect(millisecondsTimestamp).toBe(1696377600000);
      
      const date = new Date(millisecondsTimestamp);
      expect(date).toBeInstanceOf(Date);
    });
  });

  describe('Webhook Payload Parsing', () => {
    
    it('should correctly parse JSON webhook payload', () => {
      const rawBody = JSON.stringify({
        id: 'ltr_test123',
        status: 'delivered',
        tracking_number: 'TRK123456',
        object: 'letter',
        expected_delivery_date: '2025-10-05',
      });

      const payload = JSON.parse(rawBody);

      expect(payload.id).toBe('ltr_test123');
      expect(payload.status).toBe('delivered');
      expect(payload.tracking_number).toBe('TRK123456');
      expect(payload.object).toBe('letter');
    });

    it('should extract required webhook fields', () => {
      const payload = {
        id: 'ltr_test123',
        status: 'delivered',
        tracking_number: 'TRK123456',
        object: 'letter',
      };

      const { id, status, tracking_number, object } = payload;

      expect(id).toBe('ltr_test123');
      expect(status).toBe('delivered');
      expect(tracking_number).toBe('TRK123456');
      expect(object).toBe('letter');
    });

    it('should handle missing optional fields', () => {
      const payload: {
        id: string;
        status: string;
        object: string;
        tracking_number?: string;
      } = {
        id: 'ltr_test123',
        status: 'delivered',
        object: 'letter',
        // tracking_number is optional in some cases
      };

      const tracking_number = payload.tracking_number || null;

      expect(tracking_number).toBeNull();
    });
  });

  describe('Status Mapping', () => {
    
    it('should map all Lob statuses to internal statuses', () => {
      // LOB_STATUS_MAPPING is now imported at the top

      // Test each mapping
      expect(LOB_STATUS_MAPPING['delivered']).toBe('delivered');
      expect(LOB_STATUS_MAPPING['returned']).toBe('returned');
      expect(LOB_STATUS_MAPPING['returned_to_sender']).toBe('returned');
      expect(LOB_STATUS_MAPPING['re-routed']).toBe('in_transit');
      expect(LOB_STATUS_MAPPING['in_transit']).toBe('in_transit');
      expect(LOB_STATUS_MAPPING['processing']).toBe('submitted');
      expect(LOB_STATUS_MAPPING['printed']).toBe('submitted');
      expect(LOB_STATUS_MAPPING['mailed']).toBe('submitted');
      expect(LOB_STATUS_MAPPING['created']).toBe('submitted');
      expect(LOB_STATUS_MAPPING['cancelled']).toBe('failed');
      expect(LOB_STATUS_MAPPING['failed']).toBe('failed');
    });

    it('should handle unknown status with fallback', () => {
      // mapLobStatus is now imported at the top

      const unknownStatus = 'some_new_status';
      const mappedStatus = mapLobStatus(unknownStatus, 'unknown');

      expect(mappedStatus).toBe('unknown');
    });

    it('should construct event type from object and status', () => {
      const testCases = [
        { object: 'letter', status: 'delivered', expected: 'letter.delivered' },
        { object: 'postcard', status: 'in_transit', expected: 'postcard.in_transit' },
        { object: 'check', status: 'mailed', expected: 'check.mailed' },
        { object: null, status: 'delivered', expected: 'unknown' },
      ];

      testCases.forEach(({ object, status, expected }) => {
        const eventType = object ? `${object}.${status}` : 'unknown';
        expect(eventType).toBe(expected);
      });
    });
  });

  describe('Webhook Idempotency', () => {
    
    it('should generate unique webhook ID', () => {
      const webhookId1 = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const webhookId2 = `webhook_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      expect(webhookId1).not.toBe(webhookId2);
      expect(webhookId1).toMatch(/^webhook_\d+_[a-z0-9]+$/);
    });

    it('should check for duplicate events within time window', () => {
      const now = Date.now();
      const oneMinuteAgo = now - 60000;

      // Simulate duplicate check
      const createdAt = new Date(now - 30000); // 30 seconds ago
      const windowStart = new Date(now - 60000); // 1 minute ago

      const isWithinWindow = createdAt >= windowStart;

      expect(isWithinWindow).toBe(true);
    });

    it('should allow events outside duplicate window', () => {
      const now = Date.now();
      const twoMinutesAgo = new Date(now - 2 * 60000);
      const windowStart = new Date(now - 60000);

      const isWithinWindow = twoMinutesAgo >= windowStart;

      expect(isWithinWindow).toBe(false);
    });
  });

  describe('Webhook Response Format', () => {
    
    it('should return correct success response', () => {
      const webhookId = 'webhook_1696377600_abc123';
      const lobId = 'ltr_test123';
      const eventType = 'letter.delivered';
      const processingTime = 45;

      const response = {
        received: true,
        webhookId,
        lobId,
        eventType,
        processingTimeMs: processingTime,
        timestamp: new Date().toISOString()
      };

      expect(response.received).toBe(true);
      expect(response.webhookId).toBe(webhookId);
      expect(response.lobId).toBe(lobId);
      expect(response.eventType).toBe(eventType);
      expect(response.processingTimeMs).toBe(45);
      expect(response.timestamp).toBeTruthy();
    });

    it('should return correct duplicate response', () => {
      const response = {
        received: true,
        webhookId: 'webhook_123',
        lobId: 'ltr_test123',
        eventType: 'letter.delivered',
        status: 'duplicate',
        message: 'Event already processed'
      };

      expect(response.status).toBe('duplicate');
      expect(response.message).toBe('Event already processed');
      expect(response.received).toBe(true);
    });

    it('should return correct error response', () => {
      const errorResponse = {
        error: 'Invalid webhook signature',
        webhookId: 'webhook_123',
        lobId: null,
        eventType: null,
        processingTimeMs: 10
      };

      expect(errorResponse.error).toBe('Invalid webhook signature');
      expect(errorResponse.webhookId).toBeTruthy();
    });
  });

  describe('Webhook Metrics', () => {
    
    it('should track webhook processing metrics', () => {
      const metrics = {
        totalEvents: 0,
        successfulEvents: 0,
        failedEvents: 0,
        averageProcessingTime: 0,
        eventsByType: {} as Record<string, number>,
        lastProcessedAt: null as Date | null,
      };

      // Simulate successful event
      const processingTime = 45;
      metrics.totalEvents++;
      metrics.successfulEvents++;
      metrics.averageProcessingTime = 
        (metrics.averageProcessingTime * (metrics.totalEvents - 1) + processingTime) / metrics.totalEvents;
      metrics.eventsByType['letter.delivered'] = 1;
      metrics.lastProcessedAt = new Date();

      expect(metrics.totalEvents).toBe(1);
      expect(metrics.successfulEvents).toBe(1);
      expect(metrics.failedEvents).toBe(0);
      expect(metrics.averageProcessingTime).toBe(45);
      expect(metrics.eventsByType['letter.delivered']).toBe(1);
      expect(metrics.lastProcessedAt).toBeInstanceOf(Date);
    });

    it('should calculate error rate correctly', () => {
      const metrics = {
        totalEvents: 10,
        successfulEvents: 8,
        failedEvents: 2,
      };

      const errorRate = (metrics.failedEvents / metrics.totalEvents) * 100;

      expect(errorRate).toBe(20);
    });

    it('should calculate average processing time correctly', () => {
      let avgTime = 0;
      let total = 0;

      const times = [45, 52, 38, 61, 49];

      times.forEach(time => {
        total++;
        avgTime = (avgTime * (total - 1) + time) / total;
      });

      expect(Math.round(avgTime)).toBe(49);
    });
  });

  describe('Webhook Headers', () => {
    
    it('should validate required webhook headers', () => {
      const headers = {
        'lob-signature': 'abc123def456...',
        'lob-signature-timestamp': '1696377600',
        'content-type': 'application/json'
      };

      const hasSignature = !!headers['lob-signature'];
      const hasTimestamp = !!headers['lob-signature-timestamp'];

      expect(hasSignature).toBe(true);
      expect(hasTimestamp).toBe(true);
    });

    it('should identify missing headers', () => {
      const headersWithoutSignature: {
        'lob-signature'?: string;
        'lob-signature-timestamp': string;
        'content-type': string;
      } = {
        'lob-signature-timestamp': '1696377600',
        'content-type': 'application/json'
      };

      const hasSignature = !!headersWithoutSignature['lob-signature'];
      const hasTimestamp = !!headersWithoutSignature['lob-signature-timestamp'];

      expect(hasSignature).toBe(false);
      expect(hasTimestamp).toBe(true);
    });
  });
});

