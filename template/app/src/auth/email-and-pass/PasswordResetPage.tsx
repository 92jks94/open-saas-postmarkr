import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { ResetPasswordForm } from 'wasp/client/auth';
import AuthPageLayout from '../AuthPageLayout';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { AuthErrorHandler, AuthErrorConfigs } from '../components/AuthErrorHandler';

const REDIRECT_DELAY_MS = 3000;

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [resetSuccess, setResetSuccess] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_MS / 1000);
  
  const token = searchParams.get('token');
  const hasValidToken = Boolean(token);

  // Monitor for successful password reset
  // This is a workaround since Wasp's ResetPasswordForm doesn't provide success callback
  useEffect(() => {
    if (!hasValidToken || resetSuccess) return;

    // Check for success message in DOM after a brief delay
    const checkTimer = setTimeout(() => {
      const alerts = document.querySelectorAll('[role="alert"]');
      const hasSuccessMessage = Array.from(alerts).some(
        el => el.textContent?.toLowerCase().includes('success') || 
              el.textContent?.toLowerCase().includes('password has been reset')
      );
      
      if (hasSuccessMessage) {
        setResetSuccess(true);
      }
    }, 1000);

    return () => clearTimeout(checkTimer);
  }, [hasValidToken, resetSuccess]);

  // Handle countdown and redirect after successful reset
  useEffect(() => {
    if (!resetSuccess) return;

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
  }, [resetSuccess, navigate]);

  // Handle missing or invalid token
  if (!hasValidToken) {
    return <AuthErrorHandler config={AuthErrorConfigs.invalidResetToken()} />;
  }

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {resetSuccess ? 'Password Reset!' : 'Reset Your Password'}
          </h1>
        </div>

        {resetSuccess ? (
          <Alert className="bg-green-50 border-green-200">
            <AlertDescription className="text-center">
              <p className="text-green-800 font-semibold mb-2">
                ✅ Your password has been reset successfully!
              </p>
              <p className="text-green-700">
                Redirecting to login in {countdown} second{countdown !== 1 ? 's' : ''}...
              </p>
            </AlertDescription>
          </Alert>
        ) : (
          <ResetPasswordForm />
        )}

        <div className="text-center">
          <span className='text-sm font-medium text-gray-900'>
            {resetSuccess ? 'Or ' : 'If everything is okay, '}
            <WaspRouterLink to={routes.LoginRoute.to} className='underline'>
              go to login now
            </WaspRouterLink>
          </span>
        </div>
      </div>
    </AuthPageLayout>
  );
}
