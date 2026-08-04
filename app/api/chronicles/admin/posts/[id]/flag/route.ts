import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';
import { getAdminFromRequest } from '@/lib/auth-server';

export const dynamic = 'force-dynamic';

// Flags a chronicles post (blog/poem) or a chain-entry post for review.
// The DB trigger `handle_flag_post_for_review` then flips the content to
// `draft` (hiding it publicly) and fans out notifications. Here we only need
// to insert a valid flag row into `chronicles_flagged_reviews`.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // The flag row's `flagged_by` is NOT NULL and FK→admin(id), so we must use
    // the real signed-in admin — a placeholder UUID would fail the constraint.
    const adminData = await getAdminFromRequest(request);
    if (!adminData?.admin?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const adminId = adminData.admin.id as string;

    const supabase = createSupabaseServer();
    const { id: postId } = await params;
    const body = await request.json().catch(() => ({}));
    const { reason, description } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // `chronicles_flagged_reviews` can only reference a chronicles_posts row
    // (post_id) or a chain-entry post (chain_entry_post_id). Detect which one
    // this id is so we set the correct column and don't violate the FK.
    const { data: chronPost } = await supabase
      .from('chronicles_posts')
      .select('id')
      .eq('id', postId)
      .maybeSingle();

    let flagColumn: 'post_id' | 'chain_entry_post_id' | null = chronPost ? 'post_id' : null;

    if (!flagColumn) {
      const { data: chainEntry } = await supabase
        .from('chronicles_chain_entry_posts')
        .select('id')
        .eq('id', postId)
        .maybeSingle();
      if (chainEntry) flagColumn = 'chain_entry_post_id';
    }

    if (!flagColumn) {
      return NextResponse.json(
        { error: 'This content type cannot be flagged for review.' },
        { status: 400 }
      );
    }

    // Avoid stacking duplicate open flags on the same content.
    const { data: existing } = await supabase
      .from('chronicles_flagged_reviews')
      .select('id')
      .eq(flagColumn, postId)
      .in('status', ['pending', 'under_review'])
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { flag: existing, message: 'This content is already flagged and awaiting review.' },
        { status: 200 }
      );
    }

    // Create flag record. The AFTER INSERT trigger handles hiding the content
    // (status → draft) and creating creator/admin notifications.
    const { data: flag, error: flagError } = await supabase
      .from('chronicles_flagged_reviews')
      .insert({
        [flagColumn]: postId,
        flagged_by: adminId,
        reason,
        description: description || '',
        status: 'pending',
      })
      .select()
      .single();

    if (flagError) {
      console.error('Error flagging post:', flagError);
      return NextResponse.json(
        { error: flagError.message || 'Failed to flag post' },
        { status: 500 }
      );
    }

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error in POST /api/chronicles/admin/posts/[id]/flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
