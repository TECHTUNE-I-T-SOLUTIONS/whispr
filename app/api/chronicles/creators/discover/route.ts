import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
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

    // Get current user (to check follow status)
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    // Get all public creators with their stats
    const { data: creators, error } = await supabase
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
      .eq("profile_visibility", "public")
      .eq("is_banned", false)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // If user is authenticated, check which creators they follow
    let followingMap: Record<string, boolean> = {};
    if (user && creators && creators.length > 0) {
      const creatorIds = creators.map(c => c.id);
      const { data: follows } = await supabase
        .from("chronicles_follows")
        .select("following_id")
        .eq("follower_id", user.id)
        .in("following_id", creatorIds);

      if (follows) {
        followingMap = follows.reduce((acc, follow) => {
          acc[follow.following_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }
    }

    // Transform data to match frontend interface
    const transformedCreators = (creators || []).map(creator => ({
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
      is_following: followingMap[creator.id] || false,
    }));

    return NextResponse.json({
      creators: transformedCreators,
      total: transformedCreators.length,
    });
  } catch (error) {
    console.error("Error fetching creators for discovery:", error);
    return NextResponse.json(
      { error: "Failed to fetch creators", creators: [] },
      { status: 500 }
    );
  }
}
