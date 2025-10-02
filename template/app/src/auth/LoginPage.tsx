// ============================================================================
// AUTHENTICATION PAGES
// ============================================================================
// This file contains the login page component for user authentication.
// It uses Wasp's built-in auth components and provides navigation to other auth flows.

import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { LoginForm } from 'wasp/client/auth';
import AuthPageLayout from './AuthPageLayout';

export default function Login() {
  return (
    <AuthPageLayout>
      <LoginForm />
      <br />
      <span className='text-sm font-medium text-gray-900 dark:text-gray-900'>
        Don't have an account yet?{' '}
        <WaspRouterLink to={routes.SignupRoute.to} className='underline'>
          go to signup
        </WaspRouterLink>
        .
      </span>
      <br />
      <span className='text-sm font-medium text-gray-900'>
        Forgot your password?{' '}
        <WaspRouterLink to={routes.RequestPasswordResetRoute.to} className='underline'>
          reset it
        </WaspRouterLink>
        .
      </span>
      <br />
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
        <p className="text-sm text-yellow-800">
          <strong>Can't log in?</strong> If you just signed up, check your email for a verification link. 
          <WaspRouterLink to={routes.EmailVerificationRoute.to} className='underline ml-1'>
            Go to verification page
          </WaspRouterLink>
        </p>
      </div>
    </AuthPageLayout>
  );
}
