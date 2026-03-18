import { type NextRequest, NextResponse } from "next/server"
import { createSupabaseServer } from "@/lib/supabase-server"
import { createClient } from "@supabase/supabase-js"
import { getAvatarProxyUrlWithBucket } from "@/lib/avatar-proxy"

function getPublicAvatarUrl(avatarUrl: string | null, bucket: string): string | null {
  if (!avatarUrl) return null
  // If it's already a full URL with http, return as-is
  if (avatarUrl.startsWith('http')) return avatarUrl
  // If URL already contains bucket path structure, return as-is
  if (avatarUrl.includes('/object/public/')) return avatarUrl
  
  // For relative paths, construct full Supabase URL with bucket
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  
  // Check if avatarUrl already starts with bucket name
  if (avatarUrl.includes(bucket)) {
    // URL like: "avatars/avatar-xxx.png"
    return `${supabaseUrl}/storage/v1/object/public/${avatarUrl}`
  } else if (bucket && !avatarUrl.includes('/')) {
    // Bare filename, need to add bucket and path
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${avatarUrl}`
  } else {
    // Already has path structure, just ensure bucket
    return `${supabaseUrl}/storage/v1/object/public/${bucket}/${avatarUrl.replace(/^\/+/, '')}`
  }
}

export async function OPTIONS() {
  const response = new NextResponse(null, { status: 200 })
  response.headers.set('Access-Control-Allow-Origin', '*')
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  return response
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServer()
    const authHeader = request.headers.get("authorization")

    // Get current user if authenticated
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
      } catch (err) {
        console.error("Token verification error:", err)
      }
    }

    console.log("Feed API - Auth header present:", !!authHeader)
    console.log("Feed API - Authenticated user:", userId)

    // Fetch admin posts with likes count
    const { data: adminPosts, error: adminError } = await supabase
      .from("posts")
      .select(`
        id,
        title,
        content,
        excerpt,
        type,
        featured,
        reading_time,
        tags,
        view_count,
        created_at,
        published_at,
        admin:admin!admin_id(id, username, full_name, avatar_url)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)

    if (adminError) {
      console.error("Admin posts error:", adminError)
    }

    // Get likes count for admin posts
    const adminPostIds = adminPosts?.map(post => post.id) || []
    const adminLikesCounts = new Map()
    if (adminPostIds.length > 0) {
      const { data: adminReactions } = await supabase
        .from("reactions")
        .select("post_id, reaction_type")
        .in("post_id", adminPostIds)
        .eq("reaction_type", "like")

      if (adminReactions) {
        adminReactions.forEach(reaction => {
          adminLikesCounts.set(reaction.post_id, (adminLikesCounts.get(reaction.post_id) || 0) + 1)
        })
      }
    }

    // Process admin posts - use avatar proxy like whispr wall does for reliable loading
    const processedAdminPosts = adminPosts?.map(post => ({
      ...post,
      author: {
        ...post.admin,
        avatar_url: post.admin?.avatar_url ? getAvatarProxyUrlWithBucket(post.admin?.avatar_url, 'avatars') : null
      },
      likesCount: adminLikesCounts.get(post.id) || 0
    }))

    // Fetch chronicles posts
    const { data: chroniclesPosts, error: chroniclesError } = await supabase
      .from("chronicles_posts")
      .select(`
        id,
        title,
        content,
        excerpt,
        cover_image_url,
        post_type,
        category,
        tags,
        likes_count,
        comments_count,
        shares_count,
        views_count,
        published_at,
        creator:chronicles_creators!creator_id(id, pen_name, profile_image_url, user_id)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)

    if (chroniclesError) {
      console.error("Chronicles posts error:", chroniclesError)
    }

    // Process chronicles posts to use avatar proxy for reliable loading
    const processedChroniclesPosts = chroniclesPosts?.map(post => ({
      ...post,
      author: {
        ...post.creator,
        avatar_url: post.creator?.profile_image_url ? getAvatarProxyUrlWithBucket(post.creator?.profile_image_url, 'chronicles-profiles') : null
      }
    }))

    // Combine and format posts
    const formattedPosts = []

    // Format admin posts
    if (processedAdminPosts) {
      processedAdminPosts.forEach(post => {
        formattedPosts.push({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          type: post.type,
          source: "admin",
          featured: post.featured,
          readingTime: post.reading_time,
          tags: post.tags,
          viewCount: post.view_count,
          likesCount: post.likesCount,
          createdAt: post.created_at,
          publishedAt: post.published_at,
          author: {
            id: post.admin?.id || "admin",
            name: post.admin?.full_name || "Whispr Admin",
            username: post.admin?.username || "admin",
            avatar_url: post.author?.avatar_url, // Use processed avatar
            type: "admin"
          }
        })
      })
    }

    // Format chronicles posts
    if (processedChroniclesPosts) {
      processedChroniclesPosts.forEach(post => {
        formattedPosts.push({
          id: post.id,
          title: post.title,
          content: post.content,
          excerpt: post.excerpt,
          type: post.post_type,
          source: "creator",
          featured: false,
          readingTime: Math.ceil(post.content?.length / 200) || 1, // Rough estimate
          tags: post.tags,
          viewCount: post.views_count,
          likesCount: post.likes_count,
          coverImageUrl: post.cover_image_url,
          createdAt: post.published_at,
          publishedAt: post.published_at,
          author: {
            id: post.creator?.id,
            name: post.creator?.pen_name,
            username: post.creator?.pen_name?.toLowerCase().replace(/\s+/g, ''),
            avatar_url: post.author?.avatar_url, // Use processed avatar
            type: "creator"
          }
        })
      })
    }

    // Sort combined posts by published date
    formattedPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    // Get user reactions for authenticated users
    let userReactions = new Map()
    if (userId) {
      const postIds = formattedPosts.map(post => post.id)
      console.log("Fetching reactions for user:", userId, "posts:", postIds)
      
      // Get reactions for admin posts
      const { data: adminReactions, error: adminReactionsError } = await supabase
        .from("reactions")
        .select("post_id, reaction_type, user_id")
        .eq("user_id", userId)
        .in("post_id", postIds)

      if (adminReactionsError) {
        console.error("Admin reactions fetch error:", adminReactionsError)
      }

      console.log("Admin reactions found:", adminReactions)

      if (adminReactions) {
        adminReactions.forEach(reaction => {
          userReactions.set(reaction.post_id, reaction.reaction_type)
        })
      }

      // Get creator_id for the current user
      const { data: creator, error: creatorError } = await supabase
        .from("chronicles_creators")
        .select("id")
        .eq("user_id", userId)
        .single()

      if (creatorError) {
        console.log("No creator found for user:", userId)
      }

      if (creator) {
        console.log("Found creator:", creator.id)
        // Get reactions for chronicles posts
        const { data: chroniclesReactions, error: chroniclesError } = await supabase
          .from("chronicles_engagement")
          .select("post_id, engagement_type, user_id")
          .eq("user_id", creator.id)
          .eq("engagement_type", "like")
          .in("post_id", postIds)

        if (chroniclesError) {
          console.error("Chronicles reactions fetch error:", chroniclesError)
        }

        console.log("Chronicles reactions found:", chroniclesReactions)

        if (chroniclesReactions) {
          chroniclesReactions.forEach(reaction => {
            userReactions.set(reaction.post_id, reaction.engagement_type)
          })
        }
      }
    }

    console.log("Final user reactions map:", Object.fromEntries(userReactions))

    // Add user reaction data to posts
    const postsWithReactions = formattedPosts.map(post => ({
      ...post,
      userReaction: userReactions.get(post.id) || null
    }))

    console.log("Feed API response:", { success: true, posts: postsWithReactions.slice(0, 20) })

    const response = NextResponse.json({
      success: true,
      posts: postsWithReactions.slice(0, 20)
    })
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  } catch (error) {
    console.error("Feed API error:", error)
    const response = NextResponse.json(
      { error: "Failed to fetch feed", success: false },
      { status: 500 }
    )
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
    return response
  }
}