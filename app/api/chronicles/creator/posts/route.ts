import { createSupabaseServer } from '@/lib/supabase-server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');
    const body = await req.json();

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get creator ID from user ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', userId)
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
        cover_image_url: body.coverImageUrl,
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
      { status: 400 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createSupabaseServer();
    const userId = req.headers.get('x-user-id');
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

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

    return NextResponse.json(posts || []);
  } catch (error) {
    console.error('Fetch posts error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch posts' },
      { status: 400 }
    );
  }
}
