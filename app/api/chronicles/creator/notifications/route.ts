import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator to check if exists
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Get unread notifications count
    const { count: unreadCount, error: countError } = await supabase
      .from('chronicles_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('read', false);

    if (countError) {
      console.error('Error fetching unread count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get recent notifications (last 10)
    const { data: notifications, error: notificationsError } = await supabase
      .from('chronicles_notifications')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (notificationsError) {
      console.error('Error fetching notifications:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      unreadCount: unreadCount || 0,
      notifications: notifications || [],
      totalCount: unreadCount || 0,
    });
  } catch (error) {
    console.error('Notifications endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notifications as read
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { notificationIds } = await request.json();

    if (!notificationIds || !Array.isArray(notificationIds)) {
      return NextResponse.json(
        { error: 'Invalid request' },
        { status: 400 }
      );
    }

    // Update notifications to read
    const { error: updateError } = await supabase
      .from('chronicles_notifications')
      .update({ read: true, read_at: new Date().toISOString() })
      .in('id', notificationIds);

    if (updateError) {
      console.error('Error updating notifications:', updateError);
      return NextResponse.json(
        { error: 'Failed to update notifications' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
