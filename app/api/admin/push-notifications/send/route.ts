import { NextRequest, NextResponse } from 'next/server'
import webpush from 'web-push'
import { createSupabaseServer } from '@/lib/supabase-server'

// Configure VAPID keys
webpush.setVapidDetails(
  'mailto:admin@whispr.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json()
    const supabase = createSupabaseServer()

    // Get all active push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('is_active', true)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        message: 'No active subscriptions found',
        sentCount: 0
      }, { status: 200 })
    }

    // Save notification to history
    const { error: historyError } = await supabase
      .from('push_notifications')
      .insert({
        title: notificationData.title,
        body: notificationData.body,
        url: notificationData.url,
        type: notificationData.type,
        icon: notificationData.icon,
        image: notificationData.image,
        actions: notificationData.actions,
        sent_count: subscriptions.length,
        sent_by: 'admin' // You might want to get the actual admin user ID
      })

    if (historyError) {
      console.error('Error saving notification history:', historyError)
      // Don't fail the request if history save fails
    }

    // Send notification to all subscribers
    const notifications = subscriptions.map(async (subscription) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        const payload = JSON.stringify({
          title: notificationData.title,
          body: notificationData.body,
          url: notificationData.url,
          type: notificationData.type,
          icon: notificationData.icon,
          image: notificationData.image,
          actions: notificationData.actions,
          timestamp: new Date().toISOString()
        })

        await webpush.sendNotification(pushSubscription, payload)
        console.log('Notification sent successfully to:', subscription.endpoint)

        // Update last_active_at for this subscriber
        await supabase
          .from('push_subscriptions')
          .update({ last_active_at: new Date().toISOString() })
          .eq('id', subscription.id)

      } catch (error) {
        console.error('Error sending notification:', error)
        // Mark subscription as inactive if it fails
        await supabase
          .from('push_subscriptions')
          .update({
            is_active: false,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)
      }
    })

    await Promise.allSettled(notifications)

    return NextResponse.json({
      message: `Notification sent to ${subscriptions.length} subscribers`,
      sentCount: subscriptions.length
    })

  } catch (error) {
    console.error('Error in send notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
