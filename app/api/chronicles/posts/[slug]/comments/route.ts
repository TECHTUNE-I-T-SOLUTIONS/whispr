import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

// Get comments for a chronicles post
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;

    // Use service role key to bypass RLS policies for reading comments
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    console.log(`Fetching comments for post: ${postId}, limit: ${limit}, offset: ${offset}`);

    // Fetch comments for the specific post
    let query = supabase
      .from("chronicles_comments")
      .select("id, post_id, creator_id, content, likes_count, status, created_at, updated_at")
      .eq("post_id", postId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    // Apply pagination using range
    if (limit > 0 && offset >= 0) {
      query = query.range(offset, offset + limit - 1);
    }

    const { data: rawComments, error: rawError } = await query;

    if (rawError) {
      console.error("Error fetching raw comments:", rawError);
      return NextResponse.json(
        { error: "Failed to fetch comments", details: rawError },
        { status: 500 }
      );
    }

    console.log(`Raw comments fetched for post ${postId}: ${rawComments?.length || 0}`, rawComments);

    // If we have comments, try to fetch with creator relationship
    if (rawComments && rawComments.length > 0) {
      // Fetch creator info for each comment
      const creatorIds = [...new Set(rawComments.map(c => c.creator_id))];
      console.log(`Fetching creators for IDs: ${creatorIds.join(", ")}`);

      const { data: creators, error: creatorError } = await supabase
        .from("chronicles_creators")
        .select("id, pen_name, profile_image_url, avatar_url")
        .in("id", creatorIds);

      if (creatorError) {
        console.error("Error fetching creators:", creatorError);
      }

      const creatorMap = new Map(creators?.map(c => [c.id, c]) || []);

      // Enrich comments with creator data
      const enrichedComments = rawComments.map(comment => ({
        ...comment,
        creator: creatorMap.get(comment.creator_id) || null,
      }));

      return NextResponse.json({
        success: true,
        comments: enrichedComments,
        total: enrichedComments.length,
      });
    }

    return NextResponse.json({
      success: true,
      comments: [],
      total: 0,
    });
  } catch (error) {
    console.error("Error in GET comments:", error);
    return NextResponse.json(
      { error: "Failed to fetch comments", details: String(error) },
      { status: 500 }
    );
  }
}

// Create a comment on a chronicles post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;
    const { content, author_name, author_email } = await request.json();

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Bearer token required" },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    // Use service role for creating records
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get user from the token passed by the client
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

    // Get or create creator profile (using service role)
    const { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    let creatorId = creator?.id;

    if (!creatorId) {
      // Create a creator profile if it doesn't exist
      const { data: newCreator, error: createError } = await supabase
        .from("chronicles_creators")
        .insert([
          {
            user_id: user.id,
            pen_name: author_name || "Anonymous",
            email: author_email || user.email,
          },
        ])
        .select("id")
        .single();

      if (createError) {
        console.error("Error creating creator:", createError);
        return NextResponse.json(
          { error: "Failed to create creator profile" },
          { status: 500 }
        );
      }

      creatorId = newCreator?.id;
    }

    // Verify the post exists
    const { data: post, error: postError } = await supabase
      .from("chronicles_posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Create the comment (using service role)
    const { data: comment, error: commentError } = await supabase
      .from("chronicles_comments")
      .insert([
        {
          post_id: postId,
          creator_id: creatorId,
          content: content.trim(),
          status: "approved",
        },
      ])
      .select(`
        id,
        post_id,
        creator_id,
        content,
        likes_count,
        status,
        created_at,
        updated_at,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url,
          avatar_url
        )
      `)
      .single();

    if (commentError) {
      console.error("Error creating comment:", commentError);
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        comment,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST comment:", error);
    return NextResponse.json(
      { error: "Failed to create comment" },
      { status: 500 }
    );
  }
}
