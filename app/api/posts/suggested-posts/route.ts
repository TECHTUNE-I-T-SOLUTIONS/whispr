import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use service role to bypass RLS for public suggested posts
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

    // Get the current post to extract tags and type
    const { data: currentPost, error: postError } = await supabase
      .from('posts')
      .select('id, type, tags')
      .eq('id', postId)
      .maybeSingle();

    // Gracefully handle missing post — don't 404, just return empty
    if (postError || !currentPost) {
      console.warn('[suggested-posts] Post not found or error:', postId, postError?.message);
      return NextResponse.json({ posts: [] });
    }

    // Determine which type to filter by
    const filterType = postType || currentPost.type;

    // Build base query — select posts fields + admin data separately via admin_id
    // Note: Supabase foreign key join syntax requires the FK column name
    let query = supabase
      .from('posts')
      .select(`
        id,
        title,
        slug,
        excerpt,
        type,
        tags,
        cover_image_url,
        media_files,
        created_at,
        published_at,
        reading_time,
        admin_id
      `)
      .neq('id', postId)
      .eq('status', 'published')
      .eq('type', filterType)
      .order('created_at', { ascending: false })
      .limit(limit);

    // If post has tags, filter by matching tags
    if (currentPost.tags && Array.isArray(currentPost.tags) && currentPost.tags.length > 0) {
      query = query.overlaps('tags', currentPost.tags);
    }

    let { data: posts, error } = await query;

    // Fallback: if tag overlap fails or returns nothing, fetch recent posts of same type
    if (error || !posts || posts.length === 0) {
      if (error) console.warn('[suggested-posts] Tag query error, falling back:', error.message);

      const { data: fallback, error: fallbackError } = await supabase
        .from('posts')
        .select(`
          id,
          title,
          slug,
          excerpt,
          type,
          tags,
          cover_image_url,
          media_files,
          created_at,
          published_at,
          reading_time,
          admin_id
        `)
        .neq('id', postId)
        .eq('status', 'published')
        .eq('type', filterType)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (fallbackError || !fallback) {
        console.error('[suggested-posts] Fallback also failed:', fallbackError?.message);
        return NextResponse.json({ posts: [] });
      }
      posts = fallback;
    }

    // Fetch admin data for each unique admin_id
    const adminIds = [...new Set(posts.map((p: any) => p.admin_id).filter(Boolean))];
    let adminMap: Record<string, any> = {};

    if (adminIds.length > 0) {
      const { data: admins } = await supabase
        .from('admin')
        .select('id, username, full_name, avatar_url')
        .in('id', adminIds);

      if (admins) {
        for (const a of admins) {
          adminMap[a.id] = a;
        }
      }
    }

    // Merge admin data into posts, also resolve the first image from media_files
    const enriched = posts.map((post: any) => {
      const admin = adminMap[post.admin_id] || { id: post.admin_id, username: 'Whispr', full_name: null, avatar_url: null };

      // Resolve cover image: cover_image_url first, then first image in media_files
      let coverImage = post.cover_image_url || null;
      if (!coverImage && Array.isArray(post.media_files)) {
        const imgFile = post.media_files.find((f: any) =>
          f.file_type?.startsWith('image/') ||
          (f.file_url || '').match(/\.(jpg|jpeg|png|gif|webp|avif)$/i)
        );
        if (imgFile) coverImage = imgFile.file_url || imgFile.file_path || null;
      }

      return {
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        type: post.type,
        tags: post.tags,
        cover_image_url: coverImage,
        created_at: post.created_at,
        published_at: post.published_at,
        reading_time: post.reading_time,
        admin,
      };
    });

    return NextResponse.json({ posts: enriched });
  } catch (error) {
    console.error('[suggested-posts] Unexpected error:', error);
    return NextResponse.json({ posts: [] });
  }
}
