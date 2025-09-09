import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { endpoint } = await request.json();

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Send welcome notification to specific user
    const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: 'Welcome to Whispr! 🎉',
        body: 'Thanks for subscribing! You\'ll now receive notifications about new content, poems, and updates.',
        url: '/',
        type: 'welcome',
        image: '/lightlogo.png',
        targetUsers: [], // Empty array means send to all, but we'll filter by endpoint
        actions: [
          {
            action: 'explore',
            title: 'Explore',
            icon: '/lightlogo.png'
          },
          {
            action: 'dismiss',
            title: 'Got it!'
          }
        ]
      }),
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
