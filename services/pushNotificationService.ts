import { supabase } from './supabaseClient';

// =============================================
// CONSTANTS
// =============================================

// VAPID public key - this should match the one in your Supabase Edge Functions
// Generate a new key pair using: npx web-push generate-vapid-keys
const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || '';

// Edge function URLs (constructed from Supabase URL)
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SCHEDULE_NOTIFICATION_URL = `${SUPABASE_URL}/functions/v1/schedule-notification`;
const CANCEL_NOTIFICATIONS_URL = `${SUPABASE_URL}/functions/v1/cancel-notifications`;

// =============================================
// TYPES
// =============================================

export type NotificationType = 'work_complete' | 'break_complete' | 'cycle_complete' | 'timer_reminder';

export interface ScheduledNotification {
  type: NotificationType;
  title: string;
  body: string;
  scheduledFor: number; // Unix timestamp in milliseconds
}

export interface PushSubscriptionRecord {
  endpoint: string;
  p256dh_key: string;
  auth_key: string;
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

/**
 * Convert a base64 string to Uint8Array for applicationServerKey
 */
function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray.buffer as ArrayBuffer;
}

/**
 * Get the current Supabase auth token
 */
async function getAuthToken(): Promise<string | null> {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
}

// =============================================
// PUSH SUBSCRIPTION MANAGEMENT
// =============================================

/**
 * Check if push notifications are supported
 */
export function isPushSupported(): boolean {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Get current push permission status
 */
export function getPushPermission(): NotificationPermission {
  if (!('Notification' in window)) return 'denied';
  return Notification.permission;
}

/**
 * Request push notification permission
 */
export async function requestPushPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return 'denied';
  }

  const permission = await Notification.requestPermission();
  console.log('📬 Push permission:', permission);
  return permission;
}

/**
 * Get existing push subscription
 */
export async function getExistingSubscription(): Promise<PushSubscription | null> {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription;
  } catch (error) {
    console.error('Error getting existing subscription:', error);
    return null;
  }
}

/**
 * Subscribe to push notifications
 */
export async function subscribeToPush(userId: string): Promise<PushSubscription | null> {
  if (!isPushSupported()) {
    console.warn('Push notifications not supported');
    return null;
  }

  if (!VAPID_PUBLIC_KEY) {
    console.warn('VAPID_PUBLIC_KEY not configured');
    return null;
  }

  try {
    // Request permission first
    const permission = await requestPushPermission();
    if (permission !== 'granted') {
      console.log('Push permission denied');
      return null;
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      // Create new subscription
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      console.log('📬 New push subscription created');
    } else {
      console.log('📬 Using existing push subscription');
    }

    // Save subscription to Supabase
    await saveSubscriptionToServer(userId, subscription);

    return subscription;
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return null;
  }
}

/**
 * Unsubscribe from push notifications
 */
export async function unsubscribeFromPush(userId: string): Promise<boolean> {
  try {
    const subscription = await getExistingSubscription();
    if (!subscription) return true;

    // Remove from server first
    await removeSubscriptionFromServer(userId, subscription.endpoint);

    // Then unsubscribe locally
    const success = await subscription.unsubscribe();
    console.log('📬 Push unsubscription:', success);
    return success;
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    return false;
  }
}

/**
 * Save push subscription to Supabase
 */
async function saveSubscriptionToServer(
  userId: string,
  subscription: PushSubscription
): Promise<boolean> {
  try {
    const key = subscription.getKey('p256dh');
    const auth = subscription.getKey('auth');

    if (!key || !auth) {
      console.error('Missing subscription keys');
      return false;
    }

    const p256dhKey = btoa(String.fromCharCode(...new Uint8Array(key)));
    const authKey = btoa(String.fromCharCode(...new Uint8Array(auth)));

    const { error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: userId,
        endpoint: subscription.endpoint,
        p256dh_key: p256dhKey,
        auth_key: authKey,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id,endpoint',
      });

    if (error) {
      console.error('Error saving subscription:', error);
      return false;
    }

    console.log('📬 Subscription saved to server');
    return true;
  } catch (error) {
    console.error('Error saving subscription:', error);
    return false;
  }
}

/**
 * Remove push subscription from Supabase
 */
async function removeSubscriptionFromServer(
  userId: string,
  endpoint: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('user_id', userId)
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error removing subscription:', error);
      return false;
    }

    console.log('📬 Subscription removed from server');
    return true;
  } catch (error) {
    console.error('Error removing subscription:', error);
    return false;
  }
}

