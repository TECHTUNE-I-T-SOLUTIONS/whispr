import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from '@/lib/supabase-server-client';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { creatorId } = body;

    if (!creatorId) {
      return NextResponse.json(
        { error: "Creator ID is required" },
        { status: 400 }
      );
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get current creator profile
    const { data: currentCreator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !currentCreator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Check if already following
    const { data: existingFollow } = await supabase
      .from("chronicles_follows")
      .select("*")
      .eq("follower_id", currentCreator.id)
      .eq("following_id", creatorId)
      .single();

    if (existingFollow) {
      // Unfollow
      const { error: unfollowError } = await supabase
        .from("chronicles_follows")
        .delete()
        .eq("follower_id", currentCreator.id)
        .eq("following_id", creatorId);

      if (unfollowError) throw unfollowError;

      // Follower count is automatically updated by trigger
      return NextResponse.json({
        success: true,
        following: false,
        message: "Unfollowed successfully"
      });
    } else {
      // Follow
      const { error: followError } = await supabase
        .from("chronicles_follows")
        .insert({
          follower_id: currentCreator.id,
          following_id: creatorId,
        });

      if (followError) throw followError;

      // Follower count is automatically updated by trigger
      return NextResponse.json({
        success: true,
        following: true,
        message: "Followed successfully"
      });
    }
  } catch (error) {
    console.error("Error following creator:", error);
    return NextResponse.json(
      { error: "Failed to follow creator" },
      { status: 500 }
    );
  }
}
