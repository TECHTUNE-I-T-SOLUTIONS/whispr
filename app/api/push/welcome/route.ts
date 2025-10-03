import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint, admin } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Build payload for regular or admin welcome
    const payload = admin
      ? {
          title: 'Admin notifications enabled',
          body: `You're subscribed to admin alerts: message notifications, moderation events, and other admin updates.`,
          url: '/admin/messages',
          type: 'admin_welcome',
          image: '/logotype.png',
          endpoint,
          actions: [
            { action: 'open', title: 'Open messages', icon: '/logotype.png' },
            { action: 'settings', title: 'Notification settings' }
          ]
        }
      : {
          title: 'A soft hello from Whispr',
          body: `You have joined the hush — gentle ripples of poems, posts, and spoken words will find you.`,
          url: '/',
          type: 'welcome',
          image: '/logotype.png',
          endpoint,
          actions: [
            { action: 'explore', title: 'Explore', icon: '/logotype.png' },
            { action: 'dismiss', title: 'Got it!' }
          ]
        };

    // Forward to /api/push/send which will target the specific endpoint when endpoint is provided
    const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!pushResponse.ok) {
      console.error('Failed to send welcome notification:', await pushResponse.text());
      return NextResponse.json(
        { error: 'Failed to send welcome notification' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Welcome notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending welcome notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
