import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { title, content, author, url } = await request.json();

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
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
        title: `New Blog: ${title}`,
        body: `By ${author || 'Anonymous'}: ${content.substring(0, 100)}...`,
        url: url || `/blog/${title.toLowerCase().replace(/\s+/g, '-')}`,
  image: '/logotype.png',
        type: 'blog',
        actions: [
          {
            action: 'read',
            title: 'Read Now',
            icon: '/logotype.png'
          }
        ]
      }),
    });

    if (!notificationResponse.ok) {
      console.error('Failed to send blog notification');
    }

    return NextResponse.json({
      success: true,
      message: 'Blog notification sent'
    });

  } catch (error) {
    console.error('Error sending blog notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
