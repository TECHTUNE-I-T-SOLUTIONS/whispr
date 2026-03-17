import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const postId = searchParams.get("post_id")
  const userIp = request.headers.get("x-forwarded-for") || "unknown"
  const authHeader = request.headers.get("authorization")

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServer()

    // Check if user is authenticated
    let userId: string | null = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        )
        const { data: { user }, error } = await client.auth.getUser(token)
        if (!error && user) {
          userId = user.id
        }
      } catch (error) {
        console.warn("Token validation failed:", error)
      }
    }

    // Determine if this is an admin post or chronicles post
    const { data: adminPost } = await supabase
      .from("posts")
      .select("id")
      .eq("id", postId)
      .single()

    const isAdminPost = !!adminPost

    let allReactions: any[] = []
    let userReaction: string | null = null

    if (isAdminPost) {
      // Handle admin post reactions
      const { data: reactions, error: allError } = await supabase
        .from("reactions")
        .select("reaction_type, user_ip, user_id")
        .eq("post_id", postId)

      if (allError) {
        console.error("Error fetching admin reactions:", allError)
        return NextResponse.json({ error: allError.message }, { status: 500 })
      }

      allReactions = reactions || []

      // Count reactions and check user reaction
      const reactionCounts: Record<string, number> = {}
      for (const reaction of allReactions) {
        const type = reaction.reaction_type
        reactionCounts[type] = (reactionCounts[type] || 0) + 1

        // Check if this user has reacted
        if (userId && reaction.user_id === userId) {
          userReaction = type
        } else if (!userId && reaction.user_ip === userIp) {
          userReaction = type
        }
      }

      return NextResponse.json({
        reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
        userReaction,
      })
    } else {
      // Handle chronicles post reactions
      const { data: engagements, error: engagementError } = await supabase
        .from("chronicles_engagement")
        .select("engagement_type, user_id")
        .eq("post_id", postId)
        .eq("engagement_type", "like")

      if (engagementError) {
        console.error("Error fetching chronicles reactions:", engagementError)
        return NextResponse.json({ error: engagementError.message }, { status: 500 })
      }

      // For chronicles, we need to check if the current user has liked
      if (userId) {
        const userEngagement = engagements?.find(e => e.user_id === userId)
        if (userEngagement) {
          userReaction = userEngagement.engagement_type
        }
      }

      // Count likes for chronicles posts
      const likeCount = engagements?.length || 0

      return NextResponse.json({
        reactions: [{ type: "like", count: likeCount }],
        userReaction,
      })
    }
  } catch (error) {
    console.error("GET API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { post_id, reaction_type } = await request.json()
    const userIp = request.headers.get("x-forwarded-for") || "unknown"
    const authHeader = request.headers.get("authorization")

    const validReactions = ["like", "love", "smile", "wow", "star"]
    if (!post_id || !reaction_type || !validReactions.includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid post ID or reaction type" }, { status: 400 })
    }

    const supabase = createSupabaseServer()

    // Check if user is authenticated
    let userId: string | null = null
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7)
      try {
        const client = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          {
            global: {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            },
          }
        )
        const { data: { user }, error } = await client.auth.getUser(token)
        if (!error && user) {
          userId = user.id
        }
      } catch (error) {
        console.warn("Token validation failed:", error)
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    // Determine if this is an admin post or chronicles post
    const { data: adminPost } = await supabase
      .from("posts")
      .select("id")
      .eq("id", post_id)
      .single()

    const isAdminPost = !!adminPost

    if (isAdminPost) {
      console.log("Handling admin post reaction:", { post_id, reaction_type, userId })
      // Handle admin post reactions
      // Check if user already reacted to this post
      const { data: existing, error: fetchError } = await supabase
        .from("reactions")
        .select("*")
        .eq("post_id", post_id)
        .eq("user_id", userId)
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Fetch error:", fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      console.log("Existing reaction:", existing)

      if (existing) {
        if (existing.reaction_type === reaction_type) {
          // Same reaction — remove it
          const { error: deleteError } = await supabase
            .from("reactions")
            .delete()
            .eq("id", existing.id)

          if (deleteError) {
            console.error("Delete error:", deleteError)
            return NextResponse.json({ error: deleteError.message }, { status: 500 })
          }

          console.log("Removed reaction for post:", post_id)
          return NextResponse.json({ action: "removed" })
        } else {
          // Different reaction — update it
          const { error: updateError } = await supabase
            .from("reactions")
            .update({ reaction_type })
            .eq("id", existing.id)

          if (updateError) {
            console.warn("Update failed, falling back to insert. Reason:", updateError.message)

            // Delete old row to prevent constraint violation
            await supabase.from("reactions").delete().eq("id", existing.id)

            const { error: fallbackInsertError } = await supabase
              .from("reactions")
              .insert({ post_id, user_id: userId, reaction_type })

            if (fallbackInsertError) {
              console.error("Insert fallback error:", fallbackInsertError)
              return NextResponse.json({ error: fallbackInsertError.message }, { status: 500 })
            }

            console.log("Updated reaction for post:", post_id, "to:", reaction_type)
            return NextResponse.json({ action: "updated" })
          }

          console.log("Updated reaction for post:", post_id, "to:", reaction_type)
          return NextResponse.json({ action: "updated" })
        }
      }

      // No previous reaction — insert new one
      const { error: insertError } = await supabase
        .from("reactions")
        .insert({ post_id, user_id: userId, reaction_type })

      if (insertError) {
        console.error("Insert error:", insertError)
        return NextResponse.json({ error: insertError.message }, { status: 500 })
      }

      console.log("Added reaction for post:", post_id, "type:", reaction_type)
      return NextResponse.json({ action: "added" })
    } else {
      // Handle chronicles post reactions
      // Get creator ID for the user
      const { data: creator, error: creatorError } = await supabase
        .from("chronicles_creators")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (creatorError) {
        return NextResponse.json({ error: "Creator profile required" }, { status: 400 })
      }

      // Check if user already engaged with this post
      const { data: existing, error: fetchError } = await supabase
        .from("chronicles_engagement")
        .select("*")
        .eq("post_id", post_id)
        .eq("creator_id", creator.id)
        .eq("engagement_type", "like")
        .single()

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Fetch chronicles engagement error:", fetchError)
        return NextResponse.json({ error: fetchError.message }, { status: 500 })
      }

      if (existing) {
        // User already liked — remove it
        const { error: deleteError } = await supabase
          .from("chronicles_engagement")
          .delete()
          .eq("id", existing.id)

        if (deleteError) {
          console.error("Delete chronicles engagement error:", deleteError)
          return NextResponse.json({ error: deleteError.message }, { status: 500 })
        }

        // Update likes count
        const { error: decrementError } = await supabase
          .from("chronicles_posts")
          .update({ likes_count: supabase.raw('likes_count - 1') })
          .eq("id", post_id)

        if (decrementError) {
          console.error("Decrement likes count error:", decrementError)
        }

        return NextResponse.json({ action: "removed" })
      } else {
        // Add new like
        const { error: insertError } = await supabase
          .from("chronicles_engagement")
          .insert({
            post_id,
            creator_id: creator.id,
            engagement_type: "like"
          })

        if (insertError) {
          console.error("Insert chronicles engagement error:", insertError)
          return NextResponse.json({ error: insertError.message }, { status: 500 })
        }

        // Update likes count
        const { error: incrementError } = await supabase
          .from("chronicles_posts")
          .update({ likes_count: supabase.raw('likes_count + 1') })
          .eq("id", post_id)

        if (incrementError) {
          console.error("Increment likes count error:", incrementError)
        }

        return NextResponse.json({ action: "added" })
      }
    }
  } catch (error) {
    console.error("POST API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
