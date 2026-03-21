import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET comments for a chain entry post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entryPostId = searchParams.get('entry_post_id');

  if (!entryPostId) {
    return NextResponse.json({ error: 'Entry post ID is required' }, { status: 400 });
  }

  try {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(
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

    // Get all comments for this post (parent comments only)
    const { data: comments, error } = await supabase
      .from('chronicles_chain_entry_post_comments')
      .select(`
        id,
        content,
        created_at,
        likes_count,
        replies_count,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .eq('chain_entry_post_id', entryPostId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('GET comments error', error);
      return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
    }

    return NextResponse.json({ success: true, comments: comments || [] });
  } catch (error) {
    console.error('GET comments error', error);
    return NextResponse.json({ error: 'Failed to fetch comments' }, { status: 500 });
  }
}

// POST comment on a chain entry post
export async function POST(request: NextRequest) {
  try {
    const { entry_post_id, content } = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!entry_post_id || !content || !content.trim()) {
      return NextResponse.json({ error: 'Entry post ID and content are required' }, { status: 400 });
    }

    let userId: string | null = null;
    let creatorId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const client = createClient(
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
        const { data: { user }, error } = await client.auth.getUser();
        if (!error && user) {
          userId = user.id;
          // Get creator ID from chronicles_creators
          const { data: creator } = await client
            .from('chronicles_creators')
            .select('id, pen_name')
            .eq('user_id', userId)
            .single();
          creatorId = creator?.id;
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
      }
    }

    if (!userId || !creatorId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

    const supabase = createClient(
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

    // Verify the post exists
    const { data: post, error: postError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('id, comments_count')
      .eq('id', entry_post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Create comment in the new table
    const { data: comment, error: insertError } = await supabase
      .from('chronicles_chain_entry_post_comments')
      .insert({
        chain_entry_post_id: entry_post_id,
        creator_id: creatorId,
        content: content.trim(),
        status: 'approved',
      })
      .select(`
        id,
        content,
        created_at,
        likes_count,
        replies_count,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url
        )
      `)
      .single();

    if (insertError) {
      console.error('Insert comment error:', insertError);
      return NextResponse.json({ error: 'Failed to post comment' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      comment,
      message: 'Comment posted successfully',
    });
  } catch (error) {
    console.error('POST comment error', error);
    return NextResponse.json({ success: false, error: 'Failed to post comment' }, { status: 500 });
  }
}
