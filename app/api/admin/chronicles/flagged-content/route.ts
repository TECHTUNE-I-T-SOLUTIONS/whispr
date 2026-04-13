import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAdminFromRequest } from '@/lib/auth-server';

/**
 * GET /api/admin/chronicles/flagged-content
 * Fetch all flagged content (posts, chains, entries)
 * Query params: type (posts|chains|entries|all), status (pending|under_review|resolved|dismissed|all)
 */
export async function GET(req: NextRequest) {
  try {
    const adminData = await getAdminFromRequest(req);
    if (!adminData?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = adminData.admin;

    const supabase = await createSupabaseServer();
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';

    let flaggedPosts: any[] = [];
    let flaggedChains: any[] = [];
    let flaggedChainEntries: any[] = [];
    let stats = {
      total_flagged: 0,
      pending: 0,
      under_review: 0,
      resolved: 0,
      dismissed: 0,
    };

    // Get flagged posts
    if (type === 'posts' || type === 'all') {
      let query = supabase
        .from('chronicles_flagged_reviews')
        .select(`
          id,
          post_id,
          chain_entry_post_id,
          reason,
          description,
          status,
          created_at,
          flagged_by,
          resolved_by,
          resolved_at,
          admin:flagged_by(username),
          post:post_id(id, title, creator_id, status, created_at, creator:creator_id(id, pen_name, profile_image_url))
        `)
        .not('post_id', 'is', null); // filter posts only

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: postsData, error: postsError } = await query;

      if (!postsError && postsData) {
        flaggedPosts = postsData.filter((f: any) => f.post_id !== null);
      }
    }

    // Get flagged chains (chains that have flagged entries)
    if (type === 'chains' || type === 'all') {
      let query = supabase
        .from('chronicles_flagged_reviews')
        .select(`
          id,
          chain_entry_post_id,
          reason,
          description,
          status,
          created_at,
          flagged_by,
          resolved_by,
          resolved_at,
          chain_entry:chain_entry_post_id(
            id,
            chain_id,
            title,
            status,
            created_at,
            added_by,
            creator:added_by(id, pen_name, profile_image_url),
            chain:chain_id(id, title, created_at)
          )
        `)
        .not('chain_entry_post_id', 'is', null);

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: entriesData, error: entriesError } = await query;

      if (!entriesError && entriesData) {
        // Group by chain and get unique chains with flagged entries
        const chainMap = new Map<string, any>();
        entriesData.forEach((item: any) => {
          if (item.chain_entry?.chain) {
            const chainId = item.chain_entry.chain.id;
            if (!chainMap.has(chainId)) {
              chainMap.set(chainId, {
                id: item.id,
                chain_id: chainId,
                reason: item.reason,
                description: item.description,
                status: item.status,
                created_at: item.created_at,
                flagged_by: item.flagged_by,
                resolved_by: item.resolved_by,
                resolved_at: item.resolved_at,
                chain: {
                  id: item.chain_entry.chain.id,
                  title: item.chain_entry.chain.title,
                  created_at: item.chain_entry.chain.created_at,
                },
              });
            }
          }
        });
        flaggedChains = Array.from(chainMap.values());
      }
    }

    // Get flagged chain entries
    if (type === 'entries' || type === 'all') {
      let query = supabase
        .from('chronicles_flagged_reviews')
        .select(`
          id,
          post_id,
          chain_entry_post_id,
          reason,
          description,
          status,
          created_at,
          flagged_by,
          resolved_by,
          resolved_at,
          admin:flagged_by(username),
          chain_entry:chain_entry_post_id(id, title, added_by, status, created_at, chain_id, creator:added_by(id, pen_name, profile_image_url))
        `)
        .not('chain_entry_post_id', 'is', null); // filter chain entries only

      if (status !== 'all') {
        query = query.eq('status', status);
      }

      const { data: entriesData, error: entriesError } = await query;

      if (!entriesError && entriesData) {
        flaggedChainEntries = entriesData.filter((f: any) => f.chain_entry_post_id !== null);
      }
    }

    // Calculate stats
    const allFlagged = [...flaggedPosts, ...flaggedChains, ...flaggedChainEntries];
    stats.total_flagged = allFlagged.length;
    stats.pending = allFlagged.filter((f) => f.status === 'pending').length;
    stats.under_review = allFlagged.filter((f) => f.status === 'under_review').length;
    stats.resolved = allFlagged.filter((f) => f.status === 'resolved').length;
    stats.dismissed = allFlagged.filter((f) => f.status === 'dismissed').length;

    return NextResponse.json({
      success: true,
      flagged_posts: flaggedPosts,
      flagged_chains: flaggedChains,
      flagged_entries: flaggedChainEntries,
      stats,
    });
  } catch (e) {
    console.error('[FLAGGED-CONTENT] GET error:', e);
    return NextResponse.json({ error: 'Failed to fetch flagged content' }, { status: 500 });
  }
}

