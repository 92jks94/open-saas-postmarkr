// ============================================================================
// UNIVERSAL AUTH ERROR HANDLER COMPONENT
// ============================================================================
// Reusable component for handling authentication errors consistently
// across all auth pages with proper positioning and user guidance

import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { Alert, AlertDescription } from '../../components/ui/alert';
import { Button } from '../../components/ui/button';
import AuthPageLayout from '../AuthPageLayout';

export interface AuthErrorConfig {
  title: string;
  description: string;
  reasons?: string[];
  primaryAction?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    to: typeof routes.LoginRoute.to | typeof routes.LandingPageRoute.to | typeof routes.SignupRoute.to | typeof routes.RequestPasswordResetRoute.to | typeof routes.PasswordResetRoute.to | typeof routes.EmailVerificationRoute.to;
  };
  alertType?: 'error' | 'warning' | 'info';
}

interface AuthErrorHandlerProps {
  config: AuthErrorConfig;
  children?: ReactNode;
}

export function AuthErrorHandler({ config, children }: AuthErrorHandlerProps) {
  const navigate = useNavigate();

  const getAlertStyles = () => {
    switch (config.alertType) {
      case 'error':
        return 'bg-red-50 border-red-200';
      case 'warning':
        return 'bg-yellow-50 border-yellow-200';
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  const getTextStyles = () => {
    switch (config.alertType) {
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
      default:
        return 'text-blue-800';
    }
  };

  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {config.title}
          </h1>
          <p className="text-gray-600 mb-6">
            {config.description}
          </p>
        </div>

        {config.reasons && config.reasons.length > 0 && (
          <Alert className={getAlertStyles()}>
            <AlertDescription>
              <ul className={`text-sm ${getTextStyles()} space-y-2`}>
                {config.reasons.map((reason, index) => (
                  <li key={index}>• {reason}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {config.primaryAction && (
            <Button 
              onClick={config.primaryAction.onClick}
              className="w-full"
            >
              {config.primaryAction.label}
            </Button>
          )}
          
          {config.secondaryAction && (
            <div className="text-center">
              <WaspRouterLink 
                to={config.secondaryAction.to} 
                className='text-sm text-primary hover:text-primary/80 underline'
              >
                {config.secondaryAction.label}
              </WaspRouterLink>
            </div>
          )}
        </div>

        {children}
      </div>
    </AuthPageLayout>
  );
}

// Predefined error configurations for common auth scenarios
export const AuthErrorConfigs = {
  invalidResetToken: (): AuthErrorConfig => ({
    title: 'Invalid Reset Link',
    description: 'The password reset link is missing or invalid. This can happen if:',
    reasons: [
      'The link was copied incorrectly',
      'The link has expired (reset links expire after 24 hours)',
      'The link was already used',
      'Your email client modified the link'
    ],
    primaryAction: {
      label: 'Request New Password Reset',
      onClick: () => window.location.href = '/request-password-reset'
    },
    secondaryAction: {
      label: 'Back to Login',
      to: routes.LoginRoute.to
    },
    alertType: 'warning'
  }),

  invalidVerificationToken: (): AuthErrorConfig => ({
    title: 'Invalid Verification Link',
    description: 'The email verification link is missing or invalid. This can happen if:',
    reasons: [
      'The link was copied incorrectly',
      'The link has expired',
      'The link was already used',
      'Your email client modified the link'
    ],
    primaryAction: {
      label: 'Resend Verification Email',
      onClick: () => window.location.href = '/email-verification'
    },
    secondaryAction: {
      label: 'Back to Login',
      to: routes.LoginRoute.to
    },
    alertType: 'warning'
  }),

  sessionExpired: (): AuthErrorConfig => ({
    title: 'Session Expired',
    description: 'Your session has expired. Please log in again to continue.',
    primaryAction: {
      label: 'Go to Login',
      onClick: () => window.location.href = '/login'
    },
    secondaryAction: {
      label: 'Back to Home',
      to: routes.LandingPageRoute.to
    },
    alertType: 'info'
  })
};
