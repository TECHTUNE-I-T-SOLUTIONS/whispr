import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;
    const supabase = createSupabaseServer();

    // Fetch flagged review for this post (all active statuses)
    const { data: flaggedReview, error } = await supabase
      .from('chronicles_flagged_reviews')
      .select('id, reason, description, status, resolution, created_at, resolved_at')
      .eq('post_id', postId)
      .in('status', ['pending', 'under_review', 'resolved', 'dismissed'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      // No flagged review found, which is fine
      return NextResponse.json({ is_flagged: false, review: null });
    }

    return NextResponse.json({
      is_flagged: true,
      review: flaggedReview,
    });
  } catch (error) {
    console.error('Fetch flagged status error:', error);
    return NextResponse.json(
      { is_flagged: false, review: null },
      { status: 200 } // Return 200 even on error so frontend doesn't crash
    );
  }
}
