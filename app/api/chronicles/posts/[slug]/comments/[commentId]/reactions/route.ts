import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface Params {
  slug: string;
  commentId: string;
}

// Get comment reactions
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug: postId, commentId } = await params;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify comment exists
    const { data: comment, error: commentError } = await supabase
      .from("chronicles_comments")
      .select("id, likes_count, post_id")
      .eq("id", commentId)
      .eq("post_id", postId)
      .single();

    if (commentError || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    // Check if user is authenticated
    const authHeader = request.headers.get("authorization");
    let userHasLiked = false;
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

      const { data: { user }, error: userError } = await authClient.auth.getUser();

      if (!userError && user) {
        // Get creator ID for this user
        const { data: creator } = await supabase
          .from("chronicles_creators")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (creator) {
          creatorId = creator.id;

          // Check if user has liked this comment
          const { data: userReaction } = await supabase
            .from("chronicles_comment_reactions")
            .select("id")
            .eq("comment_id", commentId)
            .eq("creator_id", creatorId)
            .eq("reaction_type", "like")
            .single();

          userHasLiked = !!userReaction;
        }
      }
    }

    return NextResponse.json({
      success: true,
      comment_id: commentId,
      likes_count: comment.likes_count || 0,
      reactions_count: comment.likes_count || 0,
      user_has_liked: userHasLiked,
    });
  } catch (error) {
    console.error("Error fetching comment reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment reactions" },
      { status: 500 }
    );
  }
}
