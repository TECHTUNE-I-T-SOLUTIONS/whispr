import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ creatorId: string }> }
) {
  try {
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

    const { creatorId } = await params;

    // Get current user (to check follow status)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get creator details
    const { data: creator, error } = await supabase
      .from("chronicles_creators")
      .select(`
        id,
        user_id,
        pen_name,
        bio,
        profile_image_url,
        is_verified,
        is_banned,
        total_posts,
        total_engagement,
        total_followers,
        profile_visibility,
        content_type,
        categories,
        location,
        current_streak,
        total_points,
        created_at,
        updated_at
      `)
      .eq("id", creatorId)
      .single();

    if (error || !creator) {
      return NextResponse.json(
        { error: "Creator not found" },
        { status: 404 }
      );
    }

    // Check if user is following this creator
    let isFollowing = false;
    let isFollowingBack = false;

    if (user) {
      // Get current creator profile
      const { data: currentCreator } = await supabase
        .from("chronicles_creators")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (currentCreator) {
        // Check if current user follows this creator
        const { data: follow } = await supabase
          .from("chronicles_follows")
          .select("*")
          .eq("follower_id", currentCreator.id)
          .eq("following_id", creatorId)
          .single();

        isFollowing = !!follow;

        // Check if this creator follows back
        const { data: followBack } = await supabase
          .from("chronicles_follows")
          .select("*")
          .eq("follower_id", creatorId)
          .eq("following_id", currentCreator.id)
          .single();

        isFollowingBack = !!followBack;
      }
    }

    // Get creator's posts
    const { data: posts } = await supabase
      .from("chronicles_posts")
      .select(`
        id,
        title,
        slug,
        excerpt,
        post_type,
        category,
        engagement_count,
        views_count,
        published_at
      `)
      .eq("creator_id", creatorId)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10);

    // Transform data to match frontend interface
    const transformedCreator = {
      id: creator.id,
      pen_name: creator.pen_name,
      bio: creator.bio || '',
      profile_picture_url: creator.profile_image_url,
      profile_visibility: creator.profile_visibility || 'public',
      post_count: creator.total_posts || 0,
      engagement_count: creator.total_engagement || 0,
      current_streak: creator.current_streak || 0,
      total_points: creator.total_points || 0,
      verified_badge: creator.is_verified || false,
      social_links: {},
      content_type: creator.content_type || 'General',
      categories: Array.isArray(creator.categories) ? creator.categories : [],
      location: creator.location,
      followers_count: creator.total_followers || 0,
      following_count: 0, // Would need separate query
    };

    const transformedPosts = (posts || []).map(post => ({
      id: post.id,
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt || '',
      post_type: post.post_type,
      category: post.category,
      engagement_count: post.engagement_count || 0,
      view_count: post.views_count || 0,
      published_at: post.published_at,
    }));

    return NextResponse.json({
      creator: transformedCreator,
      posts: transformedPosts,
      is_following: isFollowing,
      is_following_back: isFollowingBack,
    });
  } catch (error) {
    console.error("Error fetching creator details:", error);
    return NextResponse.json(
      { error: "Failed to fetch creator details" },
      { status: 500 }
    );
  }
}
