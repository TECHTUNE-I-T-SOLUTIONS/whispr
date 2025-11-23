// Chronicles Platform Types

export enum PostType {
  BLOG = 'blog',
  POEM = 'poem',
}

export enum PostStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ARCHIVED = 'archived',
}

export enum EngagementAction {
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
}

export enum NotificationType {
  POST_LIKE = 'post_like',
  POST_COMMENT = 'post_comment',
  NEW_FOLLOWER = 'new_follower',
  ENGAGEMENT_MILESTONE = 'engagement_milestone',
  NEW_CREATOR_SIGNUP = 'new_creator_signup',
}

export enum ProfileVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
}

export interface Creator {
  id: string;
  user_id: string;
  email: string;
  pen_name: string;
  bio: string;
  profile_picture_url?: string;
  content_type: PostType | 'both';
  categories: string[];
  social_links: Record<string, string>;
  profile_visibility: ProfileVisibility;
  push_notifications_enabled: boolean;
  post_count: number;
  engagement_count: number;
  current_streak: number;
  total_points: number;
  verified_badge: boolean;
  last_activity_at: string;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  creator_id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  post_type: PostType;
  category: string;
  tags: string[];
  cover_image_url?: string;
  formatting_data?: Record<string, any>;
  status: PostStatus;
  view_count: number;
  engagement_count: number;
  scheduled_for?: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
}

export interface Engagement {
  id: string;
  post_id: string;
  creator_id: string;
  action: EngagementAction;
  comment_text?: string;
  created_at: string;
}

export interface StreakHistory {
  id: string;
  creator_id: string;
  streak_date: string;
  posts_published: number;
  engagement_count: number;
  created_at: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon_url: string;
  requirement_type: string;
  requirement_value: number;
  created_at: string;
}

export interface CreatorAchievement {
  id: string;
  creator_id: string;
  achievement_id: string;
  earned_at: string;
  created_at: string;
  achievement?: Achievement;
}

export interface Program {
  id: string;
  name: string;
  description: string;
  start_date: string;
  end_date: string;
  prize_pool: number;
  rules: Record<string, any>;
  status: 'planning' | 'active' | 'completed';
  created_at: string;
}

export interface ChroniclesSetting {
  id: string;
  key: string;
  value: boolean | number;
  description: string;
  updated_at: string;
}

export interface Notification {
  id: string;
  creator_id: string;
  type: NotificationType;
  title: string;
  message: string;
  related_post_id?: string;
  related_creator_id?: string;
  read: boolean;
  created_at: string;
}

export interface AdminActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string;
  changes: Record<string, any>;
  created_at: string;
}

export interface PushSubscription {
  id: string;
  creator_id: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  created_at: string;
  updated_at: string;
}

export interface ChroniclesStats {
  total_creators: number;
  total_posts: number;
  total_engagement: number;
  active_creators_today: number;
  top_creator: {
    name: string;
    posts: number;
  } | null;
}

// API Request/Response Types

export interface CreateCreatorRequest {
  email: string;
  password: string;
  pen_name: string;
  bio: string;
  content_type: PostType | 'both';
  categories: string[];
  profile_picture_url?: string;
}

export interface CreatePostRequest {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  post_type: PostType;
  category: string;
  tags?: string[];
  coverImageUrl?: string;
  formatting_data?: Record<string, any>;
  status?: PostStatus;
}

export interface UpdatePostRequest extends Partial<CreatePostRequest> {
  id: string;
}

export interface CreateEngagementRequest {
  post_id: string;
  action: EngagementAction;
  comment_text?: string;
}

export interface UpdateCreatorRequest {
  pen_name?: string;
  bio?: string;
  profile_picture_url?: string;
  content_type?: PostType | 'both';
  categories?: string[];
  social_links?: Record<string, string>;
  profile_visibility?: ProfileVisibility;
}

export interface PushNotificationRequest {
  enabled: boolean;
  subscription?: {
    endpoint: string;
    keys: {
      auth: string;
      p256dh: string;
    };
  };
}

// Form State Types

export interface SignupFormState {
  step: 1 | 2 | 3 | 4 | 5;
  email: string;
  password: string;
  confirmPassword: string;
  penName: string;
  bio: string;
  profilePicture?: File;
  profilePicturePreview?: string;
  contentType: PostType | 'both';
  categories: string[];
  agreedToTerms: boolean;
}

export interface EditorFormState {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  post_type: PostType;
  category: string;
  tags: string[];
  coverImageUrl?: string;
  formatting_data?: Record<string, any>;
}

export interface ProfileFormState extends UpdateCreatorRequest {
  email: string;
}

export interface SettingsState extends ChroniclesSetting {
  // Additional UI state
  isDirty?: boolean;
  isSaving?: boolean;
}

// Error Types

export interface ApiError {
  error: string;
  status: number;
  details?: Record<string, any>;
}

export interface ValidationError {
  field: string;
  message: string;
}

// Pagination/Query Types

export interface PaginationParams {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface FeedQueryParams extends PaginationParams {
  category?: string;
  post_type?: PostType;
  search?: string;
}

// Helper Types

export type PostsGroupedByStatus = {
  draft: Post[];
  published: Post[];
  archived: Post[];
};

export type EngagementCounts = {
  likes: number;
  comments: number;
  shares: number;
  total: number;
};

export type CreatorStatsCard = {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
};

// Gamification Types

export interface GamificationState {
  currentStreak: number;
  totalPoints: number;
  badges: CreatorAchievement[];
  milestones: {
    posts: number[];
    engagement: number[];
  };
}

export interface StreakData {
  date: string;
  postsCount: number;
  engagementCount: number;
  maintained: boolean;
}
