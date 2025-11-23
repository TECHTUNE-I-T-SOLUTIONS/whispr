import { NextRequest, NextResponse } from "next/server";
import { createServerClient, serializeCookieHeader } from "@supabase/ssr";
import { cookies } from "next/headers";

// Get comments for a post with threading
export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("post_id");
    const parentCommentId = searchParams.get("parent_id");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    let query = supabase
      .from("chronicles_comments")
      .select(
        `
        *,
        creator:chronicles_creators(id, pen_name, profile_image_url),
        replies:chronicles_comments(count)
      `
      )
      .eq("status", "approved")
      .order("likes_count", { ascending: false })
      .range(offset, offset + limit - 1);

    if (postId) {
      query = query.eq("post_id", postId);
    }

    if (parentCommentId) {
      query = query.eq("parent_comment_id", parentCommentId);
    } else {
      // Top-level comments only
      query = query.is("parent_comment_id", null);
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    console.error("Comments fetch error:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments" },
      { status: 500 }
    );
  }
}

// Create a new comment
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { post_id, content, parent_comment_id } = await request.json();

    // Get creator ID
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creatorError || !creator) {
      return NextResponse.json(
        { error: "Creator profile not found" },
        { status: 404 }
      );
    }

    // Create comment
    const { data: comment, error } = await supabase
      .from("chronicles_comments")
      .insert([
        {
          post_id,
          creator_id: creator.id,
          content,
          parent_comment_id: parent_comment_id || null,
          status: "approved", // Would be 'pending' if moderation enabled
        },
      ])
      .select()
      .single();

    if (error) throw error;

    // Update comment count on post or parent comment
    if (parent_comment_id) {
      await supabase
        .from("chronicles_comments")
        .update({ replies_count: 1 }, { count: "exact" })
        .eq("id", parent_comment_id);
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    console.error("Comment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}

// Delete a comment (creator or admin only)
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Handle cookie setting errors
            }
          },
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get("id");

    // Verify ownership
    const { data: comment, error: fetchError } = await supabase
      .from("chronicles_comments")
      .select("creator_id")
      .eq("id", commentId)
      .single();

    if (fetchError || !comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    const { data: creator } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (creator?.id !== comment.creator_id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Delete comment
    const { error } = await supabase
      .from("chronicles_comments")
      .delete()
      .eq("id", commentId);

    if (error) throw error;

    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    console.error("Comment deletion error:", error);
    return NextResponse.json(
      { error: "Failed to delete comment" },
      { status: 500 }
    );
  }
}
