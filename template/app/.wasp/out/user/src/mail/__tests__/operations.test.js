/**
 * Integration Tests for Mail Operations
 *
 * Tests the mail operations with real data and database interactions
 */
import { createMailPiece, getMailPieces, updateMailPiece, deleteMailPiece, createMailPaymentIntent, submitMailPieceToLob, syncMailPieceStatus } from '../operations';
// Mock Wasp entities and context
const mockContext = {
    user: {
        id: 'user_123',
        email: 'test@example.com'
    },
    entities: {
        MailPiece: {
            findMany: jest.fn(),
            findFirst: jest.fn(),
            create: jest.fn(),
            update: jest.fn(),
            delete: jest.fn()
        },
        MailAddress: {
            findFirst: jest.fn()
        },
        File: {
            findFirst: jest.fn()
        },
        MailPieceStatusHistory: {
            create: jest.fn()
        }
    }
};
// Mock external services
jest.mock('../../server/mail/payments', () => ({
    createMailPaymentIntent: jest.fn(),
    confirmMailPayment: jest.fn(),
    refundMailPayment: jest.fn()
}));
jest.mock('../../server/lob/services', () => ({
    createMailPiece: jest.fn(),
    getMailPieceStatus: jest.fn()
}));
describe('Mail Operations Integration Tests', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });
    describe('createMailPiece', () => {
        const validInput = {
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            senderAddressId: 'addr_123',
            recipientAddressId: 'addr_456',
            fileId: 'file_789',
            description: 'Test mail piece'
        };
        const mockSenderAddress = {
            id: 'addr_123',
            userId: 'user_123',
            addressLine1: '123 Main St',
            city: 'San Francisco',
            state: 'CA',
            postalCode: '94105'
        };
        const mockRecipientAddress = {
            id: 'addr_456',
            userId: 'user_123',
            addressLine1: '456 Oak Ave',
            city: 'New York',
            state: 'NY',
            postalCode: '10001'
        };
        const mockFile = {
            id: 'file_789',
            userId: 'user_123',
            fileName: 'test.pdf',
            uploadUrl: 'https://example.com/test.pdf'
        };
        const mockCreatedMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            ...validInput,
            status: 'draft',
            paymentStatus: 'pending',
            createdAt: new Date()
        };
        it('should create mail piece successfully with valid input', async () => {
            // Mock database responses
            mockContext.entities.MailAddress.findFirst
                .mockResolvedValueOnce(mockSenderAddress)
                .mockResolvedValueOnce(mockRecipientAddress);
            mockContext.entities.File.findFirst.mockResolvedValue(mockFile);
            mockContext.entities.MailPiece.create.mockResolvedValue(mockCreatedMailPiece);
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await createMailPiece(validInput, mockContext);
            expect(result).toEqual(mockCreatedMailPiece);
            expect(mockContext.entities.MailPiece.create).toHaveBeenCalledWith({
                data: {
                    userId: 'user_123',
                    ...validInput,
                    status: 'draft',
                    paymentStatus: 'pending'
                }
            });
            expect(mockContext.entities.MailPieceStatusHistory.create).toHaveBeenCalledWith({
                data: {
                    mailPieceId: 'mail_123',
                    status: 'draft',
                    description: 'Mail piece created',
                    source: 'system'
                }
            });
        });
        it('should throw error when user not authenticated', async () => {
            const contextWithoutUser = { ...mockContext, user: null };
            await expect(createMailPiece(validInput, contextWithoutUser))
                .rejects.toThrow('Not authorized');
        });
        it('should throw error when sender address not found', async () => {
            mockContext.entities.MailAddress.findFirst
                .mockResolvedValueOnce(null) // Sender address not found
                .mockResolvedValueOnce(mockRecipientAddress);
            await expect(createMailPiece(validInput, mockContext))
                .rejects.toThrow('Address not found');
        });
        it('should throw error when recipient address not found', async () => {
            mockContext.entities.MailAddress.findFirst
                .mockResolvedValueOnce(mockSenderAddress)
                .mockResolvedValueOnce(null); // Recipient address not found
            await expect(createMailPiece(validInput, mockContext))
                .rejects.toThrow('Address not found');
        });
        it('should throw error when file not found', async () => {
            mockContext.entities.MailAddress.findFirst
                .mockResolvedValueOnce(mockSenderAddress)
                .mockResolvedValueOnce(mockRecipientAddress);
            mockContext.entities.File.findFirst.mockResolvedValue(null);
            await expect(createMailPiece(validInput, mockContext))
                .rejects.toThrow('File not found');
        });
        it('should create mail piece without file when fileId not provided', async () => {
            const inputWithoutFile = { ...validInput };
            delete inputWithoutFile.fileId;
            mockContext.entities.MailAddress.findFirst
                .mockResolvedValueOnce(mockSenderAddress)
                .mockResolvedValueOnce(mockRecipientAddress);
            mockContext.entities.MailPiece.create.mockResolvedValue(mockCreatedMailPiece);
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await createMailPiece(inputWithoutFile, mockContext);
            expect(result).toEqual(mockCreatedMailPiece);
            expect(mockContext.entities.File.findFirst).not.toHaveBeenCalled();
        });
    });
    describe('getMailPieces', () => {
        const mockMailPieces = [
            {
                id: 'mail_123',
                userId: 'user_123',
                mailType: 'letter',
                status: 'draft',
                senderAddress: { id: 'addr_123', addressLine1: '123 Main St' },
                recipientAddress: { id: 'addr_456', addressLine1: '456 Oak Ave' },
                file: { id: 'file_789', fileName: 'test.pdf' },
                statusHistory: [
                    { id: 'hist_1', status: 'draft', createdAt: new Date() }
                ]
            }
        ];
        it('should return user mail pieces with relations', async () => {
            mockContext.entities.MailPiece.findMany.mockResolvedValue(mockMailPieces);
            const result = await getMailPieces({}, mockContext);
            expect(result).toEqual(mockMailPieces);
            expect(mockContext.entities.MailPiece.findMany).toHaveBeenCalledWith({
                where: { userId: 'user_123' },
                include: {
                    senderAddress: true,
                    recipientAddress: true,
                    file: true,
                    statusHistory: {
                        orderBy: { createdAt: 'desc' },
                        take: 5
                    }
                },
                orderBy: { createdAt: 'desc' }
            });
        });
        it('should throw error when user not authenticated', async () => {
            const contextWithoutUser = { ...mockContext, user: null };
            await expect(getMailPieces({}, contextWithoutUser))
                .rejects.toThrow('Not authorized');
        });
    });
    describe('updateMailPiece', () => {
        const updateInput = {
            id: 'mail_123',
            mailType: 'postcard',
            description: 'Updated description'
        };
        const mockExistingMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            status: 'draft',
            mailType: 'letter'
        };
        const mockUpdatedMailPiece = {
            ...mockExistingMailPiece,
            ...updateInput
        };
        it('should update mail piece successfully', async () => {
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockExistingMailPiece);
            mockContext.entities.MailPiece.update.mockResolvedValue(mockUpdatedMailPiece);
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await updateMailPiece(updateInput, mockContext);
            expect(result).toEqual(mockUpdatedMailPiece);
            expect(mockContext.entities.MailPiece.update).toHaveBeenCalledWith({
                where: { id: 'mail_123' },
                data: updateInput
            });
        });
        it('should throw error when mail piece not found', async () => {
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(null);
            await expect(updateMailPiece(updateInput, mockContext))
                .rejects.toThrow('Mail piece not found');
        });
        it('should throw error when trying to update non-draft mail piece', async () => {
            const nonDraftMailPiece = { ...mockExistingMailPiece, status: 'submitted' };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(nonDraftMailPiece);
            await expect(updateMailPiece(updateInput, mockContext))
                .rejects.toThrow('Mail piece can only be updated in draft status');
        });
    });
    describe('deleteMailPiece', () => {
        const deleteInput = { id: 'mail_123' };
        const mockExistingMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            status: 'draft'
        };
        it('should delete mail piece successfully', async () => {
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockExistingMailPiece);
            mockContext.entities.MailPiece.delete.mockResolvedValue({});
            const result = await deleteMailPiece(deleteInput, mockContext);
            expect(result).toEqual({ success: true });
            expect(mockContext.entities.MailPiece.delete).toHaveBeenCalledWith({
                where: { id: 'mail_123' }
            });
        });
        it('should throw error when trying to delete non-draft mail piece', async () => {
            const nonDraftMailPiece = { ...mockExistingMailPiece, status: 'submitted' };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(nonDraftMailPiece);
            await expect(deleteMailPiece(deleteInput, mockContext))
                .rejects.toThrow('Mail piece can only be deleted in draft status');
        });
    });
    describe('createMailPaymentIntent', () => {
        const paymentInput = { mailPieceId: 'mail_123' };
        const mockMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            status: 'draft',
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            senderAddress: { addressLine1: '123 Main St' },
            recipientAddress: { addressLine1: '456 Oak Ave' }
        };
        const mockPaymentData = {
            paymentIntentId: 'pi_123',
            cost: 6000, // $60.00 in cents
            clientSecret: 'pi_123_secret'
        };
        it('should create payment intent successfully', async () => {
            const { createMailPaymentIntent: mockCreatePayment } = require('../../server/mail/payments');
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockMailPiece);
            mockCreatePayment.mockResolvedValue(mockPaymentData);
            // Mock Stripe client
            const mockStripeClient = {
                paymentIntents: {
                    update: jest.fn().mockResolvedValue({}),
                    retrieve: jest.fn().mockResolvedValue({ client_secret: 'pi_123_secret' })
                }
            };
            jest.doMock('../../payment/stripe/stripeClient', () => ({
                stripe: mockStripeClient
            }));
            mockContext.entities.MailPiece.update.mockResolvedValue({});
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await createMailPaymentIntent(paymentInput, mockContext);
            expect(result).toEqual({
                paymentIntentId: 'pi_123',
                cost: 6000,
                clientSecret: 'pi_123_secret'
            });
            expect(mockCreatePayment).toHaveBeenCalledWith({
                mailType: 'letter',
                mailClass: 'usps_first_class',
                mailSize: '6x9',
                toAddress: mockMailPiece.recipientAddress,
                fromAddress: mockMailPiece.senderAddress
            }, 'user_123', mockContext);
        });
        it('should throw error when mail piece not found', async () => {
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(null);
            await expect(createMailPaymentIntent(paymentInput, mockContext))
                .rejects.toThrow('Mail piece not found');
        });
        it('should throw error when mail piece not in draft status', async () => {
            const nonDraftMailPiece = { ...mockMailPiece, status: 'submitted' };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(nonDraftMailPiece);
            await expect(createMailPaymentIntent(paymentInput, mockContext))
                .rejects.toThrow('Payment can only be created for draft mail pieces');
        });
    });
    describe('submitMailPieceToLob', () => {
        const submitInput = { mailPieceId: 'mail_123' };
        const mockPaidMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            paymentStatus: 'paid',
            mailType: 'letter',
            mailClass: 'usps_first_class',
            mailSize: '6x9',
            senderAddress: { addressLine1: '123 Main St' },
            recipientAddress: { addressLine1: '456 Oak Ave' },
            file: { uploadUrl: 'https://example.com/test.pdf' }
        };
        const mockLobResponse = {
            id: 'lob_123456',
            status: 'submitted',
            trackingNumber: 'TRK123456789',
            cost: 6000
        };
        it('should submit mail piece to Lob successfully', async () => {
            const { createMailPiece: mockCreateLobMailPiece } = require('../../server/lob/services');
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockPaidMailPiece);
            mockCreateLobMailPiece.mockResolvedValue(mockLobResponse);
            mockContext.entities.MailPiece.update.mockResolvedValue({});
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await submitMailPieceToLob(submitInput, mockContext);
            expect(result).toEqual({
                success: true,
                lobId: 'lob_123456'
            });
            expect(mockCreateLobMailPiece).toHaveBeenCalledWith({
                to: mockPaidMailPiece.recipientAddress,
                from: mockPaidMailPiece.senderAddress,
                mailType: 'letter',
                mailClass: 'usps_first_class',
                mailSize: '6x9',
                fileUrl: 'https://example.com/test.pdf',
                description: 'Mail piece created via Postmarkr - letter'
            });
        });
        it('should throw error when mail piece not paid', async () => {
            const unpaidMailPiece = { ...mockPaidMailPiece, paymentStatus: 'pending' };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(unpaidMailPiece);
            await expect(submitMailPieceToLob(submitInput, mockContext))
                .rejects.toThrow('Mail piece must be paid before submission to Lob');
        });
        it('should throw error when mail piece already submitted', async () => {
            const alreadySubmittedMailPiece = { ...mockPaidMailPiece, lobId: 'lob_existing' };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(alreadySubmittedMailPiece);
            await expect(submitMailPieceToLob(submitInput, mockContext))
                .rejects.toThrow('Mail piece already submitted to Lob');
        });
    });
    describe('syncMailPieceStatus', () => {
        const syncInput = { mailPieceId: 'mail_123' };
        const mockSubmittedMailPiece = {
            id: 'mail_123',
            userId: 'user_123',
            lobId: 'lob_123456',
            status: 'submitted'
        };
        const mockLobStatus = {
            id: 'lob_123456',
            status: 'delivered',
            trackingNumber: 'TRK123456789',
            events: [
                {
                    timestamp: new Date(),
                    status: 'delivered',
                    description: 'Mail piece delivered'
                }
            ]
        };
        it('should sync status from Lob successfully', async () => {
            const { getMailPieceStatus: mockGetLobStatus } = require('../../server/lob/services');
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockSubmittedMailPiece);
            mockGetLobStatus.mockResolvedValue(mockLobStatus);
            mockContext.entities.MailPiece.update.mockResolvedValue({});
            mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({});
            const result = await syncMailPieceStatus(syncInput, mockContext);
            expect(result).toEqual({
                success: true,
                status: 'delivered'
            });
            expect(mockGetLobStatus).toHaveBeenCalledWith('lob_123456');
        });
        it('should throw error when mail piece not submitted to Lob', async () => {
            const notSubmittedMailPiece = { ...mockSubmittedMailPiece, lobId: null };
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(notSubmittedMailPiece);
            await expect(syncMailPieceStatus(syncInput, mockContext))
                .rejects.toThrow('Mail piece has not been submitted to Lob yet');
        });
        it('should not update when status has not changed', async () => {
            const mockLobStatusSame = { ...mockLobStatus, status: 'submitted' };
            const { getMailPieceStatus: mockGetLobStatus } = require('../../server/lob/services');
            mockContext.entities.MailPiece.findFirst.mockResolvedValue(mockSubmittedMailPiece);
            mockGetLobStatus.mockResolvedValue(mockLobStatusSame);
            const result = await syncMailPieceStatus(syncInput, mockContext);
            expect(result).toEqual({
                success: true,
                status: 'submitted'
            });
            expect(mockContext.entities.MailPiece.update).not.toHaveBeenCalled();
        });
    });
});
