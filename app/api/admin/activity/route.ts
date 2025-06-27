import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

interface Activity {
  id: string;
  type: string;
  title: string;
  description: string;
  timestamp: string;
  metadata: Record<string, any>;
}

interface Post {
  id: string;
  title: string;
  type: string;
  created_at: string;
  status: string;
}

interface CommentWithPost {
  id: string;
  content: string;
  author_name: string;
  created_at: string;
  posts: {
    title: string;
    type: string;
  } | null;
}

interface ReactionWithPost {
  id: string;
  reaction_type: string;
  created_at: string;
  posts: {
    title: string;
    type: string;
  } | null;
}

export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

    const activities: Activity[] = []

    // Get recent posts
  const { data: recentPosts } = await supabase
    .from("posts")
    .select("id, title, type, created_at, status")
    .order("created_at", { ascending: false })
    .limit(3) as unknown as { data: Post[] };


    if (recentPosts) {
      recentPosts.forEach((post) => {
        activities.push({
          id: `post-${post.id}`,
          type: "post_created",
          title: `New ${post.type} published`,
          description: post.title,
          timestamp: post.created_at,
          metadata: { postType: post.type, postId: post.id },
        })
      })
    }

    // Get recent comments
  const { data: recentComments } = await supabase
    .from("comments")
    .select(`
      id, 
      content, 
      author_name, 
      created_at,
      posts (
        title, 
        type
      )
    `)
    .order("created_at", { ascending: false })
    .limit(3) as unknown as { data: CommentWithPost[] };


    if (recentComments) {
      recentComments.forEach((comment) => {
        activities.push({
          id: `comment-${comment.id}`,
          type: "comment_received",
          title: `New comment from ${comment.author_name}`,
          description: `On "${comment.posts?.title}"`,
          timestamp: comment.created_at,
          metadata: { commentId: comment.id },
        })
      })
    }

    // Get recent reactions
  const { data: recentReactions } = await supabase
    .from("reactions")
    .select(`
      id,
      reaction_type,
      created_at,
      posts (
        title, 
        type
      )
    `)
    .order("created_at", { ascending: false })
    .limit(3) as unknown as { data: ReactionWithPost[] };


    if (recentReactions) {
      recentReactions.forEach((reaction) => {
        activities.push({
          id: `reaction-${reaction.id}`,
          type: "reaction_received",
          title: `Someone ${reaction.reaction_type}d your post`,
          description: `"${reaction.posts?.title}"`,
          timestamp: reaction.created_at,
          metadata: { reactionType: reaction.reaction_type },
        })
      })
    }

    // Sort all activities by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return NextResponse.json(activities.slice(0, 10))
  } catch (error) {
    console.error("Error fetching activity:", error)
    if (error instanceof Error && error.message === "Authentication required") {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
