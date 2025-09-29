import React, { useState } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { VerifyEmailForm } from 'wasp/client/auth';
import { resendVerificationEmail } from 'wasp/client/operations';
import AuthPageLayout from '../AuthPageLayout';
import { Button } from '../../components/ui/button';

export default function EmailVerificationPage() {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const result = await resendVerificationEmail();
      if (result?.success) {
        setResendMessage(result.message || 'Please check your spam folder or contact support for assistance.');
      } else {
        setResendMessage(result?.message || 'Please contact support directly at nathan@postmarkr.com for assistance.');
      }
    } catch (error: any) {
      console.error('Resend verification email error:', error);
      setResendMessage(error.message || 'Please contact support directly at nathan@postmarkr.com for assistance.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Check Your Email
          </h1>
          <p className="text-gray-600">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
          </p>
        </div>
        
        <VerifyEmailForm />
        
        <div className="text-center space-y-4">
          <div className="space-y-2">
            <p className="text-sm text-gray-500">
              Didn't receive the email? Check your spam folder or try resending.
            </p>
            <Button
              onClick={handleResendEmail}
              disabled={isResending}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg"
            >
{isResending ? 'Getting Help...' : 'Need Help?'}
            </Button>
            {resendMessage && (
              <p className={`text-sm ${
                resendMessage.includes('check your spam') || resendMessage.includes('try signing up again') 
                  ? 'text-blue-600' 
                  : resendMessage.includes('already verified') 
                    ? 'text-green-600' 
                    : 'text-red-600'
              }`}>
                {resendMessage}
              </p>
            )}
          </div>
          
          <span className='text-sm font-medium text-gray-900'>
            Already verified? <WaspRouterLink to={routes.LoginRoute.to} className='underline'>Go to login</WaspRouterLink>
          </span>
        </div>
      </div>
    </AuthPageLayout>
  );
}
