import type { User } from 'wasp/entities';

export type AccessLevel = 'none' | 'beta' | 'full' | 'admin';

/**
 * Determines the access level of a user
 */
export function getUserAccessLevel(user: User | null): AccessLevel {
  if (!user) return 'none';
  if (user.isAdmin) return 'admin';
  if (user.hasFullAccess) return 'full';
  if (user.hasBetaAccess) return 'beta';
  return 'none';
}

/**
 * Checks if a user has at least beta access
 */
export function hasBetaAccess(user: User | null): boolean {
  return getUserAccessLevel(user) !== 'none';
}

/**
 * Checks if a user has full access (not just beta)
 */
export function hasFullAccess(user: User | null): boolean {
  const level = getUserAccessLevel(user);
  return level === 'full' || level === 'admin';
}

/**
 * Checks if a user is an admin
 */
export function isAdmin(user: User | null): boolean {
  return getUserAccessLevel(user) === 'admin';
}

/**
 * Gets a human-readable description of the user's access level
 */
export function getAccessDescription(user: User | null): string {
  const level = getUserAccessLevel(user);
  
  switch (level) {
    case 'admin':
      return 'Administrator';
    case 'full':
      return 'Full Access';
    case 'beta':
      return 'Beta Access';
    case 'none':
      return 'No Access';
    default:
      return 'Unknown';
  }
}

/**
 * Checks if a user can perform a specific action based on access level
 */
export function canPerformAction(
  user: User | null, 
  requiredLevel: AccessLevel
): boolean {
  const userLevel = getUserAccessLevel(user);
  
  const levelHierarchy: Record<AccessLevel, number> = {
    'none': 0,
    'beta': 1,
    'full': 2,
    'admin': 3,
  };
  
  return levelHierarchy[userLevel] >= levelHierarchy[requiredLevel];
}
