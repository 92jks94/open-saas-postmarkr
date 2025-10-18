/**
 * Background Job Helper Functions
 * 
 * Centralized job scheduling with consistent configuration to eliminate
 * duplication across webhook, payment confirmation, and verification flows.
 */

import { submitPaidMailToLob } from 'wasp/server/jobs';
import { getLobJobConfig } from '../../server/lob/config';
import { createLobLogger } from '../../server/lob/logger';

const logger = createLobLogger('JobHelpers');

/**
 * Job scheduling result
 */
export interface JobScheduleResult {
  success: boolean;
  jobId?: string;
  error?: string;
}

/**
 * Schedule Lob submission job for a paid mail piece
 * 
 * Uses standardized configuration from centralized config.
 * Handles errors gracefully - job failures should not break payment confirmation.
 * 
 * IMPORTANT: Validates mail piece is ready before scheduling to prevent wasted job queue resources.
 * 
 * @param mailPieceId - Mail piece ID to submit to Lob
 * @param context - Wasp context (needed for validation)
 * @param priority - Optional priority (higher number = higher priority)
 * @returns Result indicating success or error
 */
export async function scheduleLobSubmission(
  mailPieceId: string,
  context: any,
  priority?: number
): Promise<JobScheduleResult> {
  try {
    logger.info('Scheduling Lob submission job', { mailPieceId, priority });
    
    // CRITICAL: Validate mail piece is ready before scheduling job
    // This prevents wasting job queue resources on jobs that will fail
    const mailPiece = await context.entities.MailPiece.findFirst({
      where: { id: mailPieceId },
      select: { id: true, userId: true, lobId: true, paymentStatus: true }
    });
    
    if (!mailPiece) {
      logger.warn('Cannot schedule job - mail piece not found', { mailPieceId });
      return { 
        success: false, 
        error: 'Mail piece not found' 
      };
    }
    
    // Check if already submitted to Lob
    if (mailPiece.lobId) {
      logger.info('Mail piece already submitted to Lob, skipping job scheduling', { 
        mailPieceId, 
        lobId: mailPiece.lobId 
      });
      return { 
        success: true  // Not an error - just already done
      };
    }
    
    // Check if payment is confirmed
    if (mailPiece.paymentStatus !== 'paid') {
      logger.warn('Cannot schedule job - payment not confirmed', { 
        mailPieceId, 
        paymentStatus: mailPiece.paymentStatus 
      });
      return { 
        success: false, 
        error: `Payment not confirmed (status: ${mailPiece.paymentStatus})` 
      };
    }
    
    // All validations passed - schedule the job
    const config = getLobJobConfig('submitPaidMail');
    
    // Type guard to ensure we have the correct config type
    if ('retryLimit' in config) {
      // ✅ PHASE 2 #1: Include userId in job args for better debugging
      const job = await submitPaidMailToLob.submit(
        { 
          mailPieceId,
          userId: mailPiece.userId  // Add userId to job context
        },
        {
          retryLimit: config.retryLimit,
          retryDelay: config.retryDelaySeconds,
          retryBackoff: config.retryBackoff,
          priority: priority,
          // expireIn option can be added here if needed:
          // expireIn: `${config.expireInHours} hours`,
          
          // ✅ FIX #1: Singleton job to prevent duplicate submissions
          // This ensures only one submission job exists per mail piece at a time
          singletonKey: `submit-mail-${mailPieceId}`,
          singletonMinutes: 60, // Keep singleton lock for 1 hour
        }
      );
      
      logger.info('Lob submission job scheduled successfully', {
        mailPieceId,
        userId: mailPiece.userId,  // Include userId in log
        // jobId: job?.id, // Uncomment if job object has ID
        config: {
          retryLimit: config.retryLimit,
          retryDelay: config.retryDelaySeconds,
          singleton: true, // Mark that deduplication is enabled
        },
      });
      
      return {
        success: true,
        // jobId: job?.id, // Uncomment if job object has ID
      };
    } else {
      throw new Error('Invalid job configuration for submitPaidMail');
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.nonCriticalError('Failed to schedule Lob submission job', error, {
      mailPieceId,
    });
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Schedule Lob submission with automatic retry if scheduling fails
 * 
 * This is useful for critical paths where we want to ensure the job gets scheduled
 * even if there's a temporary issue with the job queue.
 * 
 * @param mailPieceId - Mail piece ID to submit to Lob
 * @param context - Wasp context (needed for validation)
 * @param maxScheduleAttempts - Max attempts to schedule the job (default: 3)
 * @returns Result indicating success or error
 */
export async function scheduleLobSubmissionWithRetry(
  mailPieceId: string,
  context: any,
  maxScheduleAttempts: number = 3
): Promise<JobScheduleResult> {
  let lastError: string | undefined;
  
  for (let attempt = 1; attempt <= maxScheduleAttempts; attempt++) {
    const result = await scheduleLobSubmission(mailPieceId, context);
    
    if (result.success) {
      if (attempt > 1) {
        logger.info('Job scheduling succeeded on retry', {
          mailPieceId,
          attempt,
        });
      }
      return result;
    }
    
    lastError = result.error;
    
    if (attempt < maxScheduleAttempts) {
      const delayMs = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
      logger.warn('Job scheduling failed, retrying', {
        mailPieceId,
        attempt,
        maxAttempts: maxScheduleAttempts,
        delayMs,
        error: result.error,
      });
      
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  logger.error('Job scheduling failed after all attempts', {
    mailPieceId,
    attempts: maxScheduleAttempts,
    lastError,
  });
  
  return {
    success: false,
    error: lastError || 'Job scheduling failed after all attempts',
  };
}

/**
 * Check if a mail piece already has a pending Lob submission job
 * 
 * This can be used to prevent duplicate job scheduling.
 * Note: This requires access to PgBoss job queue which may not be directly accessible.
 * For now, this is a placeholder for future implementation.
 * 
 * @param mailPieceId - Mail piece ID to check
 * @returns True if job exists, false otherwise
 */
export async function hasPendingLobSubmissionJob(
  mailPieceId: string
): Promise<boolean> {
  // TODO: Implement job queue check if PgBoss API is accessible
  // This would query the PgBoss job queue to see if a job exists
  // For now, return false (assume no duplicate)
  return false;
}

/**
 * Cancel pending Lob submission job for a mail piece
 * 
 * This can be used if payment is refunded or mail piece is cancelled.
 * Note: This requires access to PgBoss job queue which may not be directly accessible.
 * For now, this is a placeholder for future implementation.
 * 
 * @param mailPieceId - Mail piece ID
 * @returns Result indicating success or error
 */
export async function cancelLobSubmissionJob(
  mailPieceId: string
): Promise<JobScheduleResult> {
  logger.info('Attempting to cancel Lob submission job', { mailPieceId });
  
  // TODO: Implement job cancellation if PgBoss API is accessible
  // This would query and cancel the job from PgBoss queue
  
  logger.warn('Job cancellation not yet implemented', { mailPieceId });
  
  return {
    success: false,
    error: 'Job cancellation not implemented',
  };
}

