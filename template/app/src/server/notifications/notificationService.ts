/**
 * Notification Service
 * 
 * Centralized service for creating in-app notifications and checking user preferences.
 * Handles both email and in-app notification preferences.
 */

import type { NotificationPreferences, User } from 'wasp/entities';

export interface NotificationData {
  type: string;
  title: string;
  message: string;
  data?: any;
  mailPieceId?: string;
}

export interface TrackingData {
  expectedDeliveryDate?: Date;
  actualDeliveryDate?: Date;
  carrier?: string;
  location?: string;
  daysInTransit?: number;
}

/**
 * Get user notification preferences, creating default preferences if none exist
 */
export async function getUserNotificationPreferences(
  userId: string,
  context: any
): Promise<NotificationPreferences> {
  let preferences = await context.entities.NotificationPreferences.findFirst({
    where: { userId }
  });

  if (!preferences) {
    // Create default preferences for new user
    preferences = await context.entities.NotificationPreferences.create({
      data: {
        userId,
        // All defaults are true as defined in schema
      }
    });
  }

  return preferences;
}

/**
 * Check if a specific notification type should be sent based on user preferences
 */
export async function shouldSendNotification(
  userId: string,
  notificationType: string,
  context: any
): Promise<{ email: boolean; inApp: boolean }> {
  const preferences = await getUserNotificationPreferences(userId, context);

  // Map notification types to preference fields
  const preferenceMap: Record<string, { email: keyof NotificationPreferences; inApp: keyof NotificationPreferences }> = {
    'mail_status_change': { email: 'emailStatusChanges', inApp: 'inAppStatusChanges' },
    'delivery_confirmation': { email: 'emailDeliveries', inApp: 'inAppDeliveries' },
    'delivery_failed': { email: 'emailFailures', inApp: 'inAppFailures' },
    'payment_confirmation': { email: 'emailPayments', inApp: 'inAppPayments' },
    'mail_mailed': { email: 'emailMailed', inApp: 'inAppMailed' },
    'mail_processed_for_delivery': { email: 'emailProcessedForDelivery', inApp: 'inAppProcessedForDelivery' },
    'mail_rerouted': { email: 'emailReRouted', inApp: 'inAppReRouted' },
  };

  const mapping = preferenceMap[notificationType];
  if (!mapping) {
    // Default to true for unknown notification types
    return { email: true, inApp: true };
  }

  return {
    email: preferences.emailEnabled && Boolean(preferences[mapping.email]),
    inApp: preferences.inAppEnabled && Boolean(preferences[mapping.inApp])
  };
}

/**
 * Create an in-app notification record
 */
export async function createInAppNotification(
  userId: string,
  notificationData: NotificationData,
  context: any
): Promise<void> {
  try {
    await context.entities.Notification.create({
      data: {
        userId,
        type: notificationData.type,
        title: notificationData.title,
        message: notificationData.message,
        data: notificationData.data,
        mailPieceId: notificationData.mailPieceId,
      }
    });

    console.log(`✅ In-app notification created for user ${userId}: ${notificationData.type}`);
  } catch (error) {
    console.error('Failed to create in-app notification:', error);
    // Don't throw - notification failures shouldn't break the user flow
  }
}

/**
 * Create notification for mail status change
 */
export async function createMailStatusNotification(
  userId: string,
  mailPieceId: string,
  status: string,
  previousStatus: string,
  trackingData?: TrackingData,
  context?: any
): Promise<void> {
  if (!context) {
    console.error('Context required for creating mail status notification');
    return;
  }

  const notificationType = getNotificationTypeForStatus(status);
  const shouldSend = await shouldSendNotification(userId, notificationType, context);

  if (shouldSend.inApp) {
    const { title, message } = getNotificationContent(status, previousStatus, trackingData);
    
    await createInAppNotification(userId, {
      type: notificationType,
      title,
      message,
      mailPieceId,
      data: {
        status,
        previousStatus,
        trackingData
      }
    }, context);
  }
}

/**
 * Get notification type based on mail status
 */
function getNotificationTypeForStatus(status: string): string {
  switch (status) {
    case 'submitted':
      return 'mail_mailed';
    case 'in_transit':
      return 'mail_status_change';
    case 'in_local_area':
      return 'mail_processed_for_delivery';
    case 'delivered':
      return 'delivery_confirmation';
    case 'failed':
    case 'returned':
      return 'delivery_failed';
    default:
      return 'mail_status_change';
  }
}

/**
 * Generate notification content based on status
 */
function getNotificationContent(
  status: string,
  previousStatus: string,
  trackingData?: TrackingData
): { title: string; message: string } {
  const baseMessages = {
    'submitted': {
      title: '📮 Mail Sent!',
      message: 'Your mail has been sent and is on its way!'
    },
    'in_transit': {
      title: '🚚 Mail In Transit',
      message: 'Your mail is making its way through the postal system.'
    },
    'in_local_area': {
      title: '📍 Almost There!',
      message: trackingData?.expectedDeliveryDate 
        ? `Your mail is at the destination facility and should arrive by ${trackingData.expectedDeliveryDate.toLocaleDateString()}.`
        : 'Your mail is at the destination facility and should arrive soon!'
    },
    'delivered': {
      title: '✅ Delivered!',
      message: 'Your mail has been successfully delivered!'
    },
    'failed': {
      title: '❌ Delivery Failed',
      message: 'There was an issue delivering your mail. We\'ll help you resolve this.'
    },
    'returned': {
      title: '↩️ Returned to Sender',
      message: 'Your mail was returned. Please check the address and try again.'
    }
  };

  return baseMessages[status as keyof typeof baseMessages] || {
    title: '📬 Mail Update',
    message: `Your mail status has changed to: ${status}`
  };
}
