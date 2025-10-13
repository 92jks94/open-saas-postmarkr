import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { EnhancedSignupForm } from './components/EnhancedSignupForm';
import AuthPageLayout from './AuthPageLayout';
import { Alert, AlertDescription } from '../components/ui/alert';

export default function Signup() {
  return (
    <AuthPageLayout>
      <div className="space-y-6">
        <Alert className="mt-4">
          <AlertDescription>
            <strong>After signing up:</strong> You'll receive a verification email. Please check your inbox and click the verification link to activate your account.
          </AlertDescription>
        </Alert>
        
        <EnhancedSignupForm />
        
        <div className="text-center">
          <p className='text-sm font-medium text-card-foreground'>
            I already have an account{' '}
            <WaspRouterLink to={routes.LoginRoute.to} className='text-primary hover:text-primary/80 underline'>
              go to login
            </WaspRouterLink>
          </p>
        </div>
      </div>
    </AuthPageLayout>
  );
}
