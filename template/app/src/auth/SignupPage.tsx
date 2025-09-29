import React, { useState, useEffect } from 'react';
import { Link as WaspRouterLink, routes } from 'wasp/client/router';
import { signup } from 'wasp/client/auth';
import { getAppSettings, useQuery } from 'wasp/client/operations';
import AuthPageLayout from './AuthPageLayout';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [betaAccessCode, setBetaAccessCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentBetaCode, setCurrentBetaCode] = useState<string>('312');

  // Fetch the current beta access code from the database
  const { data: appSettings } = useQuery(getAppSettings, undefined, {
    onSuccess: (settings: any) => {
      const betaCodeSetting = settings?.find((setting: any) => setting.key === 'beta_access_code');
      if (betaCodeSetting) {
        setCurrentBetaCode(betaCodeSetting.value);
      }
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Validate beta access code on client side
    if (betaAccessCode !== currentBetaCode) {
      setError('Invalid beta access code. Please contact support if you need a beta access code.');
      setIsLoading(false);
      return;
    }

    try {
      await signup({
        email,
        password,
        username: email, // Use email as username
        isAdmin: false, // Will be set by userSignupFields logic
        hasBetaAccess: true, // Will be set by userSignupFields logic
        hasFullAccess: false, // Will be set by userSignupFields logic
      });
      // Redirect will happen automatically after successful signup
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthPageLayout>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="Enter your password"
            className="bg-gray-50 border-gray-200"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="betaAccessCode">Beta Access Code</Label>
          <Input
            id="betaAccessCode"
            type="text"
            value={betaAccessCode}
            onChange={(e) => setBetaAccessCode(e.target.value)}
            required
            placeholder="Enter beta access code"
            className="bg-gray-50 border-gray-200"
          />
          <p className="text-sm text-gray-500">
            Contact support if you don't have a beta access code.
          </p>
        </div>

        {error && (
          <div className="text-sm text-red-600">
            {error}
          </div>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gray-900 hover:bg-gray-800 text-white font-semibold py-3 px-4 rounded-lg"
        >
          {isLoading ? 'Creating account...' : 'Create account'}
        </Button>
      </form>

      <div className="mt-6 text-center">
        <span className='text-sm font-medium text-gray-900'>
          I already have an account (
          <WaspRouterLink to={routes.LoginRoute.to} className='underline'>
            go to login
          </WaspRouterLink>
          ).
        </span>
      </div>
    </AuthPageLayout>
  );
}
