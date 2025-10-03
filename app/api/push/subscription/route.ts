import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAdminFromRequest } from '@/lib/auth-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { subscription, userAgent } = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Get real IP address from request headers
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const clientIp = request.headers.get('x-client-ip');
    const cfConnectingIp = request.headers.get('cf-connecting-ip');

    // Use the first available IP address
    const ipAddress = forwardedFor?.split(',')[0]?.trim() ||
                     realIp ||
                     clientIp ||
                     cfConnectingIp ||
                     '127.0.0.1';

    // Get browser info from user agent
    const browserInfo = parseUserAgent(userAgent);

  // Try to identify admin user from request (admin subscriptions should be linked)
  const session = await getAdminFromRequest(request)
  const userId = session?.admin?.id || generateUserIdFromIp(ipAddress);

    // Check if subscription already exists
    const { data: existingSubscription } = await supabase
      .from('push_subscriptions')
      .select('id')
      .eq('endpoint', subscription.endpoint)
      .single();

    if (existingSubscription) {
      // Update existing subscription
      const { error } = await supabase
        .from('push_subscriptions')
        .update({
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_agent: userAgent,
          ip_address: ipAddress,
          browser_info: browserInfo,
          user_id: userId,
          last_active_at: new Date().toISOString(),
          is_active: true
        })
        .eq('id', existingSubscription.id);

      if (error) {
        console.error('Error updating subscription:', error);
        return NextResponse.json(
          { error: 'Failed to update subscription' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription updated successfully'
      });
    } else {
      // Create new subscription
        const payload = {
          endpoint: subscription.endpoint,
          p256dh: subscription.keys?.p256dh,
          auth: subscription.keys?.auth,
          user_agent: userAgent,
          ip_address: ipAddress,
          browser_info: browserInfo,
          user_id: userId,
          is_active: true,
        } as any;

        // Try simple insert first. If a race causes a duplicate key error, fall back to update by endpoint.
        try {
          const { data: inserted, error: insertError } = await supabase
            .from('push_subscriptions')
            .insert(payload)
            .select()
            .maybeSingle();

          if (insertError) {
            // handle duplicate key (unique violation) by updating existing row
            const msg = String(insertError.message || '')
            if (insertError.code === '23505' || msg.includes('duplicate') || msg.includes('unique')) {
              const { error: updateErr } = await supabase
                .from('push_subscriptions')
                .update(payload)
                .eq('endpoint', payload.endpoint);
              if (updateErr) {
                console.error('Error creating subscription (update fallback failed):', updateErr);
                return NextResponse.json({ error: 'Failed to create subscription', details: updateErr }, { status: 500 });
              }
            } else {
              console.error('Error creating subscription:', insertError);
              return NextResponse.json({ error: 'Failed to create subscription', details: insertError }, { status: 500 });
            }
          }
        } catch (e: any) {
          console.error('Unexpected error creating subscription:', e);
          return NextResponse.json({ error: 'Failed to create subscription', details: String(e?.message || e) }, { status: 500 });
        }

      // Send a welcome notification. Use a special admin welcome if this subscription belongs to an admin.
      try {
        const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
        if (session?.admin?.id) {
          // Admin-specific welcome: explain they'll receive message/unread/admin alerts
          await fetch(`${siteUrl}/api/push/send`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: 'Admin notifications enabled',
              body: `You're subscribed to admin alerts: message notifications, moderation events, and other admin updates.`,
              url: '/admin/messages',
              type: 'admin_welcome',
              image: '/logotype.png',
              endpoint: subscription.endpoint,
              actions: [
                { action: 'open', title: 'Open messages', icon: '/logotype.png' },
                { action: 'settings', title: 'Notification settings' }
              ]
            })
          })
        } else {
          // Regular welcome
          await fetch(`${siteUrl}/api/push/welcome`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ endpoint: subscription.endpoint }),
          });
        }
      } catch (welcomeError) {
        console.error('Error sending welcome notification:', welcomeError);
        // Don't fail the subscription if welcome notification fails
      }

      return NextResponse.json({
        success: true,
        message: 'Subscription created successfully'
      });
    }
  } catch (error) {
    console.error('Error in push subscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    const { error } = await supabase
      .from('push_subscriptions')
      .update({ is_active: false })
      .eq('endpoint', endpoint);

    if (error) {
      console.error('Error unsubscribing:', error);
      return NextResponse.json(
        { error: 'Failed to unsubscribe' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Unsubscribed successfully'
    });
  } catch (error) {
    console.error('Error in push unsubscription:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseUserAgent(userAgent: string) {
  if (!userAgent) return {};

  const browserInfo: any = {};

  // Detect browser
  if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    browserInfo.browser = 'Chrome';
  } else if (userAgent.includes('Firefox')) {
    browserInfo.browser = 'Firefox';
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    browserInfo.browser = 'Safari';
  } else if (userAgent.includes('Edg')) {
    browserInfo.browser = 'Edge';
  } else {
    browserInfo.browser = 'Unknown';
  }

  // Detect OS
  if (userAgent.includes('Windows')) {
    browserInfo.os = 'Windows';
  } else if (userAgent.includes('Mac')) {
    browserInfo.os = 'macOS';
  } else if (userAgent.includes('Linux')) {
    browserInfo.os = 'Linux';
  } else if (userAgent.includes('Android')) {
    browserInfo.os = 'Android';
  } else if (userAgent.includes('iOS')) {
    browserInfo.os = 'iOS';
  } else {
    browserInfo.os = 'Unknown';
  }

  // Detect device type
  if (userAgent.includes('Mobile')) {
    browserInfo.device = 'Mobile';
  } else if (userAgent.includes('Tablet')) {
    browserInfo.device = 'Tablet';
  } else {
    browserInfo.device = 'Desktop';
  }

  return browserInfo;
}

// Generate a consistent UUID from IP address
function generateUserIdFromIp(ipAddress: string): string {
  // Create a simple hash from the IP address
  let hash = 0;
  for (let i = 0; i < ipAddress.length; i++) {
    const char = ipAddress.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Convert hash to hex and ensure it's 32 characters for UUID
  const hashHex = Math.abs(hash).toString(16).padStart(32, '0');

  // Create a proper UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
  return `${hashHex.substring(0, 8)}-${hashHex.substring(8, 12)}-${hashHex.substring(12, 16)}-${hashHex.substring(16, 20)}-${hashHex.substring(20, 32)}`;
}
