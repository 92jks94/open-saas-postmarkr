import { HttpError } from 'wasp/server';
import type { User } from 'wasp/entities';
import * as z from 'zod';
import { ensureArgsSchemaOrThrowHttpError } from '../server/validation';

// Schema for granting beta access (admin only)
const grantBetaAccessSchema = z.object({
  userId: z.string().min(1),
});

// Schema for granting full access (admin only)
const grantFullAccessSchema = z.object({
  userId: z.string().min(1),
});

type GrantBetaAccessInput = z.infer<typeof grantBetaAccessSchema>;
type GrantFullAccessInput = z.infer<typeof grantFullAccessSchema>;

// Grant beta access to a user (admin only)
export const grantBetaAccess = async (rawArgs: GrantBetaAccessInput, context: any) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins can grant beta access');
  }

  const { userId } = ensureArgsSchemaOrThrowHttpError(grantBetaAccessSchema, rawArgs);

  // Check if user exists
  const user = await context.entities.User.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Update user to have beta access
  return context.entities.User.update({
    where: { id: userId },
    data: { hasBetaAccess: true }
  });
};

// Grant full access to a user (admin only)
export const grantFullAccess = async (rawArgs: GrantFullAccessInput, context: any) => {
  if (!context.user?.isAdmin) {
    throw new HttpError(403, 'Only admins can grant full access');
  }

  const { userId } = ensureArgsSchemaOrThrowHttpError(grantFullAccessSchema, rawArgs);

  // Check if user exists
  const user = await context.entities.User.findUnique({
    where: { id: userId }
  });

  if (!user) {
    throw new HttpError(404, 'User not found');
  }

  // Update user to have full access
  return context.entities.User.update({
    where: { id: userId },
    data: { hasFullAccess: true }
  });
};

// Check user's current access level
export const checkUserAccess = async (rawArgs: {}, context: any) => {
  if (!context.user) {
    throw new HttpError(401, 'Must be logged in');
  }

  return {
    hasBetaAccess: context.user.hasBetaAccess,
    hasFullAccess: context.user.hasFullAccess,
    isAdmin: context.user.isAdmin,
  };
};