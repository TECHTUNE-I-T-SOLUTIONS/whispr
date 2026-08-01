import { NextResponse } from 'next/server';
import { createSupabaseServer } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createSupabaseServer();
    const { id: postId } = await params;
    const body = await request.json();
    const { reason, description } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required' }, { status: 400 });
    }

    // Get current admin user (you'll need to implement this based on your auth system)
    // For now, we'll use a placeholder
    const adminId = '00000000-0000-0000-0000-000000000000'; // Replace with actual admin ID

    // Create flag record
    const { data: flag, error: flagError } = await supabase
      .from('chronicles_flagged_reviews')
      .insert({
        post_id: postId,
        flagged_by: adminId,
        reason,
        description: description || '',
        status: 'pending',
      })
      .select()
      .single();

    if (flagError) {
      console.error('Error flagging post:', flagError);
      return NextResponse.json({ error: 'Failed to flag post' }, { status: 500 });
    }

    // Update post status to under review if needed
    // await supabase
    //   .from('chronicles_posts')
    //   .update({ status: 'under_review' })
    //   .eq('id', postId);

    return NextResponse.json({ flag });
  } catch (error) {
    console.error('Error in POST /api/chronicles/admin/posts/[id]/flag:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}