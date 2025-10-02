import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { SignupForm } from 'wasp/client/auth';
import AuthPageLayout from './AuthPageLayout';

export default function Signup() {
  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Create a new account</h2>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
            <p className="text-sm text-blue-800">
              <strong>After signing up:</strong> You'll receive a verification email. Please check your inbox and click the verification link to activate your account.
            </p>
          </div>
        </div>
        
        <SignupForm />
        
        <div className="text-center">
          <span className='text-sm font-medium text-gray-900'>
            I already have an account (
            <WaspRouterLink to={routes.LoginRoute.to} className='underline'>
              go to login
            </WaspRouterLink>
            ).
          </span>
        </div>
      </div>
    </AuthPageLayout>
  );
}
