// Writing Challenges Service
// Server-side data fetching for writing challenges to reduce API calls

import { createSupabaseServer } from '@/lib/supabase-server'

export interface WritingPrompt {
  id: string
  title: string
  description: string
  content: string
  prompt_type: 'blog' | 'poem' | 'story'
  challenge_type: 'daily' | 'weekly' | 'monthly'
  is_ai_generated: boolean
  ai_generation_model?: string
  status: 'draft' | 'active' | 'ended' | 'archived'
  starts_at: string
  ends_at: string
  submission_deadline: string
  max_entries_per_user: number
  evaluation_criteria: {
    integrity: number
    sincerity: number
    passion: number
    engagement: number
  }
  tags: string[]
  featured_image_url?: string
  prize_description?: string
  published_at?: string
  created_at: string
  updated_at: string
  entries_count?: number
  user_entries_count?: number
  has_user_entered?: boolean
}

export interface PromptEntry {
  id: string
  prompt_id: string
  creator_id: string
  post_id?: string
  chain_entry_post_id?: string
  admin_post_id?: string
  entry_type: 'chronicles_post' | 'chain_entry_post' | 'admin_post'
  status: 'submitted' | 'under_review' | 'approved' | 'rejected' | 'flagged'
  is_ai_generated: boolean
  ai_confidence_score?: number
  ai_flagged: boolean
  ai_flag_reason?: string
  submitted_at: string
  reviewed_at?: string
  reviewed_by?: string
  review_notes?: string
  created_at: string
  updated_at: string
  creator?: {
    id: string
    pen_name: string
    profile_image_url?: string
  }
  post?: {
    id: string
    title: string
    type: string
  }
}

export interface ChallengeWinner {
  id: string
  prompt_id: string
  entry_id: string
  creator_id: string
  rank: number
  prize_awarded?: string
  prize_value?: number
  badge_awarded?: string
  announced_at: string
  created_at: string
  creator?: {
    pen_name: string
    profile_image_url?: string
  }
}

export interface LeaderboardEntry {
  id: string
  creator_id: string
  pen_name: string
  profile_image_url?: string
  total_wins: number
  first_place_wins: number
  second_place_wins: number
  third_place_wins: number
  total_points_earned: number
  last_win_at?: string
  best_rank_achievement: string
  created_at: string
  updated_at: string
}

export interface PromptSettings {
  id: string
  ai_auto_generation_enabled: boolean
  ai_generation_frequency: 'daily' | 'weekly' | 'monthly'
  ai_generation_schedule_time: string
  ai_generation_day_of_week?: number
  ai_generation_day_of_month?: number
  last_ai_generation_at?: string
  next_ai_generation_at?: string
  ai_model_preference: string
  allow_admin_edit_ai_prompts: boolean
  default_challenge_type: 'daily' | 'weekly' | 'monthly'
  default_evaluation_criteria: {
    integrity: number
    sincerity: number
    passion: number
    engagement: number
  }
  max_active_challenges: number
  auto_end_challenges: boolean
  auto_announce_winners: boolean
  winner_announcement_delay_hours: number
  created_by?: string
  updated_by?: string
  created_at: string
  updated_at: string
}

// Get all writing prompts (admin view)
export async function getAllWritingPrompts(options?: {
  status?: string
  challenge_type?: string
}): Promise<WritingPrompt[]> {
  const supabase = createSupabaseServer()

  let query = supabase
    .from('chronicles_writing_prompts')
    .select('*')
    .order('created_at', { ascending: false })

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  if (options?.challenge_type) {
    query = query.eq('challenge_type', options.challenge_type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching writing prompts:', error)
    return []
  }

  return data || []
}

// Get active writing prompts for creators
export async function getActiveWritingPrompts(options?: {
  creator_id?: string
  challenge_type?: string
  prompt_type?: string
}): Promise<WritingPrompt[]> {
  const supabase = createSupabaseServer()

  let query = supabase
    .from('chronicles_writing_prompts')
    .select('*')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (options?.challenge_type) {
    query = query.eq('challenge_type', options.challenge_type)
  }

  if (options?.prompt_type) {
    query = query.eq('prompt_type', options.prompt_type)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching active writing prompts:', error)
    return []
  }

  return data || []
}

// Get single writing prompt by ID
export async function getWritingPromptById(id: string): Promise<WritingPrompt | null> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('chronicles_writing_prompts')
    .select(`
      *,
      chronicles_prompt_entries(
        *,
        chronicles_creators(pen_name, profile_image_url)
      )
    `)
    .eq('id', id)
    .single()

  if (error) {
    console.error('Error fetching writing prompt:', error)
    return null
  }

  return data
}

