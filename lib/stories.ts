import { createSupabaseServerClient } from './supabase-server-client'
import { createSupabaseBrowser } from './supabase-browser'

// Content moderation filter for family-friendly, high-quality guidelines
export function checkContentCompliance(...texts: string[]): { compliant: boolean; offendingWord?: string } {
  const bannedWords = [
    'sex', 'porn', 'pornographic', 'erotica', 'erotic', 'xxx', 'adult story',
    'adult stories', 'r-rated', 'nude', 'nudity', 'sensual story', 'sensual stories',
    'lust', 'lustful', 'orgasm', 'penis', 'vagina', 'intercourse', 'arousal', 'nsfw'
  ]
  
  for (const text of texts) {
    if (!text) continue
    const lowerText = text.toLowerCase()
    for (const word of bannedWords) {
      // Use boundary regex to match whole words or parts
      const regex = new RegExp(`\\b${word}\\b|${word}`, 'i')
      if (regex.test(lowerText)) {
        return { compliant: false, offendingWord: word }
      }
    }
  }
  return { compliant: true }
}

// Check if a client is in the browser or server context
function getSupabaseClient(customClient?: any) {
  if (customClient) return customClient
  if (typeof window !== 'undefined') {
    return createSupabaseBrowser()
  }
  // This will error if called from a server component without custom client,
  // so we always prefer passing the client from the server page/action.
  return null
}

// 1. PUBLIC STORY METADATA AND CHAPTER FETCHERS
export async function getPublishedStories(
  supabase: any,
  options?: {
    genre?: string
    hashtag?: string
    authorType?: 'admin' | 'chronicle'
    query?: string
    sortBy?: 'latest' | 'likes' | 'views'
    limit?: number
  }
) {
  let query = supabase
    .from('view_all_stories')
    .select('*')
    .eq('status', 'published')

  if (options?.genre && options.genre !== 'all') {
    query = query.eq('genre', options.genre)
  }

  if (options?.authorType) {
    query = query.eq('author_type', options.authorType)
  }

  if (options?.query) {
    const q = options.query.trim()
    query = query.or(`title.ilike.%${q}%,description.ilike.%${q}%,excerpt.ilike.%${q}%,author_name.ilike.%${q}%`)
  }

  if (options?.hashtag) {
    query = query.contains('hashtags', [options.hashtag])
  }

  const sort = options?.sortBy || 'latest'
  if (sort === 'likes') {
    query = query.order('likes_count', { ascending: false })
  } else if (sort === 'views') {
    query = query.order('views_count', { ascending: false })
  } else {
    query = query.order('published_at', { ascending: false })
  }

  if (options?.limit) {
    query = query.limit(options.limit)
  }

  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch published stories:', error)
    return []
  }
  return data || []
}

export async function getStoryBySlug(supabase: any, slug: string) {
  const { data, error } = await supabase
    .from('view_all_stories')
    .select('*')
    .eq('slug', slug)
    .single()

  if (error) {
    console.error('Failed to get story by slug:', error)
    return null
  }
  return data
}

export async function getStoryChapters(supabase: any, storyId: string, authorType: 'admin' | 'chronicle', includeDrafts = false) {
  const table = authorType === 'admin' ? 'admin_story_chapters' : 'chronicles_story_chapters'
  let query = supabase
    .from(table)
    .select('*')
    .eq('story_id', storyId)
    .order('sequence', { ascending: true })

  if (!includeDrafts) {
    query = query.eq('status', 'published')
  }

  const { data, error } = await query
  if (error) {
    console.error('Failed to fetch chapters:', error)
    return []
  }
  return data || []
}

