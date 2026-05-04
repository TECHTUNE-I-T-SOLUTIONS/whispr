import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseServerClient } from '@/lib/supabase-server-client';

export async function GET(_request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    const { data: posts, error } = await supabase
      .from('chronicles_posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        content,
        cover_image_url,
        post_type,
        category,
        tags,
        views_count,
        likes_count,
        comments_count,
        shares_count,
        status,
        published_at,
        created_at,
        creator:chronicles_creators(id, pen_name, profile_image_url, user_id)
      `)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error('All chronicles error:', error);
      return NextResponse.json({ error: 'Failed to load chronicles' }, { status: 500 });
    }

    const data = (posts ?? []).map((post: any) => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      type: post.post_type,
      source: 'creator',
      coverImageUrl: post.cover_image_url,
      tags: post.tags,
      viewCount: post.views_count,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      sharesCount: post.shares_count,
      status: post.status,
      createdAt: post.created_at,
      publishedAt: post.published_at,
      author: {
        id: post.creator?.id,
        name: post.creator?.pen_name || 'Whispr Creator',
        username: post.creator?.pen_name ? post.creator.pen_name.toLowerCase().replace(/\s+/g, '') : null,
        avatar_url: post.creator?.profile_image_url,
        type: 'creator',
      },
    }));

    return NextResponse.json({ posts: data });
  } catch (error) {
    console.error('All chronicles exception:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
