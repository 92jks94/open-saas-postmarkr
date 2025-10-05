import type { AuthUser } from 'wasp/auth';

/**
 * Check if user has full access to all features
 */
export function hasFullAccess(user: AuthUser | null): boolean {
  if (!user) return false;
  
  // For now, all authenticated users have full access
  // This can be modified to check specific user properties or subscription status
  return true;
}
