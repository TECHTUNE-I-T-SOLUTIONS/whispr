import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { requireAuthFromRequest } from "@/lib/auth-server"

<<<<<<< HEAD
=======
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

>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
export async function GET(request: NextRequest) {
  try {
    await requireAuthFromRequest(request)
    const supabase = createSupabaseServer()

<<<<<<< HEAD
    const activities = []

    // Get recent posts
=======
    const activities: Activity[] = []

    // --- POSTS ---
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
    const { data: recentPosts } = await supabase
      .from("posts")
      .select("id, title, type, created_at, status")
      .order("created_at", { ascending: false })
<<<<<<< HEAD
      .limit(3)

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
        posts (title, type)
      `)
      .order("created_at", { ascending: false })
      .limit(3)

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
        posts (title, type)
      `)
      .order("created_at", { ascending: false })
      .limit(3)

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
=======
      .limit(3) as unknown as { data: Post[] };

    recentPosts?.forEach((post) => {
      activities.push({
        id: `post-${post.id}`,
        type: "post_created",
        title: `New ${post.type} published`,
        description: post.title,
        timestamp: post.created_at,
        metadata: { postType: post.type, postId: post.id },
      })
    })

    // --- COMMENTS ---
    const { data: recentComments } = await supabase
      .from("comments")
      .select(`id, content, author_name, created_at, posts (title, type)`)
      .order("created_at", { ascending: false })
      .limit(3) as unknown as { data: CommentWithPost[] };

    recentComments?.forEach((comment) => {
      activities.push({
        id: `comment-${comment.id}`,
        type: "comment_received",
        title: `New comment from ${comment.author_name}`,
        description: `On "${comment.posts?.title}"`,
        timestamp: comment.created_at,
        metadata: { commentId: comment.id },
      })
    })

    // --- REACTIONS ---
    const { data: recentReactions } = await supabase
      .from("reactions")
      .select(`id, reaction_type, created_at, posts (title, type)`)
      .order("created_at", { ascending: false })
      .limit(3) as unknown as { data: ReactionWithPost[] };

    recentReactions?.forEach((reaction) => {
      activities.push({
        id: `reaction-${reaction.id}`,
        type: "reaction_received",
        title: `Someone ${reaction.reaction_type}d your post`,
        description: `"${reaction.posts?.title}"`,
        timestamp: reaction.created_at,
        metadata: { reactionType: reaction.reaction_type },
      })
    })

    // --- WHISPR WALL ---
    const { data: recentWhisprWall } = await supabase
      .from("whispr_wall")
      .select("id, title, created_at")
      .order("created_at", { ascending: false })
      .limit(3);

    recentWhisprWall?.forEach((wall) => {
      activities.push({
        id: `whispr_wall-${wall.id}`,
        type: "whispr_wall_posted",
        title: `New anonymous post`,
        description: wall.title,
        timestamp: wall.created_at,
        metadata: { wallId: wall.id },
      })
    })

    // --- WALL COMMENTS ---
    const { data: recentWallComments } = await supabase
      .from("wall_comments")
      .select("id, content, created_at, wall_id")
      .order("created_at", { ascending: false })
      .limit(3);

    recentWallComments?.forEach((comment) => {
      activities.push({
        id: `wall_comment-${comment.id}`,
        type: "wall_comment_received",
        title: `Someone commented anonymously`,
        description: comment.content,
        timestamp: comment.created_at,
        metadata: { wallId: comment.wall_id, commentId: comment.id },
      })
    })

    // --- WALL REACTIONS ---
    const { data: recentWallReactions } = await supabase
      .from("wall_reactions")
      .select("id, reaction_type, created_at, wall_id")
      .order("created_at", { ascending: false })
      .limit(3);

    recentWallReactions?.forEach((reaction) => {
      activities.push({
        id: `wall_reaction-${reaction.id}`,
        type: "wall_reaction_received",
        title: `Someone reacted anonymously`,
        description: `Reaction: ${reaction.reaction_type}`,
        timestamp: reaction.created_at,
        metadata: { wallId: reaction.wall_id },
      })
    })

    // --- FINAL SORT ---
>>>>>>> 59f0d920bddfe9ac25a5be411ebc21f85ccff613
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
