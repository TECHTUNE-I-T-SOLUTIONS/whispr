import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

// GET reactions for a chain entry post
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const entryPostId = searchParams.get('entry_post_id');
  const userIp = request.headers.get('x-forwarded-for') || 'unknown';
  const authHeader = request.headers.get('authorization');

  if (!entryPostId) {
    return NextResponse.json({ error: 'Entry post ID is required' }, { status: 400 });
  }

  try {
    // Check if user is authenticated
    let userId: string | null = null;
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
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
      }
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

    // Get the post to verify it exists
    const { data: post, error: postError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('likes_count')
      .eq('id', entryPostId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    return NextResponse.json({
      reactions: [{ type: 'like', count: post.likes_count || 0 }],
      userReaction: null, // For now, we don't track individual likes per user
    });
  } catch (error) {
    console.error('GET reactions error', error);
    return NextResponse.json({ error: 'Failed to fetch reactions' }, { status: 500 });
  }
}

// POST reaction (like) on a chain entry post
export async function POST(request: NextRequest) {
  try {
    const { entry_post_id, reaction_type = 'like' } = await request.json();
    const authHeader = request.headers.get('authorization');

    if (!entry_post_id) {
      return NextResponse.json({ error: 'Entry post ID is required' }, { status: 400 });
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
        }
      } catch (error) {
        console.warn('Token validation failed:', error);
      }
    }

    if (!userId) {
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

    // Get creator ID from user
    const { data: creator } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
      .single();

    if (!creator) {
      return NextResponse.json({ error: 'Creator profile not found' }, { status: 404 });
    }
    creatorId = creator.id;

    // Check if post exists
    const { data: post, error: postError } = await supabase
      .from('chronicles_chain_entry_posts')
      .select('id, likes_count')
      .eq('id', entry_post_id)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Check if user already liked this post
    const { data: existingLike } = await supabase
      .from('chronicles_chain_entry_post_likes')
      .select('id')
      .eq('chain_entry_post_id', entry_post_id)
      .eq('creator_id', creatorId)
      .single();

    let action = 'liked';
    if (existingLike) {
      // Unlike
      await supabase
        .from('chronicles_chain_entry_post_likes')
        .delete()
        .eq('id', existingLike.id);
      action = 'unliked';
    } else {
      // Like
      const { error: insertError } = await supabase
        .from('chronicles_chain_entry_post_likes')
        .insert({
          chain_entry_post_id: entry_post_id,
          creator_id: creatorId,
          reaction_type: reaction_type,
        });
      
      if (insertError) {
        console.error('Insert like error:', insertError);
        throw insertError;
      }
    }

    // Get updated likes count (trigger already updated the posts table)
    const { data: updatedLikes, error: countError } = await supabase
      .from('chronicles_chain_entry_post_likes')
      .select('*', { count: 'exact', head: true })
      .eq('chain_entry_post_id', entry_post_id);

    const newLikesCount = updatedLikes?.length || 0;

    return NextResponse.json({
      success: true,
      action,
      likes_count: newLikesCount,
      message: `Successfully ${action} the post`,
    });
  } catch (error) {
    console.error('POST reaction error', error);
    return NextResponse.json({ success: false, error: 'Failed to update reaction' }, { status: 500 });
  }
}
