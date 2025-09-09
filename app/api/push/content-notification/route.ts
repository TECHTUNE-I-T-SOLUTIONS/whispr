import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const { type, contentId, title, excerpt } = await request.json();

    if (!type || !contentId) {
      return NextResponse.json(
        { error: 'Type and contentId are required' },
        { status: 400 }
      );
    }

    let notificationTitle = '';
    let notificationBody = '';
    let url = '';

    // Generate notification content based on type
    switch (type) {
      case 'blog':
        notificationTitle = 'New Blog Post!';
        notificationBody = title || 'Check out our latest blog post';
        url = `/blog/${contentId}`;
        break;
      case 'poem':
        notificationTitle = 'New Poem Published!';
        notificationBody = title || 'A new poem has been published';
        url = `/poems/${contentId}`;
        break;
      case 'spoken-word':
        notificationTitle = 'New Spoken Word!';
        notificationBody = title || 'New spoken word content available';
        url = `/media`;
        break;
      default:
        notificationTitle = 'New Content Available!';
        notificationBody = title || 'Check out our latest content';
        url = '/';
    }

    // Send push notification
    try {
      const pushResponse = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/api/push/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: notificationTitle,
          body: notificationBody,
          url: url,
          type: type,
          image: '/lightlogo.png'
        }),
      });

      if (!pushResponse.ok) {
        console.error('Failed to send push notification:', await pushResponse.text());
      }
    } catch (pushError) {
      console.error('Error sending push notification:', pushError);
      // Don't fail the whole request if push fails
    }

    return NextResponse.json({
      success: true,
      message: 'Content notification sent successfully'
    });

  } catch (error) {
    console.error('Error sending content notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
