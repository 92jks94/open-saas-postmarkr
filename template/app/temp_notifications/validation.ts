// ============================================================================
// NOTIFICATION VALIDATION
// ============================================================================
// Validation schemas for notification operations
// Following the pattern of src/mail/validation.ts

import { z } from 'zod';
import { HttpError } from 'wasp/server';

// Notification type enum
export const NotificationTypeEnum = z.enum([
  'mail_status_change',
  'delivery_confirmation',
  'delivery_failure',
  'payment_confirmation',
  'payment_failed',
  'mail_created',
  'mail_updated'
]);

// Create notification schema
export const createNotificationSchema = z.object({
  type: NotificationTypeEnum,
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  message: z.string().min(1, 'Message is required').max(1000, 'Message too long'),
  data: z.record(z.any()).optional(),
  mailPieceId: z.string().uuid().optional(),
});

// Update notification schema
export const updateNotificationSchema = z.object({
  readAt: z.date().optional(),
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailEnabled: z.boolean().default(true),
  emailStatusChanges: z.boolean().default(true),
  emailDeliveries: z.boolean().default(true),
  emailFailures: z.boolean().default(true),
  emailPayments: z.boolean().default(true),
  inAppEnabled: z.boolean().default(true),
  inAppStatusChanges: z.boolean().default(true),
  inAppDeliveries: z.boolean().default(true),
  inAppFailures: z.boolean().default(true),
  inAppPayments: z.boolean().default(true),
});

// Notification filters schema
export const notificationFiltersSchema = z.object({
  type: NotificationTypeEnum.optional(),
  read: z.boolean().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

// Validation error messages
export const validationErrors = {
  INVALID_NOTIFICATION_TYPE: 'Invalid notification type',
  INVALID_MAIL_PIECE_ID: 'Invalid mail piece ID',
  NOTIFICATION_NOT_FOUND: 'Notification not found',
  PREFERENCES_NOT_FOUND: 'Notification preferences not found',
  INVALID_PREFERENCES: 'Invalid notification preferences',
  UNAUTHORIZED_ACCESS: 'Unauthorized access to notification',
  INVALID_FILTERS: 'Invalid notification filters',
} as const;

// Validation helper functions
export function validateNotificationOwnership(
  notification: any,
  userId: string
): void {
  if (!notification) {
    throw new HttpError(404, validationErrors.NOTIFICATION_NOT_FOUND);
  }
  
  if (notification.userId !== userId) {
    throw new HttpError(403, validationErrors.UNAUTHORIZED_ACCESS);
  }
}

export function validateNotificationPreferencesOwnership(
  preferences: any,
  userId: string
): void {
  if (!preferences) {
    throw new HttpError(404, validationErrors.PREFERENCES_NOT_FOUND);
  }
  
  if (preferences.userId !== userId) {
    throw new HttpError(403, validationErrors.UNAUTHORIZED_ACCESS);
  }
}

export function validateMailPieceOwnership(
  mailPiece: any,
  userId: string
): void {
  if (!mailPiece) {
    throw new HttpError(404, 'Mail piece not found');
  }
  
  if (mailPiece.userId !== userId) {
    throw new HttpError(403, 'Unauthorized access to mail piece');
  }
}

// Schema validation helpers
export function validateCreateNotification(data: unknown) {
  try {
    return createNotificationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateUpdateNotification(data: unknown) {
  try {
    return updateNotificationSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateNotificationPreferences(data: unknown) {
  try {
    return notificationPreferencesSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}

export function validateNotificationFilters(data: unknown) {
  try {
    return notificationFiltersSchema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new HttpError(400, `Validation error: ${error.errors.map(e => e.message).join(', ')}`);
    }
    throw error;
  }
}
