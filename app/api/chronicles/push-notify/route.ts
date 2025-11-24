import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

interface PushNotificationPayload {
  creatorId: string;
  type: 'engagement' | 'follower' | 'admin_alert';
  title: string;
  body: string;
  data?: Record<string, string>;
}

export async function POST(request: Request) {
  try {
    const payload: PushNotificationPayload = await request.json();

    // Verify request is from server
    const authHeader = request.headers.get('authorization');
    if (!authHeader || authHeader !== `Bearer ${process.env.INTERNAL_API_KEY}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const serviceRoleClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get creator's push subscriptions
    if (payload.type !== 'admin_alert') {
      const { data: subscriptions } = await serviceRoleClient
        .from('chronicles_push_subscriptions')
        .select('subscription')
        .eq('user_id', payload.creatorId);

      if (subscriptions && subscriptions.length > 0) {
        for (const sub of subscriptions) {
          try {
            await sendWebPushNotification(sub.subscription, {
              title: payload.title,
              body: payload.body,
              icon: '/icon-192x192.png',
              data: payload.data || {},
            });
          } catch (pushError) {
            console.error('Error sending push notification:', pushError);
          }
        }
      }
    }

    // Send to admins if it's an admin alert
    if (payload.type === 'admin_alert') {
      const { data: adminSubs } = await serviceRoleClient
        .from('admin_push_subscriptions')
        .select('subscription');

      if (adminSubs && adminSubs.length > 0) {
        for (const sub of adminSubs) {
          try {
            await sendWebPushNotification(sub.subscription, {
              title: `[ADMIN] ${payload.title}`,
              body: payload.body,
              icon: '/icon-192x192.png',
              data: { ...payload.data, type: 'admin' },
            });
          } catch (pushError) {
            console.error('Error sending admin push notification:', pushError);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Send notification error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}

async function sendWebPushNotification(
  subscription: PushSubscription,
  notification: {
    title: string;
    body: string;
    icon: string;
    data: Record<string, string>;
  }
) {
  const payload = JSON.stringify({
    notification: {
      title: notification.title,
      body: notification.body,
      icon: notification.icon,
    },
    data: notification.data,
  });

  // Here you would integrate with a web push service like web-push npm package
  // For now, this is a placeholder that would require the web-push library:
  // const webpush = require('web-push');
  // await webpush.sendNotification(subscription, payload);

  console.log('Push notification payload:', payload);
}
