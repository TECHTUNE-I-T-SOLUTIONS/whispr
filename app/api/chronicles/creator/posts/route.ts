import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    let supabase;

    // Check for Authorization header (for mobile app)
    const authHeader = req.headers.get('authorization');
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
      console.log('Auth error in GET posts:', userError);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || 'all';

    // Get creator ID using service role key if available (for better data access)
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    const accessClient = serviceRoleKey 
      ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, serviceRoleKey)
      : supabase;

    const { data: creator, error: creatorError } = await accessClient
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (creatorError || !creator) {
      console.log('Creator error:', creatorError);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    // Fetch posts using service role for proper data access
    let query = accessClient
      .from('chronicles_posts')
      .select('*')
      .eq('creator_id', creator.id)
      .order('created_at', { ascending: false });

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data: posts, error: postsError } = await query;

    if (postsError) throw postsError;

    console.log('Fetched posts for creator:', creator.id, 'Post count:', posts?.length || 0);

    // Fetch flagged reviews for all posts in parallel (all active statuses)
    const postIds = (posts || []).map(p => p.id);
    const { data: flaggedReviews } = await accessClient
      .from('chronicles_flagged_reviews')
      .select('post_id, status, reason')
      .in('post_id', postIds)
      .in('status', ['pending', 'under_review', 'resolved', 'dismissed']);

    // Create a map of flagged reviews by post_id
    const flaggedReviewsMap = new Map();
    flaggedReviews?.forEach(review => {
      flaggedReviewsMap.set(review.post_id, review);
    });

    return NextResponse.json({
      posts: (posts || []).map((post) => ({
        id: post.id,
        title: post.title,
        type: post.post_type,
        slug: post.slug,
        excerpt: post.excerpt,
        content: post.content,
        status: post.status,
        likesCount: post.likes_count || 0,
        commentsCount: post.comments_count || 0,
        sharesCount: post.shares_count || 0,
        viewCount: post.views_count || 0,
        createdAt: post.created_at,
        publishedAt: post.published_at,
        category: post.category,
        coverImageUrl: post.cover_image_url,
        isFlagged: flaggedReviewsMap.has(post.id),
        flagStatus: flaggedReviewsMap.get(post.id)?.status || null,
        flagReason: flaggedReviewsMap.get(post.id)?.reason || null,
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
    let authUser: any;

    // Check for Authorization header (for mobile app)
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7); // Remove 'Bearer ' prefix
      const clientSupabase = createClient(
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
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    } else {
      // Fallback to cookie-based auth for web
      const clientSupabase = await createSupabaseServerClient();
      const { data, error } = await clientSupabase.auth.getUser();
      if (error || !data.user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
      authUser = data.user;
    }

    const body = await req.json();

    // Get service role key - try multiple env var names
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
                          process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;
    
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'Server configuration error: missing service role key' },
        { status: 500 }
      );
    }

    console.log('Service Role Key available:', !!serviceRoleKey);
    console.log('Using service role:', true);

    // Create Supabase client with service role key - this bypasses RLS
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      }
    );

    // Get creator ID from user ID
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id')
      .eq('user_id', authUser.id)
      .single();

    if (creatorError || !creator) {
      console.error('Creator fetch error:', creatorError);
      return NextResponse.json({ error: 'Creator not found' }, { status: 404 });
    }

    console.log('Creator fetched:', creator);
    console.log('Creating post with creator_id:', creator.id);

    if (!creator.id) {
      console.error('Creator ID is empty or undefined');
      return NextResponse.json(
        { error: 'Creator ID validation failed' },
        { status: 400 }
      );
    }

    // Generate slug from title if not provided
    const generateSlug = (title: string) => {
      return title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .substring(0, 100);
    };

    const slug = body.slug || generateSlug(body.title);

    // Build insert object carefully
    const postData = {
      creator_id: creator.id,
      title: body.title,
      slug: slug,
      excerpt: body.excerpt || null,
      content: body.content,
      post_type: body.post_type || 'blog',
      category: body.category || null,
      tags: body.tags || [],
      cover_image_url: body.cover_image_url || null,
      formatting_data: body.formatting_data || {},
      status: body.status || 'draft',
      published_at: body.status === 'published' ? new Date().toISOString() : null,
    };

    console.log('Post data to insert:', postData);

    // Create post using service role client to bypass RLS
    const { data: post, error: postError } = await supabase
      .from('chronicles_posts')
      .insert(postData)
      .select()
      .single();

    if (postError) {
      console.error('Post insert error:', postError);
      console.error('Error code:', postError.code);
      console.error('Error message:', postError.message);
      console.error('Error details:', postError.details);
      console.error('Full error object:', JSON.stringify(postError, null, 2));
      
      // If it's a field-not-found error, try without select() to see if insert actually worked
      if (postError.code === '42703' && postError.message.includes('creator_id')) {
        console.log('Attempting fallback insert without select...');
        const { error: fallbackError } = await supabase
          .from('chronicles_posts')
          .insert(postData);
        
        if (fallbackError) {
          console.error('Fallback insert also failed:', fallbackError);
        } else {
          console.log('Fallback insert succeeded! Fetching the record...');
          const { data: fetchedPost, error: fetchError } = await supabase
            .from('chronicles_posts')
            .select('*')
            .eq('slug', postData.slug)
            .single();
          
          if (fetchError) {
            return NextResponse.json({ error: 'Post created but failed to fetch' }, { status: 500 });
          }
          return NextResponse.json(fetchedPost, { status: 201 });
        }
      }
      throw postError;
    }

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Create post error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create post' },
      { status: 500 }
    );
  }
}
