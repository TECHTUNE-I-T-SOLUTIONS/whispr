import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error in GET posts:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.log('Creator error:', creatorError);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Fetch posts
    let query = supabase
      .from('chronicles_posts')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) throw postsError;

    return NextResponse.json({
      posts: (posts || []).map((post) => ({
        id: post.id,
        title: post.title,
        slug: post.slug,
        excerpt: post.excerpt,
        status: post.status,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        viewsCount: post.views_count || 0,
        createdAt: post.created_at,
        publishedAt: post.published_at,
        post_type: post.post_type,
        category: post.category,
      })),
    });
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch posts', posts: [] },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient();

    // Get current user from session
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      console.log('Auth error in POST posts:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    // Get creator ID from user ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Create post
    const { data: post, error: postError } = await supabase
      .from('chronicles_posts')
      .insert({
        creator_id: creator.id,
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        post_type: body.post_type,
        category: body.category,
        tags: body.tags || [],
        cover_image_url: body.cover_image_url,
        formatting_data: body.formatting_data || {},
        status: body.status || 'draft',
      })
      .select()
      .single();

    if (postError) throw postError;

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
