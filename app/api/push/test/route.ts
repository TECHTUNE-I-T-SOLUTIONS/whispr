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
    const { title, body, url, type } = await request.json()

    // Get all push subscriptions from database
    const supabase = createSupabaseServer()
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('active', true)

    if (error) {
      console.error('Error fetching subscriptions:', error)
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 })
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ message: 'No active subscriptions found' }, { status: 200 })
    }

    // Send notification to all subscribers
    const notifications = subscriptions.map(async (subscription: any) => {
      try {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth
          }
        }

        const payload = JSON.stringify({
          title: title || 'Whispr',
          body: body || 'New content available!',
          url: url || '/',
          type: type || 'notification',
          timestamp: new Date().toISOString()
        })

        await webpush.sendNotification(pushSubscription, payload)
        console.log('Notification sent successfully to:', subscription.endpoint)
      } catch (error) {
        console.error('Error sending notification:', error)
        // Mark subscription as inactive if it fails
        await supabase
          .from('push_subscriptions')
          .update({ active: false, updated_at: new Date().toISOString() })
          .eq('id', subscription.id)
      }
    })

    await Promise.allSettled(notifications)

    return NextResponse.json({
      message: `Test notification sent to ${subscriptions.length} subscribers`,
      subscriberCount: subscriptions.length
    })

  } catch (error) {
    console.error('Error in test notification:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
