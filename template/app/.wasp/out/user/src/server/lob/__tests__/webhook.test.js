/**
 * Webhook Testing for Lob API Integration
 *
 * Tests webhook processing with real data and security validation
 */
import { handleLobWebhook, verifyWebhookSignature } from '../webhook';
import crypto from 'crypto';
// Mock the updateMailPieceStatus function
jest.mock('../../mail/operations', () => ({
    updateMailPieceStatus: jest.fn()
}));
describe('Lob Webhook Handler', () => {
    let mockReq;
    let mockRes;
    let mockContext;
    beforeEach(() => {
        jest.clearAllMocks();
        mockReq = {
            body: {},
            headers: {}
        };
        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
        mockContext = {
            entities: {
                MailPiece: {
                    findFirst: jest.fn(),
                    update: jest.fn()
                },
                MailPieceStatusHistory: {
                    create: jest.fn()
                }
            }
        };
    });
    describe('handleLobWebhook', () => {
        const validWebhookPayload = {
            id: 'lob_123456789',
            status: 'delivered',
            tracking_number: 'TRK123456789',
            type: 'letter',
            events: [
                {
                    name: 'delivered',
                    description: 'Mail piece delivered to recipient',
                    date_created: '2024-01-15T10:30:00Z'
                }
            ],
            expected_delivery_date: '2024-01-15',
            price: '0.60',
            url: 'https://lob.com/letters/lob_123456789'
        };
        it('should process valid webhook successfully', async () => {
            const { updateMailPieceStatus } = require('../../mail/operations');
            mockReq.body = validWebhookPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            // Mock signature verification to return true
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(updateMailPieceStatus).toHaveBeenCalledWith({
                lobId: 'lob_123456789',
                lobStatus: 'delivered',
                lobTrackingNumber: 'TRK123456789',
                lobData: {
                    status: 'delivered',
                    tracking_number: 'TRK123456789',
                    events: validWebhookPayload.events,
                    type: 'letter',
                    expected_delivery_date: '2024-01-15',
                    price: '0.60',
                    url: 'https://lob.com/letters/lob_123456789',
                    webhook_received_at: expect.any(String)
                }
            }, mockContext);
            expect(mockRes.status).toHaveBeenCalledWith(200);
            expect(mockRes.json).toHaveBeenCalledWith({
                received: true,
                lobId: 'lob_123456789',
                status: 'delivered',
                timestamp: expect.any(String)
            });
        });
        it('should reject webhook with invalid signature in production', async () => {
            process.env.NODE_ENV = 'production';
            mockReq.body = validWebhookPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=invalid_signature';
            // Mock signature verification to return false
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(false);
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(mockRes.status).toHaveBeenCalledWith(401);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Invalid webhook signature',
                timestamp: expect.any(String)
            });
        });
        it('should allow webhook without signature verification in development', async () => {
            process.env.NODE_ENV = 'development';
            mockReq.body = validWebhookPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=invalid_signature';
            const { updateMailPieceStatus } = require('../../mail/operations');
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(updateMailPieceStatus).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(200);
        });
        it('should handle missing lobId in webhook payload', async () => {
            const invalidPayload = { ...validWebhookPayload };
            delete invalidPayload.id;
            mockReq.body = invalidPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(mockRes.status).toHaveBeenCalledWith(400);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Missing required webhook data: lobId',
                timestamp: expect.any(String)
            });
        });
        it('should map different Lob statuses to internal statuses', async () => {
            const { updateMailPieceStatus } = require('../../mail/operations');
            const statusMappings = [
                { lobStatus: 'delivered', expectedInternal: 'delivered' },
                { lobStatus: 'returned', expectedInternal: 'returned' },
                { lobStatus: 'in_transit', expectedInternal: 'in_transit' },
                { lobStatus: 'processing', expectedInternal: 'submitted' },
                { lobStatus: 'printed', expectedInternal: 'submitted' },
                { lobStatus: 'mailed', expectedInternal: 'submitted' },
                { lobStatus: 'cancelled', expectedInternal: 'failed' },
                { lobStatus: 'failed', expectedInternal: 'failed' },
                { lobStatus: 'unknown_status', expectedInternal: 'unknown_status' }
            ];
            for (const mapping of statusMappings) {
                jest.clearAllMocks();
                const payload = { ...validWebhookPayload, status: mapping.lobStatus };
                mockReq.body = payload;
                mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
                jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
                updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
                await handleLobWebhook(mockReq, mockRes, mockContext);
                expect(updateMailPieceStatus).toHaveBeenCalledWith(expect.objectContaining({
                    lobStatus: mapping.expectedInternal
                }), mockContext);
            }
        });
        it('should handle webhook processing errors gracefully', async () => {
            const { updateMailPieceStatus } = require('../../mail/operations');
            mockReq.body = validWebhookPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            updateMailPieceStatus.mockRejectedValue(new Error('Database error'));
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(mockRes.status).toHaveBeenCalledWith(500);
            expect(mockRes.json).toHaveBeenCalledWith({
                error: 'Internal server error',
                timestamp: expect.any(String)
            });
        });
        it('should log webhook receipt for debugging', async () => {
            const consoleSpy = jest.spyOn(console, 'log').mockImplementation();
            mockReq.body = validWebhookPayload;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            const { updateMailPieceStatus } = require('../../mail/operations');
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(consoleSpy).toHaveBeenCalledWith('Lob webhook received:', {
                lobId: 'lob_123456789',
                status: 'delivered',
                type: 'letter',
                timestamp: expect.any(String)
            });
            consoleSpy.mockRestore();
        });
    });
    describe('verifyWebhookSignature', () => {
        const webhookSecret = 'test_webhook_secret';
        const payload = { id: 'lob_123', status: 'delivered' };
        const payloadString = JSON.stringify(payload);
        it('should verify valid webhook signature', () => {
            process.env.LOB_WEBHOOK_SECRET = webhookSecret;
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payloadString)
                .digest('hex');
            const signature = `sha256=${expectedSignature}`;
            const isValid = verifyWebhookSignature(payload, signature);
            expect(isValid).toBe(true);
        });
        it('should reject invalid webhook signature', () => {
            process.env.LOB_WEBHOOK_SECRET = webhookSecret;
            const invalidSignature = 'sha256=invalid_signature';
            const isValid = verifyWebhookSignature(payload, invalidSignature);
            expect(isValid).toBe(false);
        });
        it('should reject webhook without signature', () => {
            process.env.LOB_WEBHOOK_SECRET = webhookSecret;
            const isValid = verifyWebhookSignature(payload, '');
            expect(isValid).toBe(false);
        });
        it('should allow webhook in development when secret not configured', () => {
            delete process.env.LOB_WEBHOOK_SECRET;
            const isValid = verifyWebhookSignature(payload, 'any_signature');
            expect(isValid).toBe(true);
        });
        it('should handle signature verification errors gracefully', () => {
            process.env.LOB_WEBHOOK_SECRET = webhookSecret;
            // Test with malformed signature
            const malformedSignature = 'invalid_format';
            const isValid = verifyWebhookSignature(payload, malformedSignature);
            expect(isValid).toBe(false);
        });
        it('should use timing-safe comparison for signature verification', () => {
            process.env.LOB_WEBHOOK_SECRET = webhookSecret;
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(payloadString)
                .digest('hex');
            const signature = `sha256=${expectedSignature}`;
            // Mock crypto.timingSafeEqual to verify it's being used
            const timingSafeEqualSpy = jest.spyOn(crypto, 'timingSafeEqual');
            verifyWebhookSignature(payload, signature);
            expect(timingSafeEqualSpy).toHaveBeenCalled();
            timingSafeEqualSpy.mockRestore();
        });
    });
    describe('Real Webhook Data Tests', () => {
        it('should handle real Lob postcard webhook data', async () => {
            const realPostcardWebhook = {
                id: 'psc_123456789',
                status: 'delivered',
                tracking_number: '9400 1000 0000 0000 0000 00',
                type: 'postcard',
                events: [
                    {
                        name: 'created',
                        description: 'Postcard created',
                        date_created: '2024-01-10T08:00:00Z'
                    },
                    {
                        name: 'mailed',
                        description: 'Postcard mailed',
                        date_created: '2024-01-11T10:00:00Z'
                    },
                    {
                        name: 'delivered',
                        description: 'Postcard delivered',
                        date_created: '2024-01-15T14:30:00Z'
                    }
                ],
                expected_delivery_date: '2024-01-15',
                price: '0.50',
                url: 'https://lob.com/postcards/psc_123456789'
            };
            const { updateMailPieceStatus } = require('../../mail/operations');
            mockReq.body = realPostcardWebhook;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(updateMailPieceStatus).toHaveBeenCalledWith(expect.objectContaining({
                lobId: 'psc_123456789',
                lobStatus: 'delivered',
                lobTrackingNumber: '9400 1000 0000 0000 0000 00',
                lobData: expect.objectContaining({
                    type: 'postcard',
                    price: '0.50',
                    events: realPostcardWebhook.events
                })
            }), mockContext);
        });
        it('should handle real Lob letter webhook data', async () => {
            const realLetterWebhook = {
                id: 'ltr_123456789',
                status: 'in_transit',
                tracking_number: '9400 1000 0000 0000 0000 01',
                type: 'letter',
                events: [
                    {
                        name: 'created',
                        description: 'Letter created',
                        date_created: '2024-01-10T08:00:00Z'
                    },
                    {
                        name: 'mailed',
                        description: 'Letter mailed',
                        date_created: '2024-01-11T10:00:00Z'
                    },
                    {
                        name: 'in_transit',
                        description: 'Letter in transit',
                        date_created: '2024-01-12T12:00:00Z'
                    }
                ],
                expected_delivery_date: '2024-01-16',
                price: '0.60',
                url: 'https://lob.com/letters/ltr_123456789'
            };
            const { updateMailPieceStatus } = require('../../mail/operations');
            mockReq.body = realLetterWebhook;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(updateMailPieceStatus).toHaveBeenCalledWith(expect.objectContaining({
                lobId: 'ltr_123456789',
                lobStatus: 'in_transit',
                lobTrackingNumber: '9400 1000 0000 0000 0000 01',
                lobData: expect.objectContaining({
                    type: 'letter',
                    price: '0.60',
                    events: realLetterWebhook.events
                })
            }), mockContext);
        });
        it('should handle real Lob check webhook data', async () => {
            const realCheckWebhook = {
                id: 'chk_123456789',
                status: 'delivered',
                tracking_number: '9400 1000 0000 0000 0000 02',
                type: 'check',
                events: [
                    {
                        name: 'created',
                        description: 'Check created',
                        date_created: '2024-01-10T08:00:00Z'
                    },
                    {
                        name: 'mailed',
                        description: 'Check mailed',
                        date_created: '2024-01-11T10:00:00Z'
                    },
                    {
                        name: 'delivered',
                        description: 'Check delivered',
                        date_created: '2024-01-15T14:30:00Z'
                    }
                ],
                expected_delivery_date: '2024-01-15',
                price: '0.60',
                url: 'https://lob.com/checks/chk_123456789'
            };
            const { updateMailPieceStatus } = require('../../mail/operations');
            mockReq.body = realCheckWebhook;
            mockReq.headers['x-lob-signature'] = 'sha256=valid_signature';
            jest.spyOn(require('../webhook'), 'verifyWebhookSignature').mockReturnValue(true);
            updateMailPieceStatus.mockResolvedValue({ id: 'mail_123' });
            await handleLobWebhook(mockReq, mockRes, mockContext);
            expect(updateMailPieceStatus).toHaveBeenCalledWith(expect.objectContaining({
                lobId: 'chk_123456789',
                lobStatus: 'delivered',
                lobTrackingNumber: '9400 1000 0000 0000 0000 02',
                lobData: expect.objectContaining({
                    type: 'check',
                    price: '0.60',
                    events: realCheckWebhook.events
                })
            }), mockContext);
        });
    });
});
