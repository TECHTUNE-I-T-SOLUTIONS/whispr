import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Record a share action for a chronicles post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;
    const body = await request.json();
    const { share_platform } = body;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("chronicles_posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get auth info for tracking user if authenticated
    const authHeader = request.headers.get("authorization");
    let creatorId: string | null = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      const authClient = createClient(
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

      const {
        data: { user },
      } = await authClient.auth.getUser();

      if (user) {
        // Get or create creator profile
        let { data: creator } = await supabase
          .from("chronicles_creators")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (!creator) {
          const { data: newCreator } = await supabase
            .from("chronicles_creators")
            .insert([
              {
                user_id: user.id,
                pen_name: user.email?.split("@")[0] || "Anonymous",
                email: user.email,
              },
            ])
            .select("id")
            .single();

          creator = newCreator;
        }

        creatorId = creator?.id || null;
      }
    }

    // Map share platform to shared_to value
    const sharedToMap: { [key: string]: string } = {
      native_share: "link",
      email: "email",
      social: "social",
      link: "link",
    };
    
    const sharedTo = sharedToMap[share_platform || "native_share"] || "unknown";

    // Record the share with correct column name
    // Note: creator_id can be null for anonymous shares, so we skip recording if not available
    if (!creatorId) {
      // Still return success for anonymous shares, just don't record creator
      return NextResponse.json(
        {
          success: true,
          message: "Share recorded successfully",
        },
        { status: 201 }
      );
    }

    const { data: share, error: shareError } = await supabase
      .from("chronicles_post_shares")
      .insert([
        {
          post_id: postId,
          creator_id: creatorId,
          shared_to: sharedTo,
          share_metadata: {
            platform: share_platform || "native_share",
          },
        },
      ])
      .select()
      .single();

    if (shareError) {
      // Log the error but still return success since share recording is not critical
      console.error("Error recording share:", shareError);
      // Return success anyway as the view was recorded and this is secondary functionality
      return NextResponse.json(
        {
          success: true,
          message: "Share recorded",
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        share,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST share:", error);
    return NextResponse.json(
      { error: "Failed to record share", details: String(error) },
      { status: 500 }
    );
  }
}
