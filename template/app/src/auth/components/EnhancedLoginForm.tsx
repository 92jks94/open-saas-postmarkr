// ============================================================================
// ENHANCED LOGIN FORM COMPONENT
// ============================================================================
// Custom login form with password visibility toggle and autocomplete attributes
// This wraps Wasp's auth functionality with improved UX features

import { useState } from 'react';
import { login } from 'wasp/client/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Eye, EyeOff } from 'lucide-react';

export function EnhancedLoginForm() {
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
      await login({ email, password });
      // Wasp handles redirect automatically based on onAuthSucceededRedirectTo
      // If we reach here, login was successful
      // Note: The page will redirect, so no need to set loading to false
    } catch (err: any) {
      console.error('Login error:', err);
      // Better error messages
      if (err.message?.includes('verification')) {
        setError('Please verify your email before logging in. Check your inbox for the verification link.');
      } else if (err.message?.includes('invalid') || err.message?.includes('credentials')) {
        setError('Invalid email or password. Please try again.');
      } else {
        setError(err.message || 'Unable to log in. Please try again.');
      }
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-card-foreground">Log in to your account</h2>
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
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pr-10"
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
        </div>

        <Button 
          type="submit" 
          className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-semibold"
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Log in'}
        </Button>
      </form>
    </div>
  );
}

