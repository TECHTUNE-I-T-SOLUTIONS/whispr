import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface Params {
  slug: string;
  commentId: string;
}

// Get comment likes
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

    const { data: comment, error } = await supabase
      .from("chronicles_comments")
      .select("likes_count")
      .eq("id", commentId)
      .eq("post_id", postId)
      .single();

    if (error || !comment) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      likes_count: comment.likes_count || 0,
    });
  } catch (error) {
    console.error("Error fetching comment likes:", error);
    return NextResponse.json(
      { error: "Failed to fetch comment likes" },
      { status: 500 }
    );
  }
}

// Like a comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug: postId, commentId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user is authenticated
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
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get creator ID for this user
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found. Please create a creator profile first." },
        { status: 404 }
      );
    }

    const creatorId = creator.id;

    // Check if comment exists
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

    // Check if user already liked this comment
    const { data: existingLike, error: likeCheckError } = await supabase
      .from("chronicles_comment_reactions")
      .select("id")
      .eq("comment_id", commentId)
      .eq("creator_id", creatorId)
      .eq("reaction_type", "like")
      .single();

    if (existingLike) {
      return NextResponse.json(
        { error: "Already liked this comment" },
        { status: 409 }
      );
    }

    // Record the like
    const { error: insertError } = await supabase
      .from("chronicles_comment_reactions")
      .insert([
        {
          comment_id: commentId,
          creator_id: creatorId,
          reaction_type: "like",
        },
      ]);

    if (insertError) {
      console.error("Error recording like:", insertError);
      return NextResponse.json(
        { error: "Failed to record like" },
        { status: 500 }
      );
    }

    // Increment likes count
    const newLikesCount = (comment.likes_count || 0) + 1;
    const { error: updateError } = await supabase
      .from("chronicles_comments")
      .update({ likes_count: newLikesCount })
      .eq("id", commentId);

    if (updateError) {
      console.error("Error updating likes count:", updateError);
      return NextResponse.json(
        { error: "Failed to update likes count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      likes_count: newLikesCount,
      message: "Comment liked successfully",
    });
  } catch (error) {
    console.error("Error liking comment:", error);
    return NextResponse.json(
      { error: "Failed to like comment" },
      { status: 500 }
    );
  }
}

// Unlike a comment
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const { slug: postId, commentId } = await params;

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // Verify user is authenticated
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
      error: userError,
    } = await authClient.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid token" },
        { status: 401 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get creator ID for this user
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found. Please create a creator profile first." },
        { status: 404 }
      );
    }

    const creatorId = creator.id;

    // Check if comment exists
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

    // Remove the like
    const { error: deleteError } = await supabase
      .from("chronicles_comment_reactions")
      .delete()
      .eq("comment_id", commentId)
      .eq("creator_id", creatorId)
      .eq("reaction_type", "like");

    if (deleteError) {
      console.error("Error removing like:", deleteError);
      return NextResponse.json(
        { error: "Failed to remove like" },
        { status: 500 }
      );
    }

    // Decrement likes count
    const newLikesCount = Math.max(0, (comment.likes_count || 1) - 1);
    const { error: updateError } = await supabase
      .from("chronicles_comments")
      .update({ likes_count: newLikesCount })
      .eq("id", commentId);

    if (updateError) {
      console.error("Error updating likes count:", updateError);
      return NextResponse.json(
        { error: "Failed to update likes count" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      likes_count: newLikesCount,
      message: "Like removed successfully",
    });
  } catch (error) {
    console.error("Error unliking comment:", error);
    return NextResponse.json(
      { error: "Failed to unlike comment" },
      { status: 500 }
    );
  }
}