// Get prompt entries for a specific prompt
export async function getPromptEntries(promptId: string): Promise<PromptEntry[]> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('chronicles_prompt_entries')
    .select(`
      *,
      chronicles_creators(pen_name, profile_image_url),
      chronicles_posts(id, title, post_type),
      chronicles_chain_entry_posts(id, title),
      posts(id, title, type)
    `)
    .eq('prompt_id', promptId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching prompt entries:', error)
    return []
  }

  return (data || []).map(entry => ({
    ...entry,
    creator: entry.chronicles_creators,
    post: entry.chronicles_posts || entry.chronicles_chain_entry_posts || entry.posts
  }))
}

// Get challenge winners for a specific prompt
export async function getChallengeWinners(promptId?: string): Promise<ChallengeWinner[]> {
  const supabase = createSupabaseServer()

  let query = supabase
    .from('chronicles_challenge_winners')
    .select(`
      *,
      chronicles_creators(pen_name, profile_image_url)
    `)
    .order('rank', { ascending: true })

  if (promptId) {
    query = query.eq('prompt_id', promptId)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching challenge winners:', error)
    return []
  }

  return (data || []).map(winner => ({
    ...winner,
    creator: winner.chronicles_creators
  }))
}

// Get leaderboard
export async function getLeaderboard(limit: number = 100): Promise<LeaderboardEntry[]> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('chronicles_leaderboard_winners')
    .select(`
      *,
      chronicles_creators(pen_name, profile_image_url)
    `)
    .order('total_wins', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching leaderboard:', error)
    return []
  }

  return (data || []).map(entry => ({
    ...entry,
    pen_name: entry.chronicles_creators?.pen_name,
    profile_image_url: entry.chronicles_creators?.profile_image_url
  }))
}

// Get prompt settings
export async function getPromptSettings(): Promise<PromptSettings | null> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('chronicles_prompt_settings')
    .select('*')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      // No settings exist, return default
      return {
        id: '',
        ai_auto_generation_enabled: false,
        ai_generation_frequency: 'daily',
        ai_generation_schedule_time: '00:00:00',
        ai_model_preference: 'gpt-4',
        allow_admin_edit_ai_prompts: true,
        default_challenge_type: 'daily',
        default_evaluation_criteria: { integrity: 30, sincerity: 30, passion: 20, engagement: 20 },
        max_active_challenges: 3,
        auto_end_challenges: true,
        auto_announce_winners: true,
        winner_announcement_delay_hours: 24,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    }
    console.error('Error fetching prompt settings:', error)
    return null
  }

  return data
}

// Check if a creator can enter a challenge
export async function canEnterChallenge(promptId: string, creatorId: string): Promise<{
  canEnter: boolean
  reason?: string
  remainingEntries?: number
}> {
  const supabase = createSupabaseServer()

  // Get prompt details
  const { data: prompt, error: promptError } = await supabase
    .from('chronicles_writing_prompts')
    .select('*')
    .eq('id', promptId)
    .single()

  if (promptError || !prompt) {
    return { canEnter: false, reason: 'Challenge not found' }
  }

  // Check if challenge is active
  if (prompt.status !== 'active') {
    return { canEnter: false, reason: 'Challenge is not active' }
  }

  // Check if deadline has passed
  if (prompt.submission_deadline && new Date(prompt.submission_deadline) < new Date()) {
    return { canEnter: false, reason: 'Submission deadline has passed' }
  }

  // Check existing entries
  const { count } = await supabase
    .from('chronicles_prompt_entries')
    .select('*', { count: 'exact', head: true })
    .eq('prompt_id', promptId)
    .eq('creator_id', creatorId)

  const remainingEntries = prompt.max_entries_per_user - (count || 0)

  if (remainingEntries <= 0) {
    return { canEnter: false, reason: 'Maximum entries reached' }
  }

  return { canEnter: true, remainingEntries }
}

// Get creator's challenge entries
export async function getCreatorChallengeEntries(creatorId: string): Promise<PromptEntry[]> {
  const supabase = createSupabaseServer()

  const { data, error } = await supabase
    .from('chronicles_prompt_entries')
    .select(`
      *,
      chronicles_writing_prompts(title, prompt_type, challenge_type, status, ends_at),
      chronicles_creators(pen_name, profile_image_url),
      chronicles_posts(id, title, post_type),
      chronicles_chain_entry_posts(id, title),
      posts(id, title, type)
    `)
    .eq('creator_id', creatorId)
    .order('submitted_at', { ascending: false })

  if (error) {
    console.error('Error fetching creator challenge entries:', error)
    return []
  }

  return (data || []).map(entry => ({
    ...entry,
    creator: entry.chronicles_creators,
    post: entry.chronicles_posts || entry.chronicles_chain_entry_posts || entry.posts
  }))
}