// =============================================
// NOTIFICATION SCHEDULING
// =============================================

/**
 * Schedule a push notification via Edge Function
 */
export async function scheduleNotification(
  notification: ScheduledNotification
): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    const response = await fetch(SCHEDULE_NOTIFICATION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(notification),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error scheduling notification:', error);
      return false;
    }

    const result = await response.json();
    console.log('📬 Notification scheduled:', result);
    return true;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return false;
  }
}

/**
 * Cancel all pending notifications via Edge Function
 */
export async function cancelPendingNotifications(): Promise<boolean> {
  try {
    const token = await getAuthToken();
    if (!token) {
      console.error('No auth token available');
      return false;
    }

    const response = await fetch(CANCEL_NOTIFICATIONS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Error cancelling notifications:', error);
      return false;
    }

    console.log('📬 Pending notifications cancelled');
    return true;
  } catch (error) {
    console.error('Error cancelling notifications:', error);
    return false;
  }
}

// =============================================
// NOTIFICATION HELPERS FOR TIMER
// =============================================

/**
 * Schedule notification for when work period ends
 */
export async function scheduleWorkCompleteNotification(
  endTime: number,
  subject: string
): Promise<boolean> {
  return scheduleNotification({
    type: 'work_complete',
    title: '¡Tiempo de descanso!',
    body: `Has completado tu sesión de ${subject}. ¡Tómate un descanso!`,
    scheduledFor: endTime,
  });
}

/**
 * Schedule notification for when break period ends
 */
export async function scheduleBreakCompleteNotification(
  endTime: number
): Promise<boolean> {
  return scheduleNotification({
    type: 'break_complete',
    title: '¡Hora de volver al trabajo!',
    body: 'Tu descanso ha terminado. ¡Es momento de enfocarte de nuevo!',
    scheduledFor: endTime,
  });
}

/**
 * Schedule notification for cycle completion
 */
export async function scheduleCycleCompleteNotification(
  endTime: number,
  cycleNumber: number
): Promise<boolean> {
  return scheduleNotification({
    type: 'cycle_complete',
    title: `¡Ciclo ${cycleNumber} completado!`,
    body: '¡Excelente trabajo! Has completado un ciclo completo.',
    scheduledFor: endTime,
  });
}

// =============================================
// PUSH SERVICE SINGLETON
// =============================================

class PushNotificationService {
  private isInitialized = false;
  private userId: string | null = null;

  /**
   * Initialize the push notification service
   */
  async initialize(userId: string): Promise<boolean> {
    if (!isPushSupported()) {
      console.log('📬 Push notifications not supported');
      return false;
    }

    this.userId = userId;

    // Check if already subscribed
    const existingSub = await getExistingSubscription();
    if (existingSub) {
      // Update subscription on server (in case it changed)
      await saveSubscriptionToServer(userId, existingSub);
      this.isInitialized = true;
      return true;
    }

    // Don't auto-subscribe, let user opt-in
    this.isInitialized = true;
    return true;
  }

  /**
   * Subscribe to push notifications (user opt-in)
   */
  async subscribe(): Promise<boolean> {
    if (!this.userId) {
      console.error('Push service not initialized');
      return false;
    }

    const subscription = await subscribeToPush(this.userId);
    return subscription !== null;
  }

  /**
   * Unsubscribe from push notifications
   */
  async unsubscribe(): Promise<boolean> {
    if (!this.userId) return true;
    return unsubscribeFromPush(this.userId);
  }

  /**
   * Check if currently subscribed
   */
  async isSubscribed(): Promise<boolean> {
    const subscription = await getExistingSubscription();
    return subscription !== null;
  }

  /**
   * Schedule timer completion notification
   */
  async scheduleTimerNotification(
    type: 'work' | 'break',
    endTime: number,
    subject?: string
  ): Promise<boolean> {
    if (type === 'work' && subject) {
      return scheduleWorkCompleteNotification(endTime, subject);
    } else if (type === 'break') {
      return scheduleBreakCompleteNotification(endTime);
    }
    return false;
  }

  /**
   * Cancel all scheduled notifications
   */
  async cancelScheduled(): Promise<boolean> {
    return cancelPendingNotifications();
  }

  /**
   * Clean up service
   */
  destroy(): void {
    this.isInitialized = false;
    this.userId = null;
  }
}

// Export singleton instance
export const pushNotificationService = new PushNotificationService();