export async function getChapterBySlugs(supabase: any, storySlug: string, chapterSlug: string) {
  // Fetch story outline first
  const story = await getStoryBySlug(supabase, storySlug)
  if (!story) return null

  const table = story.author_type === 'admin' ? 'admin_story_chapters' : 'chronicles_story_chapters'
  const { data: chapter, error } = await supabase
    .from(table)
    .select('*')
    .eq('story_id', story.id)
    .eq('slug', chapterSlug)
    .single()

  if (error || !chapter) {
    console.error('Failed to fetch chapter:', error)
    return null
  }

  // Record a view for the story if it is a published reader page
  if (chapter.status === 'published' && story.status === 'published') {
    const storyTable = story.author_type === 'admin' ? 'admin_stories' : 'chronicles_stories'
    try {
      const { error: rpcError } = await supabase.rpc('increment_story_views', { story_id: story.id, story_type: story.author_type })
      if (rpcError) throw rpcError
    } catch {
      // Fallback standard update
      await supabase.from(storyTable).update({ views_count: (story.views_count || 0) + 1 }).eq('id', story.id)
    }
  }

  // Get adjacent chapters for reader navigation
  const allChapters = await getStoryChapters(supabase, story.id, story.author_type, false)
  const currentIndex = allChapters.findIndex((c: any) => c.id === chapter.id)
  
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null

  return {
    story,
    chapter,
    allChapters,
    prevChapterSlug: prevChapter?.slug || null,
    nextChapterSlug: nextChapter?.slug || null,
  }
}

// Increment story view count RPC alternative
// Ensure you have standard fallback client logic

// 2. ENGAGEMENT LOGICS (LIKES, COMMENTS, SHARES)
export async function getStoryLikeStatus(supabase: any, storyId: string, userId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_likes' : 'chronicles_story_likes'
  const { data, error } = await supabase
    .from(table)
    .select('id')
    .eq('story_id', storyId)
    .eq('user_id', userId)
    .single()

  if (error || !data) return false
  return true
}

export async function likeStory(supabase: any, storyId: string, userId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_likes' : 'chronicles_story_likes'
  const { data, error } = await supabase
    .from(table)
    .insert([{ story_id: storyId, user_id: userId }])
    .select()

  if (error) {
    console.error('Failed to like story:', error)
    return { success: false, error }
  }
  return { success: true, data }
}

export async function unlikeStory(supabase: any, storyId: string, userId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_likes' : 'chronicles_story_likes'
  const { error } = await supabase
    .from(table)
    .delete()
    .eq('story_id', storyId)
    .eq('user_id', userId)

  if (error) {
    console.error('Failed to unlike story:', error)
    return { success: false, error }
  }
  return { success: true }
}

export async function getStoryComments(supabase: any, storyId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_comments' : 'chronicles_story_comments'
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('story_id', storyId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }

  // Map to flat or hierarchy if needed by frontend
  return data || []
}

export async function addStoryComment(
  supabase: any,
  params: {
    storyId: string
    commenterName: string
    commenterEmail?: string
    content: string
    authorType: 'admin' | 'chronicle'
    userId?: string
    creatorId?: string
    parentCommentId?: string
  }
) {
  const compliance = checkContentCompliance(params.content, params.commenterName)
  if (!compliance.compliant) {
    throw new Error(`Your comment contains inappropriate content (words similar to "${compliance.offendingWord}"). Please keep Whispr creative and family-friendly.`)
  }

  const table = params.authorType === 'admin' ? 'admin_story_comments' : 'chronicles_story_comments'
  const payload: any = {
    story_id: params.storyId,
    commenter_name: params.commenterName,
    content: params.content,
    parent_comment_id: params.parentCommentId || null,
    status: 'approved' // Auto approve by default unless custom checks fail
  }

  if (params.authorType === 'admin') {
    payload.user_id = params.userId || null
    payload.commenter_email = params.commenterEmail || null
  } else {
    payload.user_id = params.userId || null
    payload.creator_id = params.creatorId || null
  }

  const { data, error } = await supabase
    .from(table)
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Failed to post comment:', error)
    return { success: false, error }
  }
  return { success: true, data }
}

// ============================================================
// 2b. CHAPTER-LEVEL COMMENTS & REACTIONS
// ============================================================

// Fetch chapter-level comments
export async function getChapterComments(supabase: any, chapterId: string, storyId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_chapter_comments' : 'chronicles_story_chapter_comments'
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('chapter_id', chapterId)
    .eq('story_id', storyId)
    .eq('status', 'approved')
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Failed to fetch chapter comments:', error)
    return []
  }

  return data || []
}

