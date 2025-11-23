/**
 * WHISPR CHRONICLES - PHASE 2 TYPE DEFINITIONS
 * Leaderboard, Comments, Monetization, Gamification, Admin Notifications
 */

// ==================== LEADERBOARD ====================
export interface LeaderboardEntry {
  id: string
  creator_id: string
  pen_name: string
  profile_image_url: string | null
  category: 'weekly' | 'monthly' | 'alltime' | 'trending'
  score: number
  rank: number
  total_posts: number
  total_engagement: number
  total_likes: number
  created_at: string
  updated_at: string
}

export interface LeaderboardResponse {
  category: string
  entries: LeaderboardEntry[]
  calculation_method: string
  last_updated: string
}

// ==================== FEED PREFERENCES ====================
export interface FeedPreferences {
  id: string
  creator_id: string
  followed_categories: string[]
  followed_creators: string[]
  blocked_creators: string[]
  feed_algorithm: 'trending' | 'chronological' | 'personalized'
  created_at: string
  updated_at: string
}

// ==================== COMMENTS & THREADING ====================
export interface Comment {
  id: string
  post_id: string
  creator_id: string
  creator?: CreatorProfile
  content: string
  parent_comment_id: string | null
  status: 'approved' | 'pending' | 'rejected' | 'hidden'
  likes_count: number
  replies_count: number
  has_liked?: boolean
  reactions?: CommentReaction[]
  replies?: Comment[]
  created_at: string
  updated_at: string
}

export interface CommentThread {
  id: string
  post_id: string
  comments: Comment[]
  total_count: number
}

export interface CommentReaction {
  id: string
  comment_id: string
  creator_id: string
  reaction_type: 'like' | 'helpful' | 'love' | 'funny'
  created_at: string
}

export interface CreateCommentRequest {
  post_id: string
  content: string
  parent_comment_id?: string | null
}

export interface CommentActionResponse {
  success: boolean
  comment?: Comment
  message: string
}

// ==================== BADGES & GAMIFICATION ====================
export interface BadgeTier {
  id: string
  level: 1 | 2 | 3 | 4 | 5
  name: 'Newcomer' | 'Rising Star' | 'Creator' | 'Influencer' | 'Legend'
  min_points: number
  max_points: number
  icon_url: string | null
  description: string
  created_at: string
}

export interface StreakAchievement {
  id: string
  creator_id: string
  current_streak: number
  longest_streak: number
  last_post_date: string | null
  milestone_7_day: boolean
  milestone_14_day: boolean
  milestone_30_day: boolean
  milestone_100_day: boolean
  created_at: string
  updated_at: string
}

export interface PointsHistoryEntry {
  id: string
  creator_id: string
  points: number
  reason: 'post_published' | 'received_like' | 'streak_milestone' | 'badge_earned' | 'engagement_bonus'
  related_post_id?: string | null
  related_comment_id?: string | null
  created_at: string
}

export interface CreatorGamificationStats {
  total_points: number
  current_badge_tier: BadgeTier
  next_tier_points_needed: number
  current_streak: number
  longest_streak: number
  achievements_unlocked: string[]
  recent_points: PointsHistoryEntry[]
}

// ==================== MONETIZATION ====================
export interface Monetization {
  id: string
  creator_id: string
  enrolled: boolean
  program_status: 'inactive' | 'active' | 'suspended' | 'approved'
  revenue_share_percent: number
  ad_consent: boolean
  payment_method: 'stripe' | 'paypal' | 'bank_transfer' | null
  payment_details: {
    account_holder_name?: string
    account_type?: string
    last_digits?: string
    [key: string]: any
  } | null
  total_earned: number
  pending_balance: number
  last_payout_date: string | null
  created_at: string
  updated_at: string
}

export interface EarningsTransaction {
  id: string
  creator_id: string
  transaction_type: 'ad_revenue' | 'tip' | 'subscription' | 'payout' | 'refund'
  amount: number
  currency: string
  status: 'pending' | 'completed' | 'failed' | 'reversed'
  reference_id: string | null
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface EarningsSummary {
  creator_id: string
  total_earned: number
  pending_balance: number
  lifetime_payouts: number
  current_month_earnings: number
  transaction_count: number
  monetization: Monetization
  recent_transactions: EarningsTransaction[]
}

export interface EnrollMonetizationRequest {
  payment_method: 'stripe' | 'paypal' | 'bank_transfer'
  payment_details: Record<string, any>
  ad_consent: boolean
  revenue_share_percent?: number
}

// ==================== AD NETWORK ====================
export interface AdPlacement {
  id: string
  placement_name: 'feed_sidebar' | 'post_below_content' | 'creator_profile_sidebar' | 'sponsored_post'
  position: string
  ad_type: 'native' | 'banner' | 'sponsored_post'
  ad_network: 'adsense' | 'custom_network' | 'sponsorship'
  enabled: boolean
  created_at: string
  updated_at: string
}

export interface AdAnalytics {
  id: string
  placement_id: string
  creator_id: string | null
  impressions: number
  clicks: number
  revenue: number
  ctr: number // Click-through rate
  cpm: number // Cost per thousand impressions
  recorded_date: string
  created_at: string
}

export interface AdPerformanceSummary {
  placement_name: string
  total_impressions: number
  total_clicks: number
  total_revenue: number
  average_ctr: number
  average_cpm: number
  period: string
}

// ==================== ADMIN NOTIFICATIONS ====================
export type NotificationType =
  | 'creator_signup'
  | 'creator_milestone'
  | 'post_viral'
  | 'post_reported'
  | 'comment_flagged'
  | 'high_engagement'
  | 'low_quality_post'
  | 'creator_banned'
  | 'revenue_milestone'
  | 'subscriber_milestone'
  | 'admin_action_needed'
  | 'system_alert'

export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical'

export interface AdminNotification {
  id: string
  notification_type: NotificationType
  title: string
  message: string
  creator_id: string | null
  post_id: string | null
  comment_id: string | null
  priority: NotificationPriority
  read: boolean
  read_by: string | null
  read_at: string | null
  action_taken: string | null
  data: Record<string, any>
  created_at: string
  updated_at: string
  // Relationships
  creator?: CreatorProfile
  post?: {
    id: string
    title: string
    slug: string
  }
  comment?: {
    id: string
    content: string
  }
}

export interface AdminNotificationSettings {
  id: string
  admin_id: string
  notify_new_creators: boolean
  notify_viral_posts: boolean
  notify_reported_content: boolean
  notify_revenue_milestones: boolean
  notify_high_engagement: boolean
  notify_system_alerts: boolean
  notification_frequency: 'realtime' | 'daily' | 'weekly' | 'off'
  created_at: string
  updated_at: string
}

export interface AdminNotificationResponse {
  notifications: AdminNotification[]
  total: number
  unread_count: number
}

export interface AdminNotificationFilter {
  unread_only?: boolean
  priority?: NotificationPriority
  type?: NotificationType
  limit?: number
  offset?: number
}

// ==================== SHARED TYPES ====================
export interface CreatorProfile {
  id: string
  user_id: string
  pen_name: string
  bio: string | null
  profile_image_url: string | null
  total_posts: number
  total_engagement: number
  created_at: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  per_page: number
  has_more: boolean
}

// ==================== API RESPONSE TYPES ====================
export interface ApiSuccessResponse<T> {
  success: true
  data: T
  message?: string
}

export interface ApiErrorResponse {
  success: false
  error: string
  code?: string
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse
