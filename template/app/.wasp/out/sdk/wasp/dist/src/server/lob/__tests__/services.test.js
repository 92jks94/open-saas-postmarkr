/**
 * Unit Tests for Lob API Services
 *
 * Tests the core Lob API integration functions with real data validation
 */
import { validateAddress, calculateCost, createMailPiece, getMailPieceStatus } from '../services';
import { RETRY_CONFIGS, RateLimitHandler, CircuitBreaker } from '../retry';
// Mock the Lob client for testing
jest.mock('../client', () => ({
    lob: {
        usVerifications: {
            verify: jest.fn()
        },
        postcards: {
            create: jest.fn(),
            retrieve: jest.fn()
        },
        letters: {
            create: jest.fn(),
            retrieve: jest.fn()
        },
        checks: {
            retrieve: jest.fn()
        }
    }
}));
// Mock environment variables
const originalEnv = process.env;
describe('Lob API Services', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        process.env = { ...originalEnv };
    });
    afterAll(() => {
        process.env = originalEnv;
    });
    describe('validateAddress', () => {
        const testAddress = {
            address_line1: '123 Main St',
            address_line2: 'Apt 4B',
            city: 'San Francisco',
            state: 'CA',
            zip_code: '94105',
            country: 'US'
        };
        it('should validate address successfully with real Lob API', async () => {
            // Mock successful Lob API response
            const mockLobClient = require('../client').lob;
            mockLobClient.usVerifications.verify.mockResolvedValue({
                deliverability: 'deliverable',
                address: {
                    id: 'addr_123',
                    ...testAddress
                }
            });
            // Set up environment for real API call
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await validateAddress(testAddress);
            expect(result.isValid).toBe(true);
            expect(result.error).toBeNull();
            expect(result.verifiedAddress).toBeDefined();
            expect(mockLobClient.usVerifications.verify).toHaveBeenCalledWith(testAddress);
        });
        it('should handle invalid address from Lob API', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.usVerifications.verify.mockResolvedValue({
                deliverability: 'undeliverable',
                address: null
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await validateAddress(testAddress);
            expect(result.isValid).toBe(false);
            expect(result.error).toBe('Address is not deliverable');
            expect(result.verifiedAddress).toBeNull();
        });
        it('should fallback to simulation mode when API key not configured', async () => {
            delete process.env.LOB_TEST_KEY;
            delete process.env.LOB_PROD_KEY;
            const result = await validateAddress(testAddress);
            expect(result.isValid).toBeDefined();
            expect(typeof result.isValid).toBe('boolean');
            expect(result.verifiedAddress).toBeDefined();
        });
        it('should handle API errors gracefully', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.usVerifications.verify.mockRejectedValue(new Error('API Error'));
            process.env.LOB_TEST_KEY = 'test_key_123';
            await expect(validateAddress(testAddress)).rejects.toThrow('Failed to validate address');
        });
    });
    describe('calculateCost', () => {
        const testMailSpecs = {
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            toAddress: {
                address_line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                country: 'US'
            },
            fromAddress: {
                address_line1: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                country: 'US'
            }
        };
        it('should calculate cost using real Lob API', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.letters.create.mockResolvedValue({
                id: 'lob_123',
                price: '0.60',
                status: 'created'
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await calculateCost(testMailSpecs);
            expect(result.cost).toBe(60); // 60 cents in cents
            expect(result.currency).toBe('USD');
            expect(result.breakdown).toBeDefined();
            expect(result.breakdown.lobId).toBe('lob_123');
            expect(result.breakdown.lobPrice).toBe('0.60');
        });
        it('should fallback to mock pricing when API fails', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.letters.create.mockRejectedValue(new Error('API Error'));
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await calculateCost(testMailSpecs);
            expect(result.cost).toBe(60); // Fallback pricing
            expect(result.currency).toBe('USD');
            expect(result.breakdown.fallback).toBe(true);
        });
        it('should use fallback pricing when API key not configured', async () => {
            delete process.env.LOB_TEST_KEY;
            delete process.env.LOB_PROD_KEY;
            const result = await calculateCost(testMailSpecs);
            expect(result.cost).toBe(60);
            expect(result.currency).toBe('USD');
            expect(result.breakdown.fallback).toBe(true);
        });
        it('should calculate different costs for different mail types', async () => {
            const postcardSpecs = { ...testMailSpecs, mailType: 'postcard' };
            const letterSpecs = { ...testMailSpecs, mailType: 'letter' };
            delete process.env.LOB_TEST_KEY;
            const postcardResult = await calculateCost(postcardSpecs);
            const letterResult = await calculateCost(letterSpecs);
            expect(postcardResult.cost).toBe(50); // Postcard base cost
            expect(letterResult.cost).toBe(60); // Letter base cost
        });
    });
    describe('createMailPiece', () => {
        const testMailData = {
            to: {
                address_line1: '123 Main St',
                city: 'San Francisco',
                state: 'CA',
                zip_code: '94105',
                country: 'US'
            },
            from: {
                address_line1: '456 Oak Ave',
                city: 'New York',
                state: 'NY',
                zip_code: '10001',
                country: 'US'
            },
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            description: 'Test mail piece'
        };
        it('should create mail piece using real Lob API', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.letters.create.mockResolvedValue({
                id: 'lob_123456',
                price: '0.60',
                status: 'submitted',
                tracking_number: 'TRK123456789',
                expected_delivery_date: '2024-01-15'
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await createMailPiece(testMailData);
            expect(result.id).toBe('lob_123456');
            expect(result.status).toBe('submitted');
            expect(result.trackingNumber).toBe('TRK123456789');
            expect(result.cost).toBe(60);
            expect(result.lobData).toBeDefined();
        });
        it('should create postcard using real Lob API', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.postcards.create.mockResolvedValue({
                id: 'lob_postcard_123',
                price: '0.50',
                status: 'submitted',
                tracking_number: 'TRK987654321'
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const postcardData = { ...testMailData, mailType: 'postcard' };
            const result = await createMailPiece(postcardData);
            expect(result.id).toBe('lob_postcard_123');
            expect(result.status).toBe('submitted');
            expect(result.cost).toBe(50);
        });
        it('should fallback to simulation mode when API key not configured', async () => {
            delete process.env.LOB_TEST_KEY;
            delete process.env.LOB_PROD_KEY;
            const result = await createMailPiece(testMailData);
            expect(result.id).toMatch(/^lob_\d+_[a-z0-9]+$/);
            expect(result.status).toBe('submitted');
            expect(result.trackingNumber).toMatch(/^TRK\d+$/);
            expect(result.cost).toBe(60);
        });
        it('should handle API errors with specific error messages', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.letters.create.mockRejectedValue(new Error('Invalid address format'));
            process.env.LOB_TEST_KEY = 'test_key_123';
            await expect(createMailPiece(testMailData)).rejects.toThrow('Invalid address format');
        });
    });
    describe('getMailPieceStatus', () => {
        const testLobId = 'lob_123456';
        it('should retrieve status using real Lob API', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.letters.retrieve.mockResolvedValue({
                id: testLobId,
                status: 'delivered',
                tracking_number: 'TRK123456789',
                expected_delivery_date: '2024-01-15',
                events: [
                    {
                        name: 'delivered',
                        description: 'Mail piece delivered',
                        date_created: '2024-01-15T10:30:00Z'
                    }
                ]
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await getMailPieceStatus(testLobId);
            expect(result.id).toBe(testLobId);
            expect(result.status).toBe('delivered');
            expect(result.trackingNumber).toBe('TRK123456789');
            expect(result.events).toHaveLength(1);
            expect(result.mailType).toBe('letter');
        });
        it('should try different mail types when retrieving status', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.postcards.retrieve.mockRejectedValue(new Error('Not found'));
            mockLobClient.letters.retrieve.mockResolvedValue({
                id: testLobId,
                status: 'in_transit',
                tracking_number: 'TRK123456789'
            });
            process.env.LOB_TEST_KEY = 'test_key_123';
            const result = await getMailPieceStatus(testLobId);
            expect(result.id).toBe(testLobId);
            expect(result.status).toBe('in_transit');
            expect(result.mailType).toBe('letter');
        });
        it('should fallback to simulation mode when API key not configured', async () => {
            delete process.env.LOB_TEST_KEY;
            delete process.env.LOB_PROD_KEY;
            const result = await getMailPieceStatus(testLobId);
            expect(result.id).toBe(testLobId);
            expect(['submitted', 'in_transit', 'delivered', 'returned']).toContain(result.status);
            expect(result.trackingNumber).toMatch(/^TRK\d+$/);
            expect(result.events).toBeDefined();
        });
        it('should handle mail piece not found error', async () => {
            const mockLobClient = require('../client').lob;
            mockLobClient.postcards.retrieve.mockRejectedValue(new Error('Mail piece not found'));
            mockLobClient.letters.retrieve.mockRejectedValue(new Error('Mail piece not found'));
            mockLobClient.checks.retrieve.mockRejectedValue(new Error('Mail piece not found'));
            process.env.LOB_TEST_KEY = 'test_key_123';
            await expect(getMailPieceStatus(testLobId)).rejects.toThrow('Mail piece not found in Lob API');
        });
    });
});
describe('Error Handling and Retry Logic', () => {
    describe('Circuit Breaker', () => {
        it('should start in CLOSED state', () => {
            const circuitBreaker = CircuitBreaker.getInstance();
            expect(circuitBreaker.getState()).toBe('CLOSED');
            expect(circuitBreaker.canExecute()).toBe(true);
        });
        it('should open after failure threshold', () => {
            const circuitBreaker = CircuitBreaker.getInstance();
            // Simulate failures up to threshold
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            expect(circuitBreaker.getState()).toBe('OPEN');
            expect(circuitBreaker.canExecute()).toBe(false);
        });
        it('should transition to HALF_OPEN after timeout', () => {
            const circuitBreaker = CircuitBreaker.getInstance();
            // Open the circuit
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            // Mock time passage
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 61000); // 61 seconds later
            expect(circuitBreaker.canExecute()).toBe(true);
            expect(circuitBreaker.getState()).toBe('HALF_OPEN');
            Date.now = originalNow;
        });
        it('should close circuit on successful request', () => {
            const circuitBreaker = CircuitBreaker.getInstance();
            // Open the circuit
            for (let i = 0; i < 5; i++) {
                circuitBreaker.onFailure();
            }
            // Mock time passage to HALF_OPEN
            const originalNow = Date.now;
            Date.now = jest.fn(() => originalNow() + 61000);
            circuitBreaker.onSuccess();
            expect(circuitBreaker.getState()).toBe('CLOSED');
            Date.now = originalNow;
        });
    });
    describe('Rate Limiting', () => {
        it('should not be rate limited initially', () => {
            const rateLimitHandler = RateLimitHandler.getInstance();
            expect(rateLimitHandler.isRateLimited()).toBe(false);
        });
        it('should set rate limit when handling rate limit error', () => {
            const rateLimitHandler = RateLimitHandler.getInstance();
            const error = {
                headers: { 'retry-after': '60' }
            };
            rateLimitHandler.handleRateLimitError(error);
            expect(rateLimitHandler.isRateLimited()).toBe(true);
        });
        it('should use default rate limit when no retry-after header', () => {
            const rateLimitHandler = RateLimitHandler.getInstance();
            rateLimitHandler.handleRateLimitError({});
            expect(rateLimitHandler.isRateLimited()).toBe(true);
        });
    });
    describe('Retry Configuration', () => {
        it('should have different retry configs for different operations', () => {
            expect(RETRY_CONFIGS.addressValidation.maxRetries).toBe(2);
            expect(RETRY_CONFIGS.costCalculation.maxRetries).toBe(3);
            expect(RETRY_CONFIGS.mailPieceCreation.maxRetries).toBe(5);
            expect(RETRY_CONFIGS.statusRetrieval.maxRetries).toBe(3);
            expect(RETRY_CONFIGS.webhookProcessing.maxRetries).toBe(2);
        });
        it('should have appropriate base delays', () => {
            expect(RETRY_CONFIGS.addressValidation.baseDelay).toBe(500);
            expect(RETRY_CONFIGS.costCalculation.baseDelay).toBe(1000);
            expect(RETRY_CONFIGS.mailPieceCreation.baseDelay).toBe(2000);
            expect(RETRY_CONFIGS.statusRetrieval.baseDelay).toBe(1000);
            expect(RETRY_CONFIGS.webhookProcessing.baseDelay).toBe(500);
        });
    });
});
//# sourceMappingURL=services.test.js.map