import { createSupabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;
    const supabase = createSupabaseServer();

    // Extract user ID from Authorization header
    let userId: string | undefined = undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await client.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator ID for authorization
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Verify post ownership
    const { data: post } = await supabase
      .from('chronicles_posts')
      .select('creator_id')
      .eq('id', postId)
      .single();

    if (post?.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Update flagged review status to "under_review"
    const { data: updatedReview, error: updateError } = await supabase
      .from('chronicles_flagged_reviews')
      .update({ 
        status: 'under_review',
        updated_at: new Date().toISOString(),
      })
      .eq('post_id', postId)
      .eq('status', 'pending')
      .select()
      .single();

    if (updateError) {
      console.error('Update review error:', updateError);
      return NextResponse.json(
        { error: 'Failed to appeal this post' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Your appeal has been submitted. Admins will review your post soon.',
      review: updatedReview,
    });
  } catch (error) {
    console.error('Appeal flagged post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to appeal post' },
      { status: 400 }
    );
  }
}
