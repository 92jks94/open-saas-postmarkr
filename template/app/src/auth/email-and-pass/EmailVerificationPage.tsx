import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { VerifyEmailForm } from 'wasp/client/auth';
import { resendVerificationEmail, sendWelcomeEmailAction } from 'wasp/client/operations';
import { useAuth } from 'wasp/client/auth';
import AuthPageLayout from '../AuthPageLayout';
import { Button } from '../../components/ui/button';
import { Alert, AlertDescription } from '../../components/ui/alert';

const REDIRECT_DELAY_MS = 3000;

export default function EmailVerificationPage() {
  const navigate = useNavigate();
  const { data: user } = useAuth();
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [verificationSuccess, setVerificationSuccess] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_MS / 1000);
  const [welcomeEmailSent, setWelcomeEmailSent] = useState(false);

  // Check if user just became authenticated (indicating successful verification)
  useEffect(() => {
    if (user && !verificationSuccess) {
      setVerificationSuccess(true);
      
      // Send welcome email after successful verification
      if (!welcomeEmailSent) {
        sendWelcomeEmailAction()
          .then(() => {
            console.log('Welcome email sent successfully');
            setWelcomeEmailSent(true);
          })
          .catch((error) => {
            console.error('Failed to send welcome email:', error);
            // Don't block user flow if welcome email fails
          });
      }
    }
  }, [user, verificationSuccess, welcomeEmailSent]);

  // Handle countdown and redirect after successful verification
  useEffect(() => {
    if (!verificationSuccess) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const redirectTimer = setTimeout(() => {
      navigate('/login');
    }, REDIRECT_DELAY_MS);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(redirectTimer);
    };
  }, [verificationSuccess, navigate]);

  const handleResendEmail = async () => {
    setIsResending(true);
    setResendMessage(null);
    
    try {
      const result = await resendVerificationEmail();
      setResendMessage(result?.message || 'Please check your spam folder or contact support for assistance.');
    } catch (error: any) {
      console.error('Resend verification email error:', error);
      setResendMessage('Please contact support directly at nathan@postmarkr.com for assistance.');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {verificationSuccess ? 'Email Verified!' : 'Check Your Email'}
          </h1>
          
          {verificationSuccess ? (
            <Alert className="bg-green-50 border-green-200">
              <AlertDescription className="text-center">
                <p className="text-green-800 font-semibold mb-2">
                  ✅ Your email has been verified successfully!
                </p>
                <p className="text-green-700">
                  Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
                </p>
              </AlertDescription>
            </Alert>
          ) : (
            <>
              <p className="text-gray-600 mb-4">
                We've sent a verification link to your email address. Please check your inbox and click the link to verify your account.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-blue-800">
                  <strong>Next steps:</strong> Look for an email from Postmarkr, click the verification link, then you can log in and start sending mail.
                </p>
              </div>
            </>
          )}
        </div>
        
        {!verificationSuccess && <VerifyEmailForm />}
        
        <div className="text-center space-y-4">
          {!verificationSuccess && (
            <div className="space-y-2">
              <p className="text-sm text-gray-500">
                Didn't receive the email? Check your spam folder or try resending.
              </p>
              <Button
                onClick={handleResendEmail}
                disabled={isResending}
                className="bg-yellow-400 hover:bg-yellow-500 text-black font-semibold px-6 py-2 rounded-lg"
              >
                {isResending ? 'Sending...' : 'Resend Verification Email'}
              </Button>
              {resendMessage && (
                <p className="text-sm text-blue-600">{resendMessage}</p>
              )}
            </div>
          )}
          
          <span className='text-sm font-medium text-gray-900'>
            {verificationSuccess ? 'Or ' : 'Already verified? '}
            <WaspRouterLink to={routes.LoginRoute.to} className='underline'>
              Go to login now
            </WaspRouterLink>
          </span>
        </div>
      </div>
    </AuthPageLayout>
  );
}
