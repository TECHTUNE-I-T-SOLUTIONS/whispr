import { createSupabaseServer } from '@/lib/supabase-server';

export interface PushNotificationData {
  title: string;
  body: string;
  url: string;
  image?: string;
  type: 'blog' | 'poem' | 'spoken_word' | 'general';
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

export async function sendPushNotificationToSubscribers(notificationData: PushNotificationData) {
  try {
    const supabase = createSupabaseServer();

    // Get all active non-admin subscriptions (regular users)
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true)
      .or('is_admin.is.null,is_admin.eq.false')

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return { success: false, error: 'Failed to fetch subscriptions' };
    }

    if (!subscriptions || subscriptions.length === 0) {
      return { success: true, message: 'No active subscriptions found', sent: 0 };
    }

  // Send push notifications using web-push
    const webpush = (await import('web-push')).default;

    // Configure VAPID keys
    // Support multiple env naming conventions. Ensure server uses the same
    // public key the client uses (NEXT_PUBLIC_VAPID_PUBLIC_KEY).
    const vapidSubject = process.env.VAPID_SUBJECT || `mailto:admin@${process.env.VITE_APP_DOMAIN || 'whispr.com'}`;
    const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    const vapidPrivate = process.env.VAPID_PRIVATE_KEY || process.env.VAPID_PRIVATE_KEY;

    if (!vapidPublic || !vapidPrivate) {
      console.error('VAPID keys missing. Ensure VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY or NEXT_PUBLIC_VAPID_PUBLIC_KEY are set.')
      return { success: false, error: 'VAPID keys not configured' };
    }

  webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);

    const payload = {
      title: notificationData.title,
      body: notificationData.body,
      url: notificationData.url,
  image: notificationData.image || '/logotype.png',
      type: notificationData.type,
      actions: notificationData.actions || [
        {
          action: 'view',
          title: 'View',
          icon: '/logotype.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    const results = await Promise.allSettled(
      subscriptions.map(async (subscription) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: subscription.endpoint,
              keys: {
                p256dh: subscription.p256dh,
                auth: subscription.auth,
              },
            },
            JSON.stringify(payload)
          );

          // Update last active timestamp
          await supabase
            .from('push_subscriptions')
            .update({ last_active_at: new Date().toISOString() })
            .eq('id', subscription.id);

          return { success: true, endpoint: subscription.endpoint };
        } catch (error: any) {
          console.error('Error sending push notification:', error);

          // If subscription is invalid, mark as inactive
          if (error.statusCode === 410 || error.statusCode === 400) {
            await supabase
              .from('push_subscriptions')
              .update({ is_active: false })
              .eq('id', subscription.id);
          }

          return { success: false, endpoint: subscription.endpoint, error: error.message };
        }
      })
    );

    const successful = results.filter(result => result.status === 'fulfilled' && result.value.success).length;
    const failed = results.length - successful;

    return {
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      sent: successful,
      failed,
      total: subscriptions.length
    };

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return { success: false, error: 'Internal server error' };
  }
}

export async function sendWelcomeNotification(endpoint: string, keys: { p256dh: string; auth: string }) {
  try {
    const webpush = (await import('web-push')).default;

    const vapidKeys = {
      subject: process.env.VAPID_SUBJECT,
      publicKey: process.env.VAPID_PUBLIC_KEY,
      privateKey: process.env.VAPID_PRIVATE_KEY,
    };

    if (!vapidKeys.subject || !vapidKeys.publicKey || !vapidKeys.privateKey) {
      throw new Error('VAPID keys not configured');
    }

    webpush.setVapidDetails(
      vapidKeys.subject,
      vapidKeys.publicKey,
      vapidKeys.privateKey
    );

    const payload = {
      title: 'A soft hello from Whispr',
      body: `You have joined the hush — gentle ripples of poems, posts, and spoken words will find you.`,
      url: '/',
      image: '/logotype.png',
      type: 'welcome',
      actions: [
        {
          action: 'explore',
          title: 'Explore',
          icon: '/logotype.png'
        }
      ]
    };

    await webpush.sendNotification(
      {
        endpoint,
        keys: {
          p256dh: keys.p256dh,
          auth: keys.auth,
        },
      },
      JSON.stringify(payload)
    );

    return { success: true };
  } catch (error) {
    console.error('Error sending welcome notification:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
