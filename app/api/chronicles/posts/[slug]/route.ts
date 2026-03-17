import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    
    // Use service role key for proper data access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    const supabase = serviceRoleKey
      ? createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          serviceRoleKey,
          {
            global: {
              headers: {
                Authorization: `Bearer ${serviceRoleKey}`,
              },
            },
          }
        )
      : await createSupabaseServerClient();

    let query = supabase
      .from('chronicles_posts')
      .select(`
        *,
        creator:chronicles_creators(
          id,
          pen_name,
          display_name,
          profile_image_url,
          avatar_url,
          bio,
          email,
          total_followers
        )
      `);

    // Try to match by ID first (UUID format), then by slug
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    if (isUUID) {
      query = query.eq('id', slug);
    } else {
      query = query.eq('slug', slug);
    }

    const { data: post, error: postError } = await query
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
      .eq('id', post.id);

    // Format response for Flutter
    const formattedPost = {
      id: post.id,
      title: post.title,
      type: post.post_type,
      source: 'creator',
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt,
      category: post.category,
      tags: post.tags,
      status: post.status,
      coverImageUrl: post.cover_image_url,
      likesCount: post.likes_count || 0,
      commentsCount: post.comments_count || 0,
      sharesCount: post.shares_count || 0,
      viewCount: post.views_count || 0,
      createdAt: post.created_at,
      publishedAt: post.published_at,
      updatedAt: post.updated_at,
      author: post.creator ? {
        id: post.creator.id,
        name: post.creator.display_name || post.creator.pen_name,
        username: post.creator.pen_name?.toLowerCase().replace(/\s+/g, ''),
        penName: post.creator.pen_name,
        bio: post.creator.bio,
        avatar_url: post.creator.avatar_url || post.creator.profile_image_url,
        followers: post.creator.total_followers || 0,
      } : null,
    };

    return NextResponse.json({ success: true, data: formattedPost });
  } catch (error) {
    console.error('Error fetching post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch post', success: false },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = request.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      supabase = createClient(
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
    } else {
      // Fallback to cookie-based auth for web
      supabase = await createSupabaseServerClient();
    }

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error in DELETE post:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get service role client for better access
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const accessClient = serviceRoleKey 
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
      : supabase;

    // Get creator ID
    const { data: creator, error: creatorError } = await accessClient
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.log('Creator error:', creatorError);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Fetch post to verify ownership - slug can be ID (UUID) or actual slug
    let postQuery = accessClient
      .from('chronicles_posts')
      .select('id, creator_id');

    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
    
    if (isUUID) {
      postQuery = postQuery.eq('id', slug);
    } else {
      postQuery = postQuery.eq('slug', slug);
    }

    const { data: post, error: postFetchError } = await postQuery.single();

    if (postFetchError || !post) {
      console.log('Post fetch error:', postFetchError);
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.creator_id !== creator.id) {
      console.log('Unauthorized: post does not belong to creator');
      return NextResponse.json({ error: 'You can only delete your own posts' }, { status: 403 });
    }

    // Delete the post
    const { error: deleteError } = await accessClient
      .from('chronicles_posts')
      .delete()
      .eq('id', post.id);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    console.log('Post deleted successfully:', post.id);
    return NextResponse.json({ 
      success: true, 
      message: 'Post deleted successfully' 
    });
  } catch (error) {
    console.error('Delete post error:', error);
    return NextResponse.json(
      { error: 'Failed to delete post' },
      { status: 500 }
    );
  }
}
