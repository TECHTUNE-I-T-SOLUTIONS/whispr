// Chronicles Service
// Server-side data fetching for chronicles posts

import { createSupabaseServer } from '@/lib/supabase-server'

export interface ChroniclesPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  type: 'blog' | 'poem'
  category: string
  tags: string[]
  status: string
  coverImageUrl?: string
  viewCount: number
  likesCount: number
  commentsCount?: number
  sharesCount?: number
  publishedAt: string
  created_at: string
  updated_at: string
  article_id?: string
  is_challenge_entry?: boolean
  flagged_for_review?: boolean
  flagStatus?: 'pending' | 'under_review' | 'resolved' | 'dismissed' | null
  flagReason?: string
  creator: {
    id: string
    name: string
    penName: string
    avatar_url?: string
    bio: string
  }
}

export async function getChroniclesPostBySlug(slug: string): Promise<ChroniclesPost | null> {
  const supabase = createSupabaseServer()

  // Fetch post data without status filter for now
  const { data: postData, error: postError } = await supabase
    .from('chronicles_posts')
    .select('*')
    .eq('slug', slug)
    .maybeSingle()

  if (postError) {
    console.error('Error fetching chronicles post:', postError)
    return null
  }

  if (!postData) {
    console.error('Chronicles post not found with slug:', slug)
    return null
  }

  console.log('Found chronicles post:', postData.id, 'status:', postData.status, 'title:', postData.title)

  // Fetch creator data separately
  let creatorData = null
  if (postData.creator_id) {
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id, pen_name, display_name, profile_image_url, avatar_url, bio')
      .eq('id', postData.creator_id)
      .maybeSingle()

    if (creatorError) {
      console.error('Error fetching creator:', creatorError)
    } else {
      creatorData = creator
    }
  }

  // Transform to match expected format
  return {
    id: postData.id,
    title: postData.title,
    slug: postData.slug,
    excerpt: postData.excerpt || '',
    content: postData.content || '',
    type: postData.post_type || 'blog',
    category: postData.category || '',
    tags: postData.tags || [],
    status: postData.status,
    coverImageUrl: postData.cover_image_url,
    viewCount: postData.views_count || 0,
    likesCount: postData.likes_count || 0,
    commentsCount: postData.comments_count || 0,
    sharesCount: postData.shares_count || 0,
    publishedAt: postData.published_at || postData.created_at,
    created_at: postData.created_at,
    updated_at: postData.updated_at,
    article_id: postData.article_id,
    is_challenge_entry: postData.is_challenge_entry || false,
    flagged_for_review: postData.flagged_for_review,
    flagStatus: postData.flag_status,
    flagReason: postData.flag_reason,
    creator: {
      id: creatorData?.id || '',
      name: creatorData?.display_name || creatorData?.pen_name || 'Anonymous',
      penName: creatorData?.pen_name || 'anonymous',
      avatar_url: creatorData?.avatar_url || creatorData?.profile_image_url,
      bio: creatorData?.bio || '',
    },
  }
}

export async function getChroniclesPostById(id: string): Promise<ChroniclesPost | null> {
  const supabase = createSupabaseServer()

  // First fetch post data without creator relationship
  const { data: postData, error: postError } = await supabase
    .from('chronicles_posts')
    .select('*')
    .eq('id', id)
    .eq('status', 'published')
    .maybeSingle()

  if (postError) {
    console.error('Error fetching chronicles post by ID:', postError)
    return null
  }

  if (!postData) {
    console.error('Chronicles post not found or not published with ID:', id)
    return null
  }

  console.log('Found chronicles post by ID:', postData.id, 'status:', postData.status)

  // Fetch creator data separately
  let creatorData = null
  if (postData.creator_id) {
    const { data: creator, error: creatorError } = await supabase
      .from('chronicles_creators')
      .select('id, pen_name, display_name, profile_image_url, avatar_url, bio')
      .eq('id', postData.creator_id)
      .maybeSingle()

    if (creatorError) {
      console.error('Error fetching creator:', creatorError)
    } else {
      creatorData = creator
    }
  }

  // Transform to match expected format
  return {
    id: postData.id,
    title: postData.title,
    slug: postData.slug,
    excerpt: postData.excerpt || '',
    content: postData.content || '',
    type: postData.post_type || 'blog',
    category: postData.category || '',
    tags: postData.tags || [],
    status: postData.status,
    coverImageUrl: postData.cover_image_url,
    viewCount: postData.views_count || 0,
    likesCount: postData.likes_count || 0,
    commentsCount: postData.comments_count || 0,
    sharesCount: postData.shares_count || 0,
    publishedAt: postData.published_at || postData.created_at,
    created_at: postData.created_at,
    updated_at: postData.updated_at,
    article_id: postData.article_id,
    is_challenge_entry: postData.is_challenge_entry || false,
    flagged_for_review: postData.flagged_for_review,
    flagStatus: postData.flag_status,
    flagReason: postData.flag_reason,
    creator: {
      id: creatorData?.id || '',
      name: creatorData?.display_name || creatorData?.pen_name || 'Anonymous',
      penName: creatorData?.pen_name || 'anonymous',
      avatar_url: creatorData?.avatar_url || creatorData?.profile_image_url,
      bio: creatorData?.bio || '',
    },
  }
}
