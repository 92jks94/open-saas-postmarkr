import { HttpError } from 'wasp/server';
import { submitMailPieceToLob } from './operations';

/**
 * Background job to submit paid mail pieces to Lob
 * This is triggered after successful payment confirmation
 * PgBoss handles retries automatically if submission fails
 */
export async function submitPaidMailToLob(
  args: { mailPieceId: string },
  context: any
) {
  try {
    console.log(`🚀 Job: Submitting paid mail piece ${args.mailPieceId} to Lob...`);
    
    const result = await submitMailPieceToLob({ mailPieceId: args.mailPieceId }, context);
    
    if (result.success) {
      console.log(`✅ Job: Successfully submitted mail piece ${args.mailPieceId} to Lob with ID: ${result.lobId}`);
    } else {
      console.error(`❌ Job: Failed to submit mail piece ${args.mailPieceId} to Lob`);
      throw new Error('Lob submission failed');
    }
    
    return result;
  } catch (error) {
    console.error(`❌ Job: Error submitting mail piece ${args.mailPieceId} to Lob:`, error);
    // Re-throw so PgBoss can retry the job
    throw error;
  }
}

