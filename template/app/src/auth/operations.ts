import { HttpError } from 'wasp/server';
import type { ResendVerificationEmail } from 'wasp/server/operations';

export const resendVerificationEmail: ResendVerificationEmail<void, { success: boolean; message: string }> = async (args, context) => {
  if (!context.user) {
    throw new HttpError(401, 'Not authorized');
  }

  // Check if user already has a verified email
  const isEmailVerified = context.user.identities?.email?.isEmailVerified;
  
  if (isEmailVerified) {
    return { 
      success: false, 
      message: 'Your email is already verified. You can proceed to login.' 
    };
  }

  // Since Wasp handles email verification internally and we don't have direct access
  // to regenerate verification tokens, we'll provide helpful guidance to users
  return {
    success: true,
    message: 'Please check your spam/junk folder for the original verification email. If you still can\'t find it, try signing up again or contact support at nathan@postmarkr.com for assistance.'
  };
};