/**
 * PUT /api/admin/chronicles/flagged-content
 * Update flag status and optionally add resolution
 * Body: { flag_id, status, resolution_reason, action_taken }
 */
export async function PUT(req: NextRequest) {
  try {
    const adminData = await getAdminFromRequest(req);
    if (!adminData?.admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const admin = adminData.admin;

    const supabase = await createSupabaseServer();
    const body = await req.json();
    const { flag_id, status, resolution_reason, action_taken } = body;

    if (!flag_id || !status) {
      return NextResponse.json(
        { error: 'Missing flag_id or status' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['pending', 'under_review', 'resolved', 'dismissed'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: 400 }
      );
    }

    // Get the flag record first
    const { data: flagRecord, error: fetchError } = await supabase
      .from('chronicles_flagged_reviews')
      .select('*')
      .eq('id', flag_id)
      .single();

    if (fetchError || !flagRecord) {
      return NextResponse.json(
        { error: 'Flag record not found' },
        { status: 404 }
      );
    }

    // Update the flag status
    const updateData: any = {
      status,
      action_taken: action_taken || null,
    };

    if (['resolved', 'dismissed'].includes(status)) {
      updateData.resolved_by = admin.id;
      updateData.resolved_at = new Date().toISOString();
    }

    const { data: updatedFlag, error: updateError } = await supabase
      .from('chronicles_flagged_reviews')
      .update(updateData)
      .eq('id', flag_id)
      .select()
      .single();

    if (updateError) {
      console.error('[FLAGGED-CONTENT] Update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to update flag status' },
        { status: 500 }
      );
    }

    // Get flagged content creator info to notify them
    let creatorId = null;
    if (flagRecord.post_id) {
      const { data: post } = await supabase
        .from('chronicles_posts')
        .select('creator_id')
        .eq('id', flagRecord.post_id)
        .single();
      creatorId = post?.creator_id;
    } else if (flagRecord.chain_entry_post_id) {
      const { data: entry } = await supabase
        .from('chronicles_chain_entry_posts')
        .select('added_by')
        .eq('id', flagRecord.chain_entry_post_id)
        .single();
      creatorId = entry?.added_by;
    }

    // Create admin notification about the action
    if (creatorId) {
      const notificationTitle =
        status === 'resolved' ? 'Your content review completed' : 'Content review status updated';
      const notificationMessage =
        status === 'resolved'
          ? `Your flagged content has been reviewed. ${resolution_reason || 'Please contact support for details.'}`
          : `Your flagged content review status: ${status}`;

      await supabase.from('chronicles_admin_notifications').insert({
        notification_type: 'post_flagged',
        title: notificationTitle,
        message: notificationMessage,
        creator_id: creatorId,
        post_id: flagRecord.post_id,
        priority: 'normal',
        data: {
          flag_id,
          old_status: flagRecord.status,
          new_status: status,
          resolved_reason: resolution_reason,
        },
      });

      // Also create creator notification
      await supabase.from('chronicles_notifications').insert({
        notification_type: 'flag_status_changed',
        title: notificationTitle,
        message: notificationMessage,
        creator_id: creatorId,
        related_post_id: flagRecord.post_id || null,
        data: {
          flag_id,
          status,
          resolved_reason: resolution_reason,
        },
      });
    }

    return NextResponse.json({
      success: true,
      flag: updatedFlag,
      message: `Flag status updated to ${status}`,
    });
  } catch (e) {
    console.error('[FLAGGED-CONTENT] PUT error:', e);
    return NextResponse.json({ error: 'Failed to update flag status' }, { status: 500 });
  }
}
