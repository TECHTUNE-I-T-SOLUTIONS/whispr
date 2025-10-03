import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
<<<<<<< HEAD
  const postId = searchParams.get("postId")
=======
  const postId = searchParams.get("post_id")
  const userIp = request.headers.get("x-forwarded-for") || "unknown"
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613

  if (!postId) {
    return NextResponse.json({ error: "Post ID is required" }, { status: 400 })
  }

  try {
    const supabase = createSupabaseServer()
<<<<<<< HEAD
    const { data, error } = await supabase.from("reactions").select("reaction_type").eq("post_id", postId)

    if (error) {
      console.error("Database error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Count reactions by type
    const reactionCounts = data.reduce((acc: Record<string, number>, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
      return acc
    }, {})

    return NextResponse.json(reactionCounts)
  } catch (error) {
    console.error("API error:", error)
=======

    // Fetch all reactions for the post
    const { data: allReactions, error: allError } = await supabase
      .from("reactions")
      .select("reaction_type, user_ip")
      .eq("post_id", postId)

    if (allError) {
      console.error("Error fetching reactions:", allError)
      return NextResponse.json({ error: allError.message }, { status: 500 })
    }

    // Count all reactions
    const reactionCounts: Record<string, number> = {}
    let userReaction: string | null = null

    for (const reaction of allReactions) {
      const type = reaction.reaction_type
      reactionCounts[type] = (reactionCounts[type] || 0) + 1

      if (reaction.user_ip === userIp) {
        userReaction = type
      }
    }

    return NextResponse.json({
      reactions: Object.entries(reactionCounts).map(([type, count]) => ({ type, count })),
      userReaction,
    })
  } catch (error) {
    console.error("GET API error:", error)
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
<<<<<<< HEAD
    const { postId, reactionType } = await request.json()
    const userIp = request.headers.get("x-forwarded-for") || "unknown"

    if (!postId || !reactionType) {
      return NextResponse.json({ error: "Post ID and reaction type are required" }, { status: 400 })
=======
    const { post_id, reaction_type } = await request.json()
    const userIp = request.headers.get("x-forwarded-for") || "unknown"

    const validReactions = ["like", "love", "smile", "wow", "star"]
    if (!post_id || !reaction_type || !validReactions.includes(reaction_type)) {
      return NextResponse.json({ error: "Invalid post ID or reaction type" }, { status: 400 })
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    }

    const supabase = createSupabaseServer()

<<<<<<< HEAD
    // Check if user already reacted with this type
    const { data: existing } = await supabase
      .from("reactions")
      .select("id")
      .eq("post_id", postId)
      .eq("user_ip", userIp)
      .eq("reaction_type", reactionType)
      .single()

    if (existing) {
      // Remove reaction if it already exists
      const { error } = await supabase.from("reactions").delete().eq("id", existing.id)

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ action: "removed" })
    } else {
      // Add new reaction
      const { error } = await supabase.from("reactions").insert({
        post_id: postId,
        user_ip: userIp,
        reaction_type: reactionType,
      })

      if (error) {
        console.error("Database error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ action: "added" })
    }
  } catch (error) {
    console.error("API error:", error)
=======
    // Check if user already reacted to this post
    const { data: existing, error: fetchError } = await supabase
      .from("reactions")
      .select("*")
      .eq("post_id", post_id)
      .eq("user_ip", userIp)
      .single()

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Fetch error:", fetchError)
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

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

        return NextResponse.json({ action: "removed" })
      } else {
        // Different reaction — try update
        const { error: updateError } = await supabase
          .from("reactions")
          .update({ reaction_type })
          .eq("id", existing.id)

        if (updateError) {
          console.warn("Update failed, falling back to insert. Reason:", updateError.message)

          // Optional: delete old row to prevent constraint violation
          await supabase.from("reactions").delete().eq("id", existing.id)

          const { error: fallbackInsertError } = await supabase
            .from("reactions")
            .insert({ post_id, user_ip: userIp, reaction_type })

          if (fallbackInsertError) {
            console.error("Insert fallback error:", fallbackInsertError)
            return NextResponse.json({ error: fallbackInsertError.message }, { status: 500 })
          }

          return NextResponse.json({ action: "updated" })
        }

        return NextResponse.json({ action: "updated" })
      }
    }

    // No previous reaction — insert new one
    const { error: insertError } = await supabase
      .from("reactions")
      .insert({ post_id, user_ip: userIp, reaction_type })

    if (insertError) {
      console.error("Insert error:", insertError)
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    return NextResponse.json({ action: "added" })
  } catch (error) {
    console.error("POST API error:", error)
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
