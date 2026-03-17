import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { getAvatarProxyUrlWithBucket } from "@/lib/avatar-proxy"

export async function GET(req: NextRequest) {
  const supabase = createSupabaseServer()

  // Get wall posts with admin info
  const { data: wallPosts, error: wallError } = await supabase
    .from("whispr_wall")
    .select(`
      *,
      admin:admin!admin_id(id, username, full_name, avatar_url)
    `)
    .order("created_at", { ascending: false })

  if (wallError) {
    return NextResponse.json({ error: wallError.message, success: false }, { status: 500 })
  }

  // Get wall comments with admin responses
  const { data: wallComments, error: commentsError } = await supabase
    .from("wall_comments")
    .select("*")
    .order("created_at", { ascending: false })

  if (commentsError) {
    console.warn("Error fetching wall comments:", commentsError)
  }

  // Get wall reactions
  const { data: wallReactions, error: reactionsError } = await supabase
    .from("wall_reactions")
    .select("*")
    .order("created_at", { ascending: false })

  if (reactionsError) {
    console.warn("Error fetching wall reactions:", reactionsError)
  }

  // Process wall posts to fix avatar URLs and format responses
  const processedPosts = wallPosts?.map(post => {
    // Find comments for this post
    const postComments = wallComments?.filter(comment => comment.wall_id === post.id) || []

    // Find reactions for this post
    const postReactions = wallReactions?.filter(reaction => reaction.wall_id === post.id) || []

    // Count reactions by type
    const reactionCounts = postReactions.reduce((acc, reaction) => {
      acc[reaction.reaction_type] = (acc[reaction.reaction_type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      ...post,
      admin: post.admin ? {
        ...post.admin,
        avatar_url: post.admin.avatar_url
          ? getAvatarProxyUrlWithBucket(post.admin.avatar_url, 'avatars')
          : null
      } : null,
      // Format the response if it exists
      responses: post.response ? [{
        id: post.id,
        content: post.response,
        created_at: post.created_at,
        is_admin: true,
        admin: post.admin ? {
          ...post.admin,
          avatar_url: post.admin.avatar_url
            ? getAvatarProxyUrlWithBucket(post.admin.avatar_url, 'avatars')
            : null
        } : null
      }] : [],
      // Include comments with processed admin avatars
      comments: postComments.map(comment => ({
        ...comment,
        admin: null // Comments don't have admin info in this schema
      })),
      // Include reaction counts
      reactions: reactionCounts,
      total_reactions: postReactions.length
    }
  }) || []

  return NextResponse.json({
    success: true,
    posts: processedPosts,
    total_posts: processedPosts.length,
    total_comments: wallComments?.length || 0,
    total_reactions: wallReactions?.length || 0
  })
}

export async function POST(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { content } = await req.json()

  if (!content) {
    return NextResponse.json({ error: "Content is required" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("whispr_wall")
    .insert({ content })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Create a notification for the admin
  await supabase.from("notifications").insert({
    type: "whispr_wall",
    title: "🧱 New Anonymous Post",
    message: content.slice(0, 200) + "...",
  })

  return NextResponse.json(data)
}

// Handle responses to wall posts
export async function PUT(req: NextRequest) {
  const supabase = createSupabaseServer()
  const { postId, content, isAdmin = false, adminId } = await req.json()

  if (!postId || !content) {
    return NextResponse.json({ error: "Post ID and content are required" }, { status: 400 })
  }

  // Update the wall post with the response
  const updateData: any = {
    response: content,
  }

  if (isAdmin && adminId) {
    updateData.admin_id = adminId
  }

  const { data, error } = await supabase
    .from("whispr_wall")
    .update(updateData)
    .eq("id", postId)
    .select(`
      *,
      admin:admin!admin_id(id, username, full_name, avatar_url)
    `)
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Process the response - use avatar proxy for reliable loading
  const processedData = {
    id: data.id,
    content: data.response,
    created_at: data.created_at,
    is_admin: true,
    admin: data.admin ? {
      ...data.admin,
      avatar_url: data.admin.avatar_url
        ? getAvatarProxyUrlWithBucket(data.admin.avatar_url, 'avatars')
        : null
    } : null
  }

  return NextResponse.json(processedData)
}
