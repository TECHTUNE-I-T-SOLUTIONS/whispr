import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const supabase = await createSupabaseServerClient();
    const { slug } = await params;

    // Get post by slug
    const { data: post, error: postError } = await supabase
      .from('chronicles_posts')
      .select(`
        *,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url,
          bio
        )
      `)
      .eq('slug', slug)
      .eq('status', 'published')
      .single();

    if (postError || !post) {
      return NextResponse.json(
        { error: 'Post not found' },
        { status: 404 }
      );
    }

    // Increment view count
    await supabase
      .from('chronicles_posts')
      .update({ views_count: (post.views_count || 0) + 1 })
      .eq('id', post.id)
      .throwOnError();

    return NextResponse.json({ post });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post' },
      { status: 500 }
    );
  }
}
