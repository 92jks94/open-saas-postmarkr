// ============================================================================
// ENHANCED SIGNUP FORM COMPONENT
// ============================================================================
// Custom signup form with password visibility toggle and autocomplete attributes
// This wraps Wasp's auth functionality with improved UX features

import { useState } from 'react';
import { signup } from 'wasp/client/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export function EnhancedSignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // The userSignupFields will populate username, isAdmin, hasFullAccess server-side
      await signup({ 
        email, 
        password,
        username: email, // Will be overridden by userSignupFields
        isAdmin: false, // Will be overridden by userSignupFields
        hasFullAccess: false // Will be overridden by userSignupFields
      });
      // After successful signup, Wasp will redirect to email verification page
      // Note: The page will redirect, so no need to set loading to false
    } catch (err: any) {
      console.error('Signup error:', err);
      // Better error messages
      if (err.message?.includes('already exists') || err.message?.includes('duplicate')) {
        setError('An account with this email already exists. Please log in instead.');
      } else if (err.message?.includes('password')) {
        setError('Password must be at least 8 characters long.');
      } else {
        setError(err.message || 'Unable to create account. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-card-foreground">Create a new account</h2>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
              minLength={8}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          <p className="text-xs text-muted-foreground">
            Must be at least 8 characters long
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Creating account...' : 'Sign up'}
        </Button>
      </form>
    </div>
  );
}

