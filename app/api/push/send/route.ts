import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import webpush from 'web-push';

// Prefer realtime VAPID keys when present, fall back to legacy envs
// Use main VAPID keys (legacy) to match how subscriptions are created
const vapidSubject = process.env.VAPID_SUBJECT || process.env.NEXT_PUBLIC_VAPID_REALTIME_SUBJECT || process.env.NEXT_PUBLIC_VAPID_REALTIME_SUBJECT;
const vapidPublic = process.env.VAPID_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PUBLIC_KEY || process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const vapidPrivate = process.env.VAPID_PRIVATE_KEY || process.env.NEXT_PUBLIC_VAPID_REALTIME_PRIVATE_KEY;

// Configure web-push if keys are available
try {
  if (vapidSubject && vapidPublic && vapidPrivate) {
    webpush.setVapidDetails(vapidSubject, vapidPublic, vapidPrivate);
  } else {
    console.warn('VAPID keys not fully configured for push/send; notifications may fail to send');
  }
} catch (e) {
  console.error('Failed to set VAPID details for web-push', e);
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
  // Parse body once (avoid calling request.json() multiple times)
  const payload = await request.json();
  const { title, body, url, image, type, actions, targetUsers, endpoint } = payload || {};

  if (!title || !body) {
      return NextResponse.json(
        { error: 'Title and body are required' },
        { status: 400 }
      );
    }

    // Get active subscriptions
    let query = supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true);

    // If targetUsers is specified, include those user IDs (may include admins)
    if (targetUsers && targetUsers.length > 0) {
      // Only select subscriptions that are linked to a user_id and match the requested user IDs
  query = supabase
  .from('push_subscriptions')
  .select('*')
  .eq('is_active', true)
  .in('user_id', targetUsers)
  .not('user_id', 'is', null)
  // exclude placeholder/anonymous user ids (all-zero UUID)
  .neq('user_id', '00000000-0000-0000-0000-000000000000');
    }

  // If a specific endpoint is provided (welcome flow), target that endpoint directly
  const targetEndpoint = endpoint || null;

    let subscriptionsRes;
    if (targetEndpoint) {
      subscriptionsRes = await supabase.from('push_subscriptions').select('*').eq('endpoint', targetEndpoint).eq('is_active', true);
    } else {
      subscriptionsRes = await query;
    }

    const { data: subscriptions, error } = subscriptionsRes;

  if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

  console.info(`push/send: targeting ${subscriptions.length} subscriptions`);

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active subscriptions found',
        sent: 0
      });
    }

    // Send push notifications
    const notificationPayload = {
      title,
      body,
      url: url || '/',
  image: image || '/logotype.png',
      type: type || 'general',
      actions: actions || [
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
            JSON.stringify(notificationPayload)
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

    return NextResponse.json({
      success: true,
      message: `Push notifications sent: ${successful} successful, ${failed} failed`,
      sent: successful,
      failed,
      total: subscriptions.length
    });

  } catch (error) {
    console.error('Error sending push notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
