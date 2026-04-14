import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  try {
    let supabase;
    let authUser: any = null;

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
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
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error('[NOTIFICATIONS] Bearer token auth error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    } else {
      // Fallback to cookie-based auth for web
      supabase = await createSupabaseServerClient();
      const { data, error } = await supabase.auth.getUser();
      if (error || !data.user) {
        console.error('[NOTIFICATIONS] Cookie auth error:', error);
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    }

    console.log('[NOTIFICATIONS] Authenticated user:', authUser.id);

    // Create service role client for better access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        },
      }
    );

    // Get creator to check if exists
    const { data: creator, error: creatorError } = await serviceSupabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    if (creatorError || !creator) {
      console.error('[NOTIFICATIONS] Creator lookup error - user.id:', authUser.id, 'creatorError:', creatorError);
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    console.log(`[NOTIFICATIONS] User ${authUser.id} has creator_id ${creator.id}`);

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')
    const type = searchParams.get('type') || 'all'

    // Get unread notifications count using service role
    const { count: unreadCount, error: countError } = await serviceSupabase
      .from('chronicles_notifications')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creator.id)
      .eq('read', false);

    if (countError) {
      console.error('[NOTIFICATIONS] Error fetching unread count:', countError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    console.log(`[NOTIFICATIONS] Unread count for creator ${creator.id}: ${unreadCount}`);

    // Build query for notifications using service role
    let query = serviceSupabase
      .from('chronicles_notifications')
      .select('*', { count: 'exact' })
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false })

    // Filter by type if specified
    if (type !== 'all') {
      query = query.eq('type', type)
    }

    // Get paginated notifications
    const { data: notifications, error: notificationsError, count: totalCount } = await query
      .range(offset, offset + limit - 1)

    if (notificationsError) {
      console.error('[NOTIFICATIONS] Query error:', notificationsError);
      return NextResponse.json(
        { error: 'Failed to fetch notifications' },
        { status: 500 }
      );
    }

    console.log(`[NOTIFICATIONS] Creator ${creator.id}: Found ${notifications?.length || 0} notifications, Total: ${totalCount}, limit=${limit}, offset=${offset}`);

    return NextResponse.json({
      success: true,
      unread_count: unreadCount || 0,
      notifications: notifications || [],
      total: totalCount || 0,
    });
  } catch (error) {
    console.error('Notifications endpoint error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Mark notifications as read or update
export async function POST(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('[NOTIFICATIONS] POST Auth error:', authError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Create service role client for updates
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const serviceSupabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: {
          headers: {
            Authorization: `Bearer ${serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!}`,
          },
        },
      }
    );

    const body = await request.json();
    const { notificationIds, notificationId, all, read } = body;

    // Get creator
    const { data: creator, error: creatorError } = await serviceSupabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.error('[NOTIFICATIONS] POST Creator lookup error:', creatorError);
      return NextResponse.json(
        { error: 'Creator not found' },
        { status: 404 }
      );
    }

    // Mark all as read
    if (all === true && read === true) {
      const { error: updateError } = await serviceSupabase
        .from('chronicles_notifications')
        .update({
          read: true,
          read_at: new Date().toISOString(),
        })
        .eq('creator_id', creator.id)
        .eq('read', false);

      if (updateError) {
        console.error('Error marking all as read:', updateError);
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'All notifications marked as read' });
    }

    // Mark multiple as read (legacy support)
    if (notificationIds && Array.isArray(notificationIds)) {
      const { error: updateError } = await serviceSupabase
        .from('chronicles_notifications')
        .update({ read: true, read_at: new Date().toISOString() })
        .in('id', notificationIds)
        .eq('creator_id', creator.id);

      if (updateError) {
        console.error('Error updating notifications:', updateError);
        return NextResponse.json(
          { error: 'Failed to update notifications' },
          { status: 500 }
        );
      }

      return NextResponse.json({ success: true, message: 'Notifications marked as read' });
    }

    // Mark single as read
    if (notificationId) {
      const unreadIds = read === false
        ? { read: false }
        : { read: true, read_at: new Date().toISOString() };

      const { data: notification, error: updateError } = await serviceSupabase
        .from('chronicles_notifications')
        .update(unreadIds)
        .eq('id', notificationId)
        .eq('creator_id', creator.id)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating notification:', updateError);
        return NextResponse.json(
          { error: 'Notification not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ success: true, notification });
    }

    return NextResponse.json(
      { error: 'Missing notificationIds, notificationId, or all parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Notifications update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
