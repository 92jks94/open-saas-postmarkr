// ============================================================================
// NOTIFICATION TYPES
// ============================================================================
// Type definitions for the notification system
// Following the pattern of src/mail/types.ts

import type { Notification, NotificationPreferences, MailPiece } from 'wasp/entities';

// Notification types
export type NotificationType = 
  | 'mail_status_change'
  | 'delivery_confirmation'
  | 'delivery_failure'
  | 'payment_confirmation'
  | 'payment_failed'
  | 'mail_created'
  | 'mail_updated';

// Notification with relations
export interface NotificationWithRelations extends Notification {
  mailPiece?: MailPiece | null;
  [key: string]: any; // SuperJSON compatibility
}

// Notification preferences with all fields
export interface NotificationPreferencesData {
  emailEnabled: boolean;
  emailStatusChanges: boolean;
  emailDeliveries: boolean;
  emailFailures: boolean;
  emailPayments: boolean;
  inAppEnabled: boolean;
  inAppStatusChanges: boolean;
  inAppDeliveries: boolean;
  inAppFailures: boolean;
  inAppPayments: boolean;
}

// Notification creation data
export interface CreateNotificationData {
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  mailPieceId?: string;
  [key: string]: any; // SuperJSON compatibility
}

// Notification update data
export interface UpdateNotificationData {
  readAt?: Date;
}

// Notification preferences update data
export interface UpdateNotificationPreferencesData {
  emailEnabled?: boolean;
  emailStatusChanges?: boolean;
  emailDeliveries?: boolean;
  emailFailures?: boolean;
  emailPayments?: boolean;
  inAppEnabled?: boolean;
  inAppStatusChanges?: boolean;
  inAppDeliveries?: boolean;
  inAppFailures?: boolean;
  inAppPayments?: boolean;
  [key: string]: any; // SuperJSON compatibility
}

// Notification query filters
export interface NotificationFilters {
  type?: NotificationType;
  read?: boolean;
  limit?: number;
  offset?: number;
  [key: string]: any; // SuperJSON compatibility
}

// Notification stats
export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
  emailProcessed: number;
  emailFailed: number;
  emailPending: number;
  [key: string]: any; // SuperJSON compatibility
}

// Email notification template data
export interface EmailNotificationData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

// Notification center state
export interface NotificationCenterState {
  notifications: NotificationWithRelations[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}
