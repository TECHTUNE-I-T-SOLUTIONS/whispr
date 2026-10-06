import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get('postId');
    const postType = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '6');

    if (!postId) {
      return NextResponse.json({ error: 'postId is required' }, { status: 400 });
    }

    // Get the current post to extract tags and category
    const { data: currentPost, error: postError } = await supabase
      .from('posts')
      .select('id, type, category, tags')
      .eq('id', postId)
      .single();

    if (postError || !currentPost) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    // Build query for suggested posts
    let query = supabase
      .from('posts')
      .select('id, title, slug, excerpt, type, category, tags, cover_image_url, created_at, published_at, reading_time, admin!inner(id, username, full_name, avatar_url)')
      .neq('id', postId)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(limit);

    // Filter by type if specified
    if (postType) {
      query = query.eq('type', postType);
    }

    // If post has tags, try to find posts with matching tags
    if (currentPost.tags && currentPost.tags.length > 0) {
      query = query.overlaps('tags', currentPost.tags);
    }

    const { data: posts, error } = await query;

    if (error) {
      console.error('Error fetching suggested posts:', error);
      // Fallback: fetch random posts if tag matching fails
      const { data: fallbackPosts, error: fallbackError } = await supabase
        .from('posts')
        .select('id, title, slug, excerpt, type, category, tags, cover_image_url, created_at, published_at, reading_time, admin!inner(id, username, full_name, avatar_url)')
        .neq('id', postId)
        .eq('status', 'published')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError) {
        return NextResponse.json({ error: 'Failed to fetch suggested posts' }, { status: 500 });
      }

      return NextResponse.json({ posts: fallbackPosts });
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error in suggested posts API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
