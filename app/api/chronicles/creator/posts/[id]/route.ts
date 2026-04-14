import { createSupabaseServer } from '@/lib/supabase-server';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const supabase = createSupabaseServer();
    
    // Extract user ID from Authorization header
    let userId: string | undefined = undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Verify token and get user
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await client.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }
    
    let creatorId: string | undefined = undefined;
    if (userId) {
      const { data: creator } = await supabase
        .from('chronicles_creators')
        .select('id')
        .eq('user_id', userId)
        .single();
      creatorId = creator?.id;
    }

    // Fetch post
    const { data: post, error } = await supabase
      .from('chronicles_posts')
      .select('*')
      .eq('id', postId)
      .single();

    if (error) throw error;

    // Check authorization for draft/flagged posts
    if ((post.status === 'draft' || post.flagged_for_review) && post.creator_id !== creatorId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    return NextResponse.json(post);
  } catch (error) {
    console.error('Fetch post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch post' },
      { status: 400 }
    );
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const supabase = createSupabaseServer();
    
    // Extract user ID from Authorization header
    let userId: string | undefined = undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Verify token and get user
      const client = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await client.auth.getUser(token);
      if (user) {
        userId = user.id;
      }
    }
    
    const updates = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: post } = await supabase
      .from('chronicles_posts')
      .select('creator_id')
      .eq('id', postId)
      .single();

    if (post?.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // If trying to publish, check if post is flagged with active review
    if (updates.status === 'published') {
      const { data: flaggedReview } = await supabase
        .from('chronicles_flagged_reviews')
        .select('status')
        .eq('post_id', postId)
        .in('status', ['pending', 'under_review'])
        .limit(1)
        .single();

      if (flaggedReview) {
        return NextResponse.json(
          { error: 'Cannot publish while post is under review. Status: ' + flaggedReview.status },
          { status: 400 }
        );
      }
    }

    // Update post - if editing a flagged post, clear the flag and set to draft for re-review
    if (updates.status !== 'published') {
      updates.flagged_for_review = false;
    }
    
    // Update post
    const { data: updatedPost, error: updateError } = await supabase
      .from('chronicles_posts')
      .update(updates)
      .eq('id', postId)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Update post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update post' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: postId } = await params
    const supabase = createSupabaseServer();
    
    // Extract user ID from Authorization header
    let userId: string | undefined = undefined;
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      // Verify token and get user
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

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Verify ownership
    const { data: post } = await supabase
      .from('chronicles_posts')
      .select('creator_id')
      .eq('id', postId)
      .single();

    if (post?.creator_id !== creator.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Delete post
    const { error: deleteError } = await supabase
      .from('chronicles_posts')
      .delete()
      .eq('id', postId);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete post' },
      { status: 400 }
    );
  }
}
