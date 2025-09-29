/**
 * Critical Mail Operations Tests
 * Comprehensive unit tests for mail creation and management operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { HttpError } from 'wasp/server';
import { 
  createMailPiece,
  updateMailPieceStatus,
  submitMailPieceToLob,
  getMailPieces,
  getMailPiece,
  deleteMailPiece,
} from '../../mail/operations';
import { 
  createMockWaspContext,
  mockLob,
  mockSuccessfulServiceCalls,
  mockFailedServiceCalls,
  resetAllMocks,
} from '../utils/mocks';
import {
  createUser,
  createAuthUser,
  createMailPiece as createTestMailPiece,
  createMailAddress,
  createFile,
  createDraftMailPiece,
  createPaidMailPiece,
  createSubmittedMailPiece,
  createDeliveredMailPiece,
  createMailPieceStatusHistory,
} from '../utils/factories';

describe('Mail Operations - Critical Tests', () => {
  let mockContext: any;
  let testUser: any;
  let testSenderAddress: any;
  let testRecipientAddress: any;
  let testFile: any;

  beforeEach(() => {
    resetAllMocks();
    mockSuccessfulServiceCalls();
    
    testUser = createUser();
    const authUser = createAuthUser({ id: testUser.id });
    testSenderAddress = createMailAddress(testUser.id);
    testRecipientAddress = createMailAddress(testUser.id);
    testFile = createFile(testUser.id, { pageCount: 5 });
    
    mockContext = createMockWaspContext(authUser);
  });

  describe('createMailPiece', () => {
    it('should create mail piece with valid data', async () => {
      // Arrange
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: testRecipientAddress.id,
        fileId: testFile.id,
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockContext.entities.File.findFirst.mockResolvedValue(testFile);
      mockContext.entities.MailPiece.create.mockResolvedValue({
        id: 'test-mail-piece-id',
        ...mailData,
        status: 'draft',
        userId: testUser.id,
        createdAt: new Date(),
      });

      // Act
      const result = await createMailPiece(mailData, mockContext);

      // Assert
      expect(result).toHaveProperty('id');
      expect(result.status).toBe('draft');
      expect(result.userId).toBe(testUser.id);
      expect(mockContext.entities.MailPiece.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          ...mailData,
          userId: testUser.id,
          status: 'draft',
          pageCount: testFile.pageCount,
        }),
      });
    });

    it('should throw error for non-existent sender address', async () => {
      // Arrange
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: 'non-existent-sender',
        recipientAddressId: testRecipientAddress.id,
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        createMailPiece(mailData, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for non-existent recipient address', async () => {
      // Arrange
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: 'non-existent-recipient',
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(null);

      // Act & Assert
      await expect(
        createMailPiece(mailData, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for non-existent file', async () => {
      // Arrange
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: testRecipientAddress.id,
        fileId: 'non-existent-file',
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockContext.entities.File.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        createMailPiece(mailData, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should validate beta access requirement', async () => {
      // Arrange
      const nonBetaUser = createUser({ hasBetaAccess: false });
      const nonBetaContext = createMockWaspContext(nonBetaUser);
      
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: testRecipientAddress.id,
        description: 'Test mail piece',
      };

      // Act & Assert
      await expect(
        createMailPiece(mailData, nonBetaContext)
      ).rejects.toThrow(HttpError);
    });

    it('should validate page count for pricing', async () => {
      // Arrange
      const invalidFile = createFile(testUser.id, { pageCount: 25 }); // Too many pages
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: testRecipientAddress.id,
        fileId: invalidFile.id,
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockContext.entities.File.findFirst.mockResolvedValue(invalidFile);

      // Act & Assert
      await expect(
        createMailPiece(mailData, mockContext)
      ).rejects.toThrow(HttpError);
    });
  });

  describe('updateMailPieceStatus', () => {
    it('should update mail piece status with valid transition', async () => {
      // Arrange
      const mailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(mailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...mailPiece,
        status: 'pending_payment',
      });
      mockContext.entities.MailPieceStatusHistory.create.mockResolvedValue({
        id: 'status-history-id',
        mailPieceId: mailPiece.id,
        status: 'pending_payment',
        previousStatus: 'draft',
        source: 'system',
        createdAt: new Date(),
      });

      // Act
      const result = await updateMailPieceStatus(
        {
          lobId: mailPiece.lobId || 'test-lob-id',
          lobStatus: 'pending_payment',
        },
        mockContext
      );

      // Assert
      expect(result.status).toBe('pending_payment');
      expect(mockContext.entities.MailPieceStatusHistory.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mailPieceId: mailPiece.id,
          status: 'pending_payment',
          previousStatus: 'draft',
          source: 'system',
        }),
      });
    });

    it('should throw error for invalid status transition', async () => {
      // Arrange
      const deliveredMailPiece = createDeliveredMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(deliveredMailPiece);

      // Act & Assert
      await expect(
        updateMailPieceStatus(
          {
            lobId: deliveredMailPiece.lobId || 'test-lob-id',
            lobStatus: 'draft', // Invalid transition from delivered to draft
          },
          mockContext
        )
      ).rejects.toThrow(HttpError);
    });

    it('should handle Lob webhook status updates', async () => {
      // Arrange
      const submittedMailPiece = createSubmittedMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { lobId: 'lob_123' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(submittedMailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...submittedMailPiece,
        status: 'in_transit',
        lobStatus: 'in_transit',
        lobTrackingNumber: 'TRACK123',
      });

      // Act
      const result = await updateMailPieceStatus(
        {
          lobId: 'lob_123',
          lobStatus: 'in_transit',
          lobTrackingNumber: 'TRACK123',
          lobData: { id: 'lob_123', status: 'in_transit' },
        },
        mockContext
      );

      // Assert
      expect(result.status).toBe('in_transit');
      expect(result.lobStatus).toBe('in_transit');
      expect(result.lobTrackingNumber).toBe('TRACK123');
    });
  });

  describe('submitMailPieceToLob', () => {
    it('should submit paid mail piece to Lob successfully', async () => {
      // Arrange
      const paidMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { 
          status: 'pending_submission',
          paymentStatus: 'succeeded',
          fileId: testFile.id,
        }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(paidMailPiece);
      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockContext.entities.File.findFirst.mockResolvedValue(testFile);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...paidMailPiece,
        status: 'submitted',
        lobId: 'lob_123',
        lobStatus: 'processing',
      });

      // Act
      const result = await submitMailPieceToLob(
        { mailPieceId: paidMailPiece.id },
        mockContext
      );

      // Assert
      expect(result.success).toBe(true);
      expect(result.lobId).toBe('lob_123');
      expect(mockLob.letters.create).toHaveBeenCalledWith(
        expect.objectContaining({
          to: expect.objectContaining({
            address_line1: testRecipientAddress.address_line1,
            address_city: testRecipientAddress.address_city,
          }),
          from: expect.objectContaining({
            address_line1: testSenderAddress.address_line1,
            address_city: testSenderAddress.address_city,
          }),
        })
      );
    });

    it('should throw error for unpaid mail piece', async () => {
      // Arrange
      const unpaidMailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { paymentStatus: 'pending' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(unpaidMailPiece);

      // Act & Assert
      await expect(
        submitMailPieceToLob({ mailPieceId: unpaidMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle Lob API errors gracefully', async () => {
      // Arrange
      const paidMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'pending_submission' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(paidMailPiece);
      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockFailedServiceCalls();

      // Act & Assert
      await expect(
        submitMailPieceToLob({ mailPieceId: paidMailPiece.id }, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('getMailPieces', () => {
    it('should return paginated mail pieces for user', async () => {
      // Arrange
      const mailPieces = [
        createDraftMailPiece(testUser.id, testSenderAddress.id, testRecipientAddress.id),
        createPaidMailPiece(testUser.id, testSenderAddress.id, testRecipientAddress.id),
      ];
      
      mockContext.entities.MailPiece.findMany.mockResolvedValue(mailPieces);
      mockContext.entities.MailPiece.count.mockResolvedValue(2);

      // Act
      const result = await getMailPieces(
        { page: 1, limit: 10 },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('mailPieces');
      expect(result).toHaveProperty('total', 2);
      expect(result).toHaveProperty('page', 1);
      expect(result).toHaveProperty('hasNext', false);
      expect(result).toHaveProperty('hasPrev', false);
      expect(result.mailPieces).toHaveLength(2);
    });

    it('should filter mail pieces by status', async () => {
      // Arrange
      const draftMailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findMany.mockResolvedValue([draftMailPiece]);
      mockContext.entities.MailPiece.count.mockResolvedValue(1);

      // Act
      const result = await getMailPieces(
        { page: 1, limit: 10, status: 'draft' },
        mockContext
      );

      // Assert
      expect(result.mailPieces).toHaveLength(1);
      expect(result.mailPieces[0].status).toBe('draft');
    });

    it('should handle empty results', async () => {
      // Arrange
      mockContext.entities.MailPiece.findMany.mockResolvedValue([]);
      mockContext.entities.MailPiece.count.mockResolvedValue(0);

      // Act
      const result = await getMailPieces(
        { page: 1, limit: 10 },
        mockContext
      );

      // Assert
      expect(result.mailPieces).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('getMailPiece', () => {
    it('should return mail piece with relations', async () => {
      // Arrange
      const mailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(mailPiece);

      // Act
      const result = await getMailPiece(
        { id: mailPiece.id },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('id', mailPiece.id);
      expect(result).toHaveProperty('status', mailPiece.status);
    });

    it('should return null for non-existent mail piece', async () => {
      // Arrange
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(null);

      // Act
      const result = await getMailPiece(
        { id: 'non-existent-id' },
        mockContext
      );

      // Assert
      expect(result).toBeNull();
    });

    it('should throw error for mail piece not owned by user', async () => {
      // Arrange
      const otherUser = createUser();
      const otherUserMailPiece = createDraftMailPiece(
        otherUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(otherUserMailPiece);

      // Act & Assert
      await expect(
        getMailPiece({ id: otherUserMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });
  });

  describe('deleteMailPiece', () => {
    it('should delete draft mail piece', async () => {
      // Arrange
      const draftMailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(draftMailPiece);
      mockContext.entities.MailPiece.delete.mockResolvedValue(draftMailPiece);

      // Act
      const result = await deleteMailPiece(
        { id: draftMailPiece.id },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(mockContext.entities.MailPiece.delete).toHaveBeenCalledWith({
        where: { id: draftMailPiece.id },
      });
    });

    it('should throw error for submitted mail piece', async () => {
      // Arrange
      const submittedMailPiece = createSubmittedMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(submittedMailPiece);

      // Act & Assert
      await expect(
        deleteMailPiece({ id: submittedMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for delivered mail piece', async () => {
      // Arrange
      const deliveredMailPiece = createDeliveredMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(deliveredMailPiece);

      // Act & Assert
      await expect(
        deleteMailPiece({ id: deliveredMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });
  });

  describe('Mail Operations Edge Cases', () => {
    it('should handle database transaction failures', async () => {
      // Arrange
      const mailData = {
        mailType: 'letter',
        mailClass: 'first_class',
        mailSize: '6x9',
        senderAddressId: testSenderAddress.id,
        recipientAddressId: testRecipientAddress.id,
        description: 'Test mail piece',
      };

      mockContext.entities.MailAddress.findFirst
        .mockResolvedValueOnce(testSenderAddress)
        .mockResolvedValueOnce(testRecipientAddress);
      mockContext.entities.MailPiece.create.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        createMailPiece(mailData, mockContext)
      ).rejects.toThrow();
    });

    it('should validate user authentication for all operations', async () => {
      // Arrange
      const unauthenticatedContext = createMockWaspContext(undefined);

      // Act & Assert
      await expect(
        createMailPiece({} as any, unauthenticatedContext)
      ).rejects.toThrow(HttpError);

      await expect(
        getMailPieces({}, unauthenticatedContext)
      ).rejects.toThrow(HttpError);

      await expect(
        deleteMailPiece({ id: 'test-id' }, unauthenticatedContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle concurrent status updates', async () => {
      // Arrange
      const mailPiece = createDraftMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(mailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...mailPiece,
        status: 'pending_payment',
      });

      // Act - Simulate concurrent status updates
      const promises = [
        updateMailPieceStatus(
          { lobId: mailPiece.lobId || 'test-lob-id', lobStatus: 'pending_payment' },
          mockContext
        ),
        updateMailPieceStatus(
          { lobId: mailPiece.lobId || 'test-lob-id', lobStatus: 'pending_payment' },
          mockContext
        ),
      ];

      // Assert - Should handle gracefully
      const results = await Promise.allSettled(promises);
      expect(results).toHaveLength(2);
    });
  });
});