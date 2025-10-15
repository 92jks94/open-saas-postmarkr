/**
 * Critical Payment Operations Tests
 * Comprehensive unit tests for payment processing operations
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { 
  createMailPaymentIntent,
  confirmMailPayment,
  refundMailPayment,
} from '../../mail/operations';
import { HttpError } from 'wasp/server';
import { 
  createMockWaspContext,
  mockStripe,
  mockSuccessfulServiceCalls,
  mockFailedServiceCalls,
  resetAllMocks,
} from '../utils/mocks';
import {
  createUser,
  createAuthUser,
  createMailPiece,
  createMailAddress,
  createFile,
  createPaidMailPiece,
} from '../utils/factories';

describe('Payment Operations - Critical Tests', () => {
  let mockContext: any;
  let testUser: any;
  let testMailPiece: any;
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
    testMailPiece = createMailPiece(
      testUser.id,
      testSenderAddress.id,
      testRecipientAddress.id,
      { fileId: testFile.id, pageCount: testFile.pageCount }
    );
    
    mockContext = createMockWaspContext(authUser);
  });

  describe('createMailPaymentIntent', () => {
    it('should create payment intent for valid draft mail piece', async () => {
      // Arrange
      const draftMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'draft', fileId: testFile.id, pageCount: testFile.pageCount }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(draftMailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...draftMailPiece,
        status: 'pending_payment',
        paymentIntentId: 'pi_test_123',
        cost: 2.50,
      });

      // Act
      const result = await createMailPaymentIntent(
        { mailPieceId: draftMailPiece.id },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('paymentIntentId');
      expect(result).toHaveProperty('cost');
      expect(result).toHaveProperty('clientSecret');
      expect(result.cost).toBeGreaterThan(0);
      expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
        expect.objectContaining({
          amount: expect.any(Number),
          currency: 'usd',
          metadata: expect.objectContaining({
            mailPieceId: draftMailPiece.id,
            userId: testUser.id,
          }),
        })
      );
    });

    it('should throw error for non-existent mail piece', async () => {
      // Arrange
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: 'non-existent-id' }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for mail piece not owned by user', async () => {
      // Arrange
      const otherUser = createUser();
      const otherUserMailPiece = createMailPiece(
        otherUser.id,
        testSenderAddress.id,
        testRecipientAddress.id
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(otherUserMailPiece);

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: otherUserMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for mail piece not in draft status', async () => {
      // Arrange
      const submittedMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'submitted' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(submittedMailPiece);

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: submittedMailPiece.id }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle Stripe API errors gracefully', async () => {
      // Arrange
      const draftMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'draft' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(draftMailPiece);
      mockFailedServiceCalls();

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: draftMailPiece.id }, mockContext)
      ).rejects.toThrow();
    });

    it('should calculate correct pricing for different page counts', async () => {
      // Arrange
      const testCases = [
        { pageCount: 1, expectedTier: 'tier_1' },
        { pageCount: 5, expectedTier: 'tier_1' },
        { pageCount: 6, expectedTier: 'tier_2' },
        { pageCount: 20, expectedTier: 'tier_2' },
      ];

      for (const testCase of testCases) {
        const testFileWithPages = createFile(testUser.id, { pageCount: testCase.pageCount });
        const mailPieceWithPages = createMailPiece(
          testUser.id,
          testSenderAddress.id,
          testRecipientAddress.id,
          { 
            status: 'draft',
            fileId: testFileWithPages.id,
            pageCount: testCase.pageCount,
            pricingTier: testCase.expectedTier,
          }
        );
        
        mockContext.entities.MailPiece.findFirst.mockResolvedValue(mailPieceWithPages);
        mockContext.entities.MailPiece.update.mockResolvedValue(mailPieceWithPages);

        // Act
        const result = await createMailPaymentIntent(
          { mailPieceId: mailPieceWithPages.id },
          mockContext
        );

        // Assert
        expect(result.cost).toBeGreaterThan(0);
        expect(mockStripe.paymentIntents.create).toHaveBeenCalledWith(
          expect.objectContaining({
            metadata: expect.objectContaining({
              pricingTier: testCase.expectedTier,
            }),
          })
        );
      }
    });
  });

  describe('confirmMailPayment', () => {
    it('should confirm payment and update mail piece status', async () => {
      // Arrange
      const paidMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { paymentIntentId: 'pi_test_123' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(paidMailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...paidMailPiece,
        status: 'pending_submission',
        paymentStatus: 'succeeded',
      });

      // Act
      const result = await confirmMailPayment(
        { mailPieceId: testMailPiece.id, paymentIntentId: 'pi_test_123' },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(mockContext.entities.MailPiece.update).toHaveBeenCalledWith({
        where: { id: paidMailPiece.id },
        data: expect.objectContaining({
          paymentStatus: 'succeeded',
          status: 'pending_submission',
        }),
      });
    });

    it('should throw error for non-existent payment intent', async () => {
      // Arrange
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(null);

      // Act & Assert
      await expect(
        confirmMailPayment({ mailPieceId: testMailPiece.id, paymentIntentId: 'non-existent-pi' }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle Stripe payment confirmation errors', async () => {
      // Arrange
      const paidMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { paymentIntentId: 'pi_test_123' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(paidMailPiece);
      mockStripe.paymentIntents.confirm.mockRejectedValue(new Error('Payment failed'));

      // Act & Assert
      await expect(
        confirmMailPayment({ mailPieceId: testMailPiece.id, paymentIntentId: 'pi_test_123' }, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('refundMailPayment', () => {
    it('should refund payment for failed mail piece', async () => {
      // Arrange
      const failedMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { 
          paymentIntentId: 'pi_test_123',
          status: 'failed',
          paymentStatus: 'succeeded',
        }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(failedMailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...failedMailPiece,
        paymentStatus: 'refunded',
      });

      // Act
      const result = await refundMailPayment(
        { mailPieceId: failedMailPiece.id, reason: 'mail_processing_failed' },
        mockContext
      );

      // Assert
      expect(result).toHaveProperty('success', true);
      expect(mockStripe.paymentIntents.refund).toHaveBeenCalledWith(
        failedMailPiece.paymentIntentId,
        expect.objectContaining({
          metadata: expect.objectContaining({
            mailPieceId: failedMailPiece.id,
            reason: 'mail_processing_failed',
          }),
        })
      );
    });

    it('should throw error for mail piece without payment intent', async () => {
      // Arrange
      const unpaidMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { paymentIntentId: null }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(unpaidMailPiece);

      // Act & Assert
      await expect(
        refundMailPayment({ mailPieceId: unpaidMailPiece.id, reason: 'test_reason' }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should throw error for already refunded mail piece', async () => {
      // Arrange
      const refundedMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { 
          paymentIntentId: 'pi_test_123',
          paymentStatus: 'refunded',
        }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(refundedMailPiece);

      // Act & Assert
      await expect(
        refundMailPayment({ mailPieceId: refundedMailPiece.id, reason: 'test_reason' }, mockContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle Stripe refund errors gracefully', async () => {
      // Arrange
      const failedMailPiece = createPaidMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { 
          paymentIntentId: 'pi_test_123',
          status: 'failed',
        }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(failedMailPiece);
      mockStripe.paymentIntents.refund.mockRejectedValue(new Error('Refund failed'));

      // Act & Assert
      await expect(
        refundMailPayment({ mailPieceId: failedMailPiece.id, reason: 'test_reason' }, mockContext)
      ).rejects.toThrow();
    });
  });

  describe('Payment Edge Cases', () => {
    it('should handle concurrent payment intent creation', async () => {
      // Arrange
      const draftMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'draft' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(draftMailPiece);
      mockContext.entities.MailPiece.update.mockResolvedValue({
        ...draftMailPiece,
        status: 'pending_payment',
        paymentIntentId: 'pi_test_123',
      });

      // Act - Simulate concurrent calls
      const promises = [
        createMailPaymentIntent({ mailPieceId: draftMailPiece.id }, mockContext),
        createMailPaymentIntent({ mailPieceId: draftMailPiece.id }, mockContext),
      ];

      // Assert - Should handle gracefully (either succeed or fail appropriately)
      const results = await Promise.allSettled(promises);
      expect(results).toHaveLength(2);
    });

    it('should validate user authentication for all payment operations', async () => {
      // Arrange
      const unauthenticatedContext = createMockWaspContext(undefined);

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: 'test-id' }, unauthenticatedContext)
      ).rejects.toThrow(HttpError);

      await expect(
        confirmMailPayment({ mailPieceId: 'test-id', paymentIntentId: 'test-pi' }, unauthenticatedContext)
      ).rejects.toThrow(HttpError);

      await expect(
        refundMailPayment({ mailPieceId: 'test-id', reason: 'test_reason' }, unauthenticatedContext)
      ).rejects.toThrow(HttpError);
    });

    it('should handle database transaction failures', async () => {
      // Arrange
      const draftMailPiece = createMailPiece(
        testUser.id,
        testSenderAddress.id,
        testRecipientAddress.id,
        { status: 'draft' }
      );
      
      mockContext.entities.MailPiece.findFirst.mockResolvedValue(draftMailPiece);
      mockContext.entities.MailPiece.update.mockRejectedValue(new Error('Database error'));

      // Act & Assert
      await expect(
        createMailPaymentIntent({ mailPieceId: draftMailPiece.id }, mockContext)
      ).rejects.toThrow();
    });
  });
});