import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import webpush from 'web-push';

const vapidKeys = {
  subject: process.env.VAPID_SUBJECT,
  publicKey: process.env.VAPID_PUBLIC_KEY,
  privateKey: process.env.VAPID_PRIVATE_KEY,
};

// Configure web-push
if (vapidKeys.subject && vapidKeys.publicKey && vapidKeys.privateKey) {
  webpush.setVapidDetails(
    vapidKeys.subject,
    vapidKeys.publicKey,
    vapidKeys.privateKey
  );
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { title, body, url, image, type, actions, targetUsers } = await request.json();

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

    // If targetUsers is specified, filter by user IDs
    if (targetUsers && targetUsers.length > 0) {
      query = query.in('user_id', targetUsers);
    }

    const { data: subscriptions, error } = await query;

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json(
        { error: 'Failed to fetch subscriptions' },
        { status: 500 }
      );
    }

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