// Add a chapter-level comment (supports guest commenters with cached name/email)
export async function addChapterComment(
  supabase: any,
  params: {
    chapterId: string
    storyId: string
    commenterName: string
    commenterEmail?: string
    content: string
    authorType: 'admin' | 'chronicle'
    userId?: string
    creatorId?: string
    parentCommentId?: string
  }
) {
  const compliance = checkContentCompliance(params.content, params.commenterName)
  if (!compliance.compliant) {
    throw new Error(`Your comment contains inappropriate content (words similar to "${compliance.offendingWord}"). Please keep Whispr creative and family-friendly.`)
  }

  const table = params.authorType === 'admin' ? 'admin_story_chapter_comments' : 'chronicles_story_chapter_comments'
  const payload: any = {
    chapter_id: params.chapterId,
    story_id: params.storyId,
    commenter_name: params.commenterName,
    commenter_email: params.commenterEmail || null,
    content: params.content,
    parent_comment_id: params.parentCommentId || null,
    status: 'approved'
  }

  if (params.authorType === 'admin') {
    payload.user_id = params.userId || null
  } else {
    payload.user_id = params.userId || null
    payload.creator_id = params.creatorId || null
  }

  const { data, error } = await supabase
    .from(table)
    .insert([payload])
    .select()
    .single()

  if (error) {
    console.error('Failed to post chapter comment:', error)
    return { success: false, error }
  }
  return { success: true, data }
}

// Get chapter reaction (like/dislike) status for a user (supports both user_id and user_ip for anonymous)
export async function getChapterReactionStatus(supabase: any, chapterId: string, storyId: string, authorType: 'admin' | 'chronicle', userId?: string, userIp?: string) {
  const table = authorType === 'admin' ? 'admin_story_chapter_reactions' : 'chronicles_story_chapter_reactions'

  let query = supabase
    .from(table)
    .select('reaction_type')
    .eq('chapter_id', chapterId)
    .eq('story_id', storyId)

  if (userId) {
    query = query.eq('user_id', userId)
  } else if (userIp) {
    query = query.is('user_id', null).eq('user_ip', userIp)
  } else {
    return null
  }

  const { data, error } = await query.single()

  if (error || !data) return null
  return data.reaction_type
}

// Toggle chapter reaction (like/dislike) — supports both authenticated (user_id) and anonymous (user_ip) users
export async function toggleChapterReaction(
  supabase: any,
  chapterId: string,
  storyId: string,
  reactionType: 'like' | 'dislike',
  authorType: 'admin' | 'chronicle',
  userId?: string,
  userIp?: string,
  creatorId?: string
) {
  const table = authorType === 'admin' ? 'admin_story_chapter_reactions' : 'chronicles_story_chapter_reactions'

  // Build the lookup query based on identity
  let lookupQuery = supabase
    .from(table)
    .select('id, reaction_type')
    .eq('chapter_id', chapterId)
    .eq('story_id', storyId)

  if (userId) {
    lookupQuery = lookupQuery.eq('user_id', userId)
  } else if (userIp) {
    lookupQuery = lookupQuery.is('user_id', null).eq('user_ip', userIp)
  } else {
    return { success: false, error: 'No user identifier provided', action: 'none' }
  }

  const { data: existing } = await lookupQuery.single()

  if (existing) {
    // If same reaction type, remove it (toggle off)
    if (existing.reaction_type === reactionType) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', existing.id)
      if (error) return { success: false, error, action: 'none' }
      return { success: true, action: 'removed' }
    }
    // If different reaction type, update it
    const { error } = await supabase
      .from(table)
      .update({ reaction_type: reactionType })
      .eq('id', existing.id)
    if (error) return { success: false, error, action: 'none' }
    return { success: true, action: 'updated' }
  }

  // Create new reaction
  const payload: any = {
    chapter_id: chapterId,
    story_id: storyId,
    reaction_type: reactionType
  }

  if (userId) {
    payload.user_id = userId
  }
  if (!userId && userIp) {
    payload.user_ip = userIp
  }
  if (authorType === 'chronicle' && creatorId) {
    payload.creator_id = creatorId
  }

  const { error } = await supabase
    .from(table)
    .insert([payload])

  if (error) return { success: false, error, action: 'none' }
  return { success: true, action: 'liked' }
}

