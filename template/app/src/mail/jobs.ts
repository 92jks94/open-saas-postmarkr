import { HttpError } from 'wasp/server';
import { submitMailPieceToLob } from './operations';
import { createLobLogger } from '../server/lob/logger';

const logger = createLobLogger('SubmitPaidMailJob');

/**
 * Job arguments interface
 */
interface SubmitPaidMailJobArgs {
  mailPieceId: string;
  userId: string;  // ✅ PHASE 2 #1: Add userId for debugging and logging
}

/**
 * Background job to submit paid mail pieces to Lob
 * This is triggered after successful payment confirmation
 * PgBoss handles retries automatically if submission fails
 */
export async function submitPaidMailToLob(
  data: any,
  context: any
) {
  // Parse the job data to get the expected arguments
  const args = data as SubmitPaidMailJobArgs;
  const { mailPieceId, userId } = args;
  
  // ✅ PHASE 2 #4: Validate job arguments at entry point (defense-in-depth)
  if (!mailPieceId) {
    logger.error('Job validation failed: mailPieceId is required', { args });
    throw new HttpError(400, 'mailPieceId is required for job execution');
  }
  
  if (!userId) {
    logger.warn('Job started without userId - will retrieve from mail piece', { mailPieceId });
  }
  
  try {
    logger.info('Job started: Submitting paid mail piece to Lob', { 
      mailPieceId,
      userId,
      timestamp: new Date().toISOString()
    });
    
    const result = await submitMailPieceToLob({ mailPieceId }, context);
    
    if (result.success) {
      logger.operationSuccess('submitMailPieceToLob', undefined, {
        mailPieceId,
        userId,
        lobId: result.lobId,
      });
    } else {
      logger.error('Job failed: Lob submission unsuccessful', {
        mailPieceId,
        userId,
        result,
      });
      throw new Error('Lob submission failed');
    }
    
    return result;
  } catch (error) {
    logger.operationFailure('submitMailPieceToLob', error, {
      mailPieceId,
      userId,
      jobArgs: args,
    });
    
    // Re-throw so PgBoss can retry the job
    throw error;
  }
}

