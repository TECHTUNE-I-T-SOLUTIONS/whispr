import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { title, description, type, url } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const contentType = type === 'audio' ? 'Audio' : 'Video';

    // Send push notification to all subscribers
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `New ${contentType}: ${title}`,
        body: description ? `${description.substring(0, 100)}...` : `New spoken word content available`,
        url: url || `/media`,
        image: '/placeholder-logo.png',
        type: 'spoken-word',
        actions: [
          {
            action: 'listen',
            title: type === 'audio' ? 'Listen Now' : 'Watch Now',
            icon: '/lightlogo.png'
          }
        ]
      }),
    });

    if (!notificationResponse.ok) {
      console.error('Failed to send spoken word notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Spoken word notification sent'
    });

  } catch (error) {
    console.error('Error sending spoken word notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
