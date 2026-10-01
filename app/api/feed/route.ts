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
    let creatorId: string | null = null
    let feedPreferences: any = null

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
          
          // Get creator_id
          const { data: creator } = await supabase
            .from("chronicles_creators")
            .select("id")
            .eq("user_id", userId)
            .single()
          
          if (creator) {
            creatorId = creator.id
            
            // Get feed preferences
            const { data: preferences } = await supabase
              .from("chronicles_feed_preferences")
              .select("*")
              .eq("creator_id", creatorId)
              .single()
            
            if (preferences) {
              feedPreferences = preferences
            }
          }
        }
      } catch (err) {
        console.error("Token verification error:", err)
      }
    }

    console.log("Feed API - Auth header present:", !!authHeader)
    console.log("Feed API - Authenticated user:", userId)
    console.log("Feed API - Feed preferences:", feedPreferences)

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
        slug,
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
    const processedAdminPosts = adminPosts?.map(post => {
      // Supabase returns relationship data - handle both object and array formats
      const adminData = Array.isArray((post as any).admin) ? (post as any).admin[0] : (post as any).admin
      return {
        ...post,
        author: {
          id: adminData?.id,
          name: adminData?.full_name || "Whispr Admin",
          username: adminData?.username || "admin",
          avatar_url: adminData?.avatar_url ? getAvatarProxyUrlWithBucket(adminData?.avatar_url, 'avatars') : null
        },
        likesCount: adminLikesCounts.get(post.id) || 0
      }
    })

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
        is_challenge_entry,
        creator:chronicles_creators!creator_id(id, pen_name, profile_image_url, user_id)
      `)
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(20)

    if (chroniclesError) {
      console.error("Chronicles posts error:", chroniclesError)
    }

    // Process chronicles posts to use avatar proxy for reliable loading
    const processedChroniclesPosts = chroniclesPosts?.map(post => {
      // Supabase returns relationship data - handle both object and array formats
      const creatorData = Array.isArray((post as any).creator) ? (post as any).creator[0] : (post as any).creator
      return {
        ...post,
        author: {
          id: creatorData?.id,
          name: creatorData?.pen_name || "Unknown Author",
          username: creatorData?.pen_name?.toLowerCase().replace(/\s+/g, '') || "unknown",
          avatar_url: creatorData?.profile_image_url ? getAvatarProxyUrlWithBucket(creatorData?.profile_image_url, 'chronicles-profiles') : null
        }
      }
    })

    // Fetch stories from view_all_stories
    const { data: feedStories, error: storiesError } = await supabase
      .from("view_all_stories")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false })
      .limit(10)

    if (storiesError) {
      console.error("Stories feed error:", storiesError)
    }

    // Combine and format posts
    let formattedPosts: any[] = []

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
          slug: post.slug, // Include slug for proper routing
          createdAt: post.created_at,
          publishedAt: post.published_at,
          author: {
            id: post.author?.id || "admin",
            name: post.author?.name || "Whispr Admin",
            username: post.author?.username || "admin",
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
          is_challenge_entry: post.is_challenge_entry || false,
          author: {
            id: post.author?.id,
            name: post.author?.name,
            username: post.author?.username,
            avatar_url: post.author?.avatar_url, // Use processed avatar
            type: "creator"
          }
        })
      })
    }

    // Format stories
    if (feedStories) {
      feedStories.forEach(story => {
        formattedPosts.push({
          id: story.id,
          title: story.title,
          content: story.description || story.excerpt || "",
          excerpt: story.excerpt || story.description || "",
          type: "story",
          source: story.author_type === "admin" ? "admin" : "creator",
          featured: false,
          readingTime: story.chapters_count * 5 || 5,
          tags: story.tags || [],
          viewCount: story.views_count,
          likesCount: story.likes_count,
          coverImageUrl: story.cover_image_url,
          createdAt: story.published_at || story.created_at,
          publishedAt: story.published_at || story.created_at,
          slug: story.slug,
          author: {
            id: story.author_id,
            name: story.author_name,
            username: story.author_username,
            avatar_url: story.author_avatar ? getAvatarProxyUrlWithBucket(story.author_avatar, story.author_type === 'admin' ? 'avatars' : 'chronicles-profiles') : null,
            type: story.author_type === "admin" ? "admin" : "creator"
          }
        })
      })
    }

    // Sort combined posts by published date
    formattedPosts.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())

    // Apply feed algorithm preferences
    if (feedPreferences) {
      // Filter out blocked creators
      if (feedPreferences.blocked_creators && feedPreferences.blocked_creators.length > 0) {
        formattedPosts = formattedPosts.filter((post: any) => 
          !feedPreferences.blocked_creators.includes(post.author.id)
        )
      }

      // Filter adult content if disabled
      if (!feedPreferences.show_adult_content) {
        // Filter posts tagged as adult (you may need to add this field to your schema)
        // For now, this is a placeholder
      }

      // Apply sorting based on algorithm
      if (feedPreferences.feed_algorithm === 'trending') {
        // Sort by engagement (likes + views)
        formattedPosts.sort((a: any, b: any) => {
          const engagementA = (a.likesCount || 0) + (a.viewCount || 0)
          const engagementB = (b.likesCount || 0) + (b.viewCount || 0)
          return engagementB - engagementA
        })
      } else if (feedPreferences.feed_algorithm === 'chronological') {
        // Sort by published date (already done above, keeping for clarity)
        formattedPosts.sort((a: any, b: any) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime())
      } else if (feedPreferences.feed_algorithm === 'personalized' && creatorId) {
        // Prioritize followed creators and categories
        // First, boost posts from followed creators
        if (feedPreferences.followed_creators && feedPreferences.followed_creators.length > 0) {
          formattedPosts.sort((a: any, b: any) => {
            const aFollowed = feedPreferences.followed_creators.includes(a.author.id)
            const bFollowed = feedPreferences.followed_creators.includes(b.author.id)
            if (aFollowed && !bFollowed) return -1
            if (!aFollowed && bFollowed) return 1
            return 0
          })
        }

        // Then, prioritize categories the user follows
        if (feedPreferences.followed_categories && feedPreferences.followed_categories.length > 0) {
          formattedPosts.sort((a: any, b: any) => {
            const aCategoryMatch = a.tags && a.tags.some((tag: string) => feedPreferences.followed_categories.includes(tag))
            const bCategoryMatch = b.tags && b.tags.some((tag: string) => feedPreferences.followed_categories.includes(tag))
            if (aCategoryMatch && !bCategoryMatch) return -1
            if (!aCategoryMatch && bCategoryMatch) return 1
            return 0
          })
        }
      }
    }

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

      // creatorId is already fetched above
      if (creatorId) {
        console.log("Found creator:", creatorId)
        // Get reactions for chronicles posts
        const { data: chroniclesReactions, error: chroniclesError } = await supabase
          .from("chronicles_engagement")
          .select("post_id, engagement_type, user_id")
          .eq("user_id", creatorId)
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