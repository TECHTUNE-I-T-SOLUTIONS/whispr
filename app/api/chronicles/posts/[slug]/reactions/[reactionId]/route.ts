import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Delete a specific reaction from a chronicles post
export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{ slug: string; reactionId: string }>;
  }
) {
  try {
    const { slug: postId, reactionId } = await params;

    if (!postId || !reactionId) {
      return NextResponse.json(
        { error: "Post ID and Reaction ID are required" },
        { status: 400 }
      );
    }

    // Get auth token from header
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Create auth client with user's token
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

    // Get current user
    const {
      data: { user },
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    // Use service role for database operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get the reaction to verify ownership
    const { data: reaction, error: reactionError } = await supabase
      .from("chronicles_post_reactions")
      .select("id, creator_id, post_id")
      .eq("id", reactionId)
      .eq("post_id", postId)
      .single();

    if (reactionError || !reaction) {
      return NextResponse.json(
        { error: "Reaction not found" },
        { status: 404 }
      );
    }

    // Get creator ID of current user
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Verify the reaction belongs to the current user
    if (reaction.creator_id !== creator.id) {
      return NextResponse.json(
        { error: "You can only delete your own reactions" },
        { status: 403 }
      );
    }

    // Delete the reaction
    const { error: deleteError } = await supabase
      .from("chronicles_post_reactions")
      .delete()
      .eq("id", reactionId);

    if (deleteError) {
      console.error("Error deleting reaction:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Reaction deleted successfully",
    });
  } catch (error) {
    console.error("Error in DELETE reaction:", error);
    return NextResponse.json(
      { error: "Failed to delete reaction" },
      { status: 500 }
    );
  }
}
