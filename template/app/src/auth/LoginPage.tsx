// ============================================================================
// AUTHENTICATION PAGES
// ============================================================================
// This file contains the login page component for user authentication.
// It uses enhanced custom auth components with password visibility toggle and autocomplete.

import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { EnhancedLoginForm } from './components/EnhancedLoginForm';
import AuthPageLayout from './AuthPageLayout';

import { Alert, AlertDescription } from '../components/ui/alert';

export default function Login() {
  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <EnhancedLoginForm />
        <div className='space-y-4 mt-6'>
          <p className='text-sm font-medium text-card-foreground'>
            Don't have an account yet?{' '}
            <WaspRouterLink to={routes.SignupRoute.to} className='text-primary hover:text-primary/80 underline'>
              go to signup
            </WaspRouterLink>
          </p>
          <p className='text-sm font-medium text-card-foreground'>
            Forgot your password?{' '}
            <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='text-primary hover:text-primary/80 underline'>
              reset it
            </WaspRouterLink>
          </p>
          <Alert className="mt-4">
            <AlertDescription>
              <strong>Can't log in?</strong> If you just signed up, check your email for a verification link.{' '}
              <WaspRouterLink to={routes.EmailVerificationRoute.to} className='text-primary hover:text-primary/80 underline'>
                Go to verification page
              </WaspRouterLink>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AuthPageLayout>
  );
}