// Fetch chapter reaction counts (likes & dislikes)
export async function getChapterReactionCounts(supabase: any, chapterId: string, storyId: string, authorType: 'admin' | 'chronicle') {
  const table = authorType === 'admin' ? 'admin_story_chapter_reactions' : 'chronicles_story_chapter_reactions'

  const { count: likes, error: likesError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .eq('story_id', storyId)
    .eq('reaction_type', 'like')

  const { count: dislikes, error: dislikesError } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('chapter_id', chapterId)
    .eq('story_id', storyId)
    .eq('reaction_type', 'dislike')

  if (likesError || dislikesError) {
    console.error('Failed to fetch chapter reaction counts')
    return { likes: 0, dislikes: 0 }
  }

  return { likes: likes || 0, dislikes: dislikes || 0 }
}

export async function shareStory(supabase: any, storyId: string, sharedTo: string, authorType: 'admin' | 'chronicle', creatorId?: string) {
  const table = authorType === 'admin' ? 'admin_story_shares' : 'chronicles_story_shares'
  const payload: any = {
    story_id: storyId,
    shared_to: sharedTo,
    share_metadata: { user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Server' }
  }

  if (authorType === 'chronicle' && creatorId) {
    payload.creator_id = creatorId
  }

  const { data, error } = await supabase
    .from(table)
    .insert([payload])
    .select()

  if (error) {
    console.error('Failed to log share:', error)
    return { success: false, error }
  }
  return { success: true, data }
}

// 3. CENTRAL HASHTAGS UTILITIES
export async function getTopHashtags(supabase: any, limit = 10) {
  const { data, error } = await supabase
    .from('hashtags')
    .select('*')
    .limit(limit)

  if (error) return []
  return data || []
}

export async function createOrLinkHashtags(supabase: any, tags: string[]): Promise<string[]> {
  if (!tags || tags.length === 0) return []
  const ids: string[] = []

  for (const tag of tags) {
    const cleanTag = tag.trim().replace(/^#/, '').toLowerCase()
    if (!cleanTag) continue

    // Attempt to select tag first
    const { data: existing } = await supabase
      .from('hashtags')
      .select('id')
      .eq('name', cleanTag)
      .single()

    if (existing) {
      ids.push(existing.id)
    } else {
      // Create new
      const { data: inserted, error } = await supabase
        .from('hashtags')
        .insert([{ name: cleanTag }])
        .select('id')
        .single()

      if (inserted) ids.push(inserted.id)
    }
  }

  return ids
}

// 4. CREATOR & ADMIN ANALYTICS METRICS
export async function fetchStoryMetrics(supabase: any, creatorIdOrAdmin: string, authorType: 'admin' | 'chronicle') {
  // Aggregate views, likes, comments, and shares across all author's stories
  const storyTable = authorType === 'admin' ? 'admin_stories' : 'chronicles_stories'
  const filterCol = authorType === 'admin' ? 'admin_id' : 'creator_id'

  const { data: stories, error } = await supabase
    .from(storyTable)
    .select('id, title, views_count, likes_count, comments_count, shares_count, status, created_at, published_at')
    .eq(filterCol, creatorIdOrAdmin)

  if (error || !stories) {
    console.error('Failed to fetch stories metrics:', error)
    return null
  }

  const totals = stories.reduce(
    (acc: any, story: any) => {
      acc.views += story.views_count || 0
      acc.likes += story.likes_count || 0
      acc.comments += story.comments_count || 0
      acc.shares += story.shares_count || 0
      return acc
    },
    { views: 0, likes: 0, comments: 0, shares: 0 }
  )

  // Construct charts mock data or query tables to construct time series graphs
  // For a robust and responsive Recharts UI, we can group stories created by month/date
  const timeline = stories
    .filter((s: any) => s.status === 'published' && s.published_at)
    .map((s: any) => ({
      date: new Date(s.published_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      views: s.views_count || 0,
      likes: s.likes_count || 0,
      shares: s.shares_count || 0,
      title: s.title
    }))
    .slice(-10) // last 10 stories

  return {
    totals,
    stories,
    timeline
  }
}
