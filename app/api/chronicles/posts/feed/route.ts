import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Return public feed of published posts ordered by published_at desc
      const { data: posts, error } = await supabase
        .from('chronicles_posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          cover_image_url,
          views_count,
          likes_count,
          comments_count,
          shares_count,
          published_at,
          creator:chronicles_creators(id, pen_name, profile_image_url)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })
        .limit(50);    if (error) {
      console.error('Feed error:', error);
      return NextResponse.json({ error: 'Failed to load feed' }, { status: 500 });
    }

    return NextResponse.json({ posts: posts || [] });
  } catch (err) {
    console.error('Feed exception:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
