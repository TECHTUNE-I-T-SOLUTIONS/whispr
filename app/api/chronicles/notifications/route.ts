import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

/**
 * GET /api/chronicles/notifications
 * Fetch creator notifications from chronicles_notifications table
 * Supports both web (cookie) and mobile (Bearer token) authentication
 */
export async function GET(req: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      supabase = await createSupabaseServerClient();
    }

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const filter = searchParams.get('filter') || 'all';

    // Build query
    let query = supabase
      .from('chronicles_notifications')
      .select(`
        id,
        notification_type,
        title,
        message,
        creator_id,
        related_post_id,
        related_creator_id,
        read,
        read_at,
        data,
        created_at,
        post:related_post_id(id, title, status, created_at),
        related_creator:related_creator_id(id, pen_name, profile_image_url)
      `)
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    // Apply filter
    if (filter === 'unread') {
      query = query.eq('read', false);
    }

    const { data: notifications, error: notifError, count } = await query.range(
      offset,
      offset + limit - 1
    );

    if (notifError) {
      console.error('[NOTIFICATIONS] Error fetching notifications:', notifError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('chronicles_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('read', false);

    return NextResponse.json({
      success: true,
      notifications: notifications || [],
      unread_count: unreadCount || 0,
      total: count || 0,
    });
  } catch (e) {
    console.error('[NOTIFICATIONS] GET error:', e);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/chronicles/notifications
 * Mark notifications as read
 * Body: { notification_id } or { all: true }
 */
export async function PUT(req: NextRequest) {
  try {
    let supabase;

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      supabase = await createSupabaseServerClient();
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { notification_id, all } = await req.json();

    if (all === true) {
      // Mark all as read
      const { error } = await supabase
        .from('chronicles_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('creator_id', creator.id)
        .eq('read', false);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications marked as read',
      });
    } else if (notification_id) {
      // Mark specific notification as read
      const { data, error } = await supabase
        .from('chronicles_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .eq('id', notification_id)
        .eq('creator_id', creator.id)
        .select()
        .single();

      if (error) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        notification: data,
      });
    } else {
      return NextResponse.json(
        { error: 'Missing notification_id or all parameter' },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('[NOTIFICATIONS] PUT error:', e);
    return NextResponse.json(
      { error: 'Failed to update notifications' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/chronicles/notifications
 * Delete specific notification
 * Body: { notification_id } or { all: true }
 */
export async function DELETE(req: NextRequest) {
  try {
    let supabase;

    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          },
        }
      );
    } else {
      supabase = await createSupabaseServerClient();
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    const { notification_id, all } = await req.json();

    if (all === true) {
      // Delete all notifications
      const { error } = await supabase
        .from('chronicles_notifications')
        .delete()
        .eq('creator_id', creator.id);

      if (error) {
        return NextResponse.json(
          { error: 'Failed to delete notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All notifications deleted',
      });
    } else if (notification_id) {
      // Delete specific notification
      const { error } = await supabase
        .from('chronicles_notifications')
        .delete()
        .eq('id', notification_id)
        .eq('creator_id', creator.id);

      if (error) {
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'Notification deleted',
      });
    } else {
      return NextResponse.json(
        { error: 'Missing notification_id or all parameter' },
        { status: 400 }
      );
    }
  } catch (e) {
    console.error('[NOTIFICATIONS] DELETE error:', e);
    return NextResponse.json(
      { error: 'Failed to delete notifications' },
      { status: 500 }
    );
  }
}
