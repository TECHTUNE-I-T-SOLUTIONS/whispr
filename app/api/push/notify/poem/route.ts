import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { title, excerpt, author, url } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    // Send push notification to all subscribers
    const notificationResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/push/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: `New Poem: ${title}`,
        body: excerpt ? `${excerpt.substring(0, 100)}...` : `A new poem by ${author || 'Anonymous'}`,
        url: url || `/poems/${title.toLowerCase().replace(/\s+/g, '-')}`,
  image: '/logotype.png',
        type: 'poem',
        actions: [
          {
            action: 'read',
            title: 'Read Poem',
            icon: '/logotype.png'
          }
        ]
      }),
    });

    if (!notificationResponse.ok) {
      console.error('Failed to send poem notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Poem notification sent'
    });

  } catch (error) {
    console.error('Error sending poem notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
