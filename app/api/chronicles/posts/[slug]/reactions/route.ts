import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Get all reactions for a chronicles post with current user's reaction
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Get all reactions for this post
    const { data: reactions, error: reactionsError } = await supabase
      .from("chronicles_post_reactions")
      .select(`
        id,
        post_id,
        creator_id,
        reaction_type,
        created_at,
        creator:chronicles_creators(
          id,
          pen_name,
          profile_image_url,
          avatar_url
        )
      `)
      .eq("post_id", postId);

    if (reactionsError) {
      console.error("Error fetching reactions:", reactionsError);
      return NextResponse.json(
        { error: "Failed to fetch reactions" },
        { status: 500 }
      );
    }

    // Count reactions by type
    const reactionCounts: Record<string, number> = {};
    for (const reaction of reactions || []) {
      const type = reaction.reaction_type;
      reactionCounts[type] = (reactionCounts[type] || 0) + 1;
    }

    // Check if current user has reacted
    let userReaction: string | null = null;
    const authHeader = request.headers.get("authorization");

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
        // Get user's creator profile
        const { data: creator } = await authClient
          .from("chronicles_creators")
          .select("id")
          .eq("user_id", user.id)
          .single();

        if (creator) {
          // Check if user has already reacted
          const { data: userReactionData } = await authClient
            .from("chronicles_post_reactions")
            .select("reaction_type")
            .eq("post_id", postId)
            .eq("creator_id", creator.id)
            .single();

          if (userReactionData) {
            userReaction = userReactionData.reaction_type;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      reactions: Object.entries(reactionCounts).map(([type, count]) => ({
        type,
        count,
      })),
      userReaction,
    });
  } catch (error) {
    console.error("Error in GET reactions:", error);
    return NextResponse.json(
      { error: "Failed to fetch reactions" },
      { status: 500 }
    );
  }
}

// Add a reaction to a chronicles post
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug: postId } = await params;
    const { reaction_type } = await request.json();

    if (!postId) {
      return NextResponse.json(
        { error: "Post ID is required" },
        { status: 400 }
      );
    }

    if (!reaction_type) {
      return NextResponse.json(
        { error: "Reaction type is required" },
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

    // Create auth client with the user's token to validate identity
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

    // Verify post exists
    const { data: post, error: postError } = await supabase
      .from("chronicles_posts")
      .select("id")
      .eq("id", postId)
      .single();

    if (postError || !post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    // Get or create creator profile
    let { data: creator, error: creatorError } = await supabase
      .from("chronicles_creators")
      .select("id")
      .eq("user_id", user.id)
      .single();

    if (!creator) {
      // Create a creator profile
      const { data: newCreator, error: createError } = await supabase
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

      if (createError) {
        console.error("Error creating creator:", createError);
        return NextResponse.json(
          { error: "Failed to create creator profile" },
          { status: 500 }
        );
      }

      creator = newCreator;
    }

    // Check if user already has this reaction type for this post
    const { data: existingReaction } = await supabase
      .from("chronicles_post_reactions")
      .select("id, reaction_type")
      .eq("post_id", postId)
      .eq("creator_id", creator!.id)
      .single();

    // If user already has a different reaction, update it; if same, return existing
    if (existingReaction) {
      if (existingReaction.reaction_type === reaction_type) {
        // User already has this reaction
        return NextResponse.json(
          {
            success: true,
            message: "Reaction already exists",
            reaction: existingReaction,
          },
          { status: 200 }
        );
      } else {
        // Update the reaction type
        const { data: updated, error: updateError } = await supabase
          .from("chronicles_post_reactions")
          .update({ reaction_type })
          .eq("id", existingReaction.id)
          .select()
          .single();

        if (updateError) {
          console.error("Error updating reaction:", updateError);
          return NextResponse.json(
            { error: "Failed to update reaction" },
            { status: 500 }
          );
        }

        return NextResponse.json(
          {
            success: true,
            message: "Reaction updated",
            reaction: updated,
          },
          { status: 200 }
        );
      }
    }

    // Create new reaction
    const { data: reaction, error: reactionError } = await supabase
      .from("chronicles_post_reactions")
      .insert([
        {
          post_id: postId,
          creator_id: creator.id,
          reaction_type,
        },
      ])
      .select()
      .single();

    if (reactionError) {
      console.error("Error creating reaction:", reactionError);
      // Check if it's a UNIQUE constraint violation
      if (
        reactionError.message.includes("unique") ||
        reactionError.message.includes("duplicate")
      ) {
        return NextResponse.json(
          { error: "You have already reacted to this post" },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create reaction" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        reaction,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error in POST reaction:", error);
    return NextResponse.json(
      { error: "Failed to create reaction" },
      { status: 500 }
    );
  }
}
