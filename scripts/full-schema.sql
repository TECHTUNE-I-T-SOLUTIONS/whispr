-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.admin (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  username character varying NOT NULL UNIQUE,
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  full_name character varying,
  bio text,
  avatar_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  last_login timestamp with time zone,
  security_question character varying,
  security_answer character varying,
  phone character varying,
  date_of_birth date,
  profile_image_url text,
  is_active boolean DEFAULT true,
  failed_login_attempts integer DEFAULT 0,
  locked_until timestamp with time zone,
  email_verified boolean DEFAULT false,
  CONSTRAINT admin_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid UNIQUE,
  email_notifications boolean DEFAULT true,
  comment_notifications boolean DEFAULT true,
  reaction_notifications boolean DEFAULT true,
  milestone_notifications boolean DEFAULT true,
  system_notifications boolean DEFAULT true,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT admin_notification_settings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.admin_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  session_token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  last_accessed timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_sessions_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.ads_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  show_ads boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ads_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.ai_chat_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL,
  sender text NOT NULL CHECK (sender = ANY (ARRAY['user'::text, 'assistant'::text])),
  content text NOT NULL,
  message_type text NOT NULL DEFAULT 'text'::text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_messages_session_id_fkey FOREIGN KEY (session_id) REFERENCES public.ai_chat_sessions(id)
);
CREATE TABLE public.ai_chat_sessions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid,
  chain_id uuid,
  mode text NOT NULL DEFAULT 'chronicles'::text,
  output_type text NOT NULL DEFAULT 'draft'::text,
  status text NOT NULL DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'archived'::text, 'closed'::text, 'pending'::text])),
  title text,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT ai_chat_sessions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_sessions_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chronicles_writing_chains(id),
  CONSTRAINT ai_chat_sessions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  badge_id text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon_url text,
  requirement text,
  points_reward integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_achievements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_ad_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  placement_id uuid NOT NULL,
  creator_id uuid,
  impressions integer DEFAULT 0,
  clicks integer DEFAULT 0,
  revenue numeric DEFAULT 0,
  recorded_date date NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_ad_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_ad_analytics_placement_id_fkey FOREIGN KEY (placement_id) REFERENCES public.chronicles_ad_placements(id),
  CONSTRAINT chronicles_ad_analytics_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_ad_placements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  placement_name text NOT NULL UNIQUE,
  position text NOT NULL,
  ad_type text NOT NULL CHECK (ad_type = ANY (ARRAY['banner'::text, 'native'::text, 'video'::text, 'sponsored_post'::text])),
  enabled boolean DEFAULT true,
  ad_network text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_ad_placements_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_admin_activity_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  activity_type text NOT NULL CHECK (activity_type = ANY (ARRAY['creator_signup'::text, 'creator_banned'::text, 'post_reported'::text, 'post_removed'::text, 'comment_removed'::text, 'badge_awarded'::text, 'sub_admin_offered'::text, 'feature_toggled'::text])),
  creator_id uuid NOT NULL,
  post_id uuid,
  title character varying NOT NULL,
  description text,
  action_taken text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_admin_activity_log_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_admin_activity_log_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_admin_activity_log_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_admin_activity_log_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_admin_notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL UNIQUE,
  notify_new_creators boolean DEFAULT true,
  notify_viral_posts boolean DEFAULT true,
  notify_reported_content boolean DEFAULT true,
  notify_revenue_milestones boolean DEFAULT true,
  notify_high_engagement boolean DEFAULT true,
  notify_system_alerts boolean DEFAULT true,
  notification_frequency text DEFAULT 'realtime'::text CHECK (notification_frequency = ANY (ARRAY['realtime'::text, 'daily'::text, 'weekly'::text, 'off'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_admin_notification_settings_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_admin_notification_settings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_type text NOT NULL CHECK (notification_type = ANY (ARRAY['creator_signup'::text, 'creator_milestone'::text, 'post_viral'::text, 'post_reported'::text, 'post_flagged'::text, 'comment_flagged'::text, 'high_engagement'::text, 'low_quality_post'::text, 'creator_banned'::text, 'revenue_milestone'::text, 'subscriber_milestone'::text, 'admin_action_needed'::text, 'system_alert'::text])),
  title character varying NOT NULL,
  message text NOT NULL,
  creator_id uuid,
  post_id uuid,
  comment_id uuid,
  priority text DEFAULT 'normal'::text CHECK (priority = ANY (ARRAY['low'::text, 'normal'::text, 'high'::text, 'critical'::text])),
  read boolean DEFAULT false,
  read_by uuid,
  read_at timestamp with time zone,
  action_taken text,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_admin_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_admin_notifications_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_admin_notifications_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_admin_notifications_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.chronicles_comments(id),
  CONSTRAINT chronicles_admin_notifications_read_by_fkey FOREIGN KEY (read_by) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_audience_demographics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  age_13_17 integer DEFAULT 0,
  age_18_24 integer DEFAULT 0,
  age_25_34 integer DEFAULT 0,
  age_35_44 integer DEFAULT 0,
  age_45_54 integer DEFAULT 0,
  age_55_plus integer DEFAULT 0,
  gender_male integer DEFAULT 0,
  gender_female integer DEFAULT 0,
  gender_other integer DEFAULT 0,
  top_countries jsonb DEFAULT '[]'::jsonb,
  top_regions jsonb DEFAULT '[]'::jsonb,
  device_mobile integer DEFAULT 0,
  device_desktop integer DEFAULT 0,
  device_tablet integer DEFAULT 0,
  avg_engagement_mobile numeric DEFAULT 0,
  avg_engagement_desktop numeric DEFAULT 0,
  avg_engagement_tablet numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_audience_demographics_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_audience_demographics_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_audience_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  total_followers integer DEFAULT 0,
  new_followers integer DEFAULT 0,
  lost_followers integer DEFAULT 0,
  avg_age integer,
  top_countries jsonb DEFAULT '[]'::jsonb,
  top_regions jsonb DEFAULT '[]'::jsonb,
  device_breakdown jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT chronicles_audience_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_audience_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id)
);
CREATE TABLE public.chronicles_badge_tiers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  level integer NOT NULL UNIQUE,
  min_points integer NOT NULL,
  max_points integer,
  icon_url text,
  description text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_badge_tiers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_category_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_name text NOT NULL UNIQUE,
  category_slug text NOT NULL UNIQUE,
  description text,
  icon_url text,
  color_code text,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  display_order integer DEFAULT 0,
  require_moderation boolean DEFAULT false,
  min_age_rating integer DEFAULT 13,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_category_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_chain_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL,
  post_id uuid,
  sequence integer NOT NULL,
  added_by uuid,
  added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  chain_entry_post_id uuid,
  CONSTRAINT chronicles_chain_entries_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entries_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chronicles_writing_chains(id),
  CONSTRAINT chronicles_chain_entries_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_chain_entries_chain_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id)
);
CREATE TABLE public.chronicles_chain_entry_post_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'helpful'::text, 'love'::text, 'funny'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.chronicles_chain_entry_post_comments(id),
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_chain_entry_post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_entry_post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_comments_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id),
  CONSTRAINT chronicles_chain_entry_post_comments_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_chain_entry_post_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.chronicles_chain_entry_post_comments(id)
);
CREATE TABLE public.chronicles_chain_entry_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_entry_post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'wow'::text, 'haha'::text, 'sad'::text, 'angry'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_likes_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id),
  CONSTRAINT chronicles_chain_entry_post_likes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_chain_entry_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  category text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  status text DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  formatting_data jsonb DEFAULT '{}'::jsonb,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  sequence integer NOT NULL,
  added_by uuid,
  published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_posts_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_posts_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chronicles_writing_chains(id),
  CONSTRAINT chronicles_chain_entry_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_chain_entry_posts_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'helpful'::text, 'love'::text, 'funny'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.chronicles_comments(id),
  CONSTRAINT chronicles_comment_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_comments_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_comments_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.chronicles_comments(id)
);
CREATE TABLE public.chronicles_compliance_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  total_flagged_posts integer DEFAULT 0,
  total_flagged_comments integer DEFAULT 0,
  total_flagged_users integer DEFAULT 0,
  posts_removed integer DEFAULT 0,
  comments_removed integer DEFAULT 0,
  users_banned integer DEFAULT 0,
  violation_types jsonb DEFAULT '{}'::jsonb,
  total_appeals integer DEFAULT 0,
  appeals_upheld integer DEFAULT 0,
  appeals_overturned integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_compliance_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_compliance_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id)
);
CREATE TABLE public.chronicles_content_policies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  policy_name text NOT NULL UNIQUE,
  description text,
  prohibited_keywords ARRAY DEFAULT ARRAY[]::text[],
  prohibited_content_types ARRAY DEFAULT ARRAY[]::text[],
  enforcement_level text DEFAULT 'warning'::text,
  auto_enforcement boolean DEFAULT false,
  require_manual_review boolean DEFAULT true,
  applies_to_categories ARRAY DEFAULT ARRAY[]::text[],
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_content_policies_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_content_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  post_id uuid,
  creator_id uuid NOT NULL,
  views integer DEFAULT 0,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  category text,
  post_type text,
  publish_date date,
  peak_engagement_date date,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_content_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_content_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id),
  CONSTRAINT chronicles_content_report_data_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_content_report_data_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_creator_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  achievement_id uuid NOT NULL,
  earned_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_creator_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_creator_achievements_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_creator_achievements_achievement_id_fkey FOREIGN KEY (achievement_id) REFERENCES public.chronicles_achievements(id)
);
CREATE TABLE public.chronicles_creator_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  date date NOT NULL,
  posts_created integer DEFAULT 0,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_reposts integer DEFAULT 0,
  avg_engagement_rate numeric DEFAULT 0,
  new_followers integer DEFAULT 0,
  total_followers integer DEFAULT 0,
  follow_growth_rate numeric DEFAULT 0,
  best_post_id uuid,
  best_post_engagement integer DEFAULT 0,
  peak_activity_hour integer,
  earnings numeric DEFAULT 0,
  ad_impressions integer DEFAULT 0,
  ad_clicks integer DEFAULT 0,
  ctr numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_creator_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_creator_analytics_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_creator_analytics_best_post_id_fkey FOREIGN KEY (best_post_id) REFERENCES public.chronicles_posts(id)
);
CREATE TABLE public.chronicles_creator_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  follower_growth integer DEFAULT 0,
  engagement_growth numeric DEFAULT 0,
  post_frequency integer DEFAULT 0,
  avg_engagement_per_post numeric DEFAULT 0,
  total_engagement integer DEFAULT 0,
  total_earnings numeric DEFAULT 0,
  earnings_growth numeric DEFAULT 0,
  total_views integer DEFAULT 0,
  unique_viewers integer DEFAULT 0,
  leaderboard_rank integer,
  rank_change integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_creator_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_creator_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id),
  CONSTRAINT chronicles_creator_report_data_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_creators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  program_id uuid,
  pen_name text NOT NULL UNIQUE,
  email text NOT NULL,
  bio text,
  profile_image_url text,
  social_links jsonb DEFAULT '{}'::jsonb,
  content_type text DEFAULT 'blog'::text CHECK (content_type = ANY (ARRAY['blog'::text, 'poem'::text, 'both'::text])),
  preferred_categories ARRAY DEFAULT ARRAY[]::text[],
  status text DEFAULT 'active'::text CHECK (status = ANY (ARRAY['active'::text, 'inactive'::text, 'banned'::text, 'pending'::text])),
  role text DEFAULT 'creator'::text CHECK (role = ANY (ARRAY['creator'::text, 'verified_creator'::text, 'sub_admin'::text])),
  streak_count integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  total_poems integer DEFAULT 0,
  total_blog_posts integer DEFAULT 0,
  total_engagement integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  points integer DEFAULT 0,
  badges ARRAY DEFAULT ARRAY[]::text[],
  sub_admin_offered boolean DEFAULT false,
  sub_admin_offered_at timestamp with time zone,
  push_notifications_enabled boolean DEFAULT true,
  email_digest_enabled boolean DEFAULT true,
  email_on_engagement boolean DEFAULT true,
  profile_visibility text DEFAULT 'public'::text CHECK (profile_visibility = ANY (ARRAY['public'::text, 'private'::text])),
  last_post_date timestamp with time zone,
  last_activity_at timestamp with time zone,
  joined_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_verified boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  total_followers integer DEFAULT 0,
  display_name text,
  avatar_url text,
  CONSTRAINT chronicles_creators_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_creators_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT chronicles_creators_program_id_fkey FOREIGN KEY (program_id) REFERENCES public.chronicles_programs(id)
);
CREATE TABLE public.chronicles_daily_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL UNIQUE,
  total_creators integer DEFAULT 0,
  new_creators integer DEFAULT 0,
  active_creators integer DEFAULT 0,
  deleted_creators integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  new_posts integer DEFAULT 0,
  deleted_posts integer DEFAULT 0,
  flagged_posts integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_reposts integer DEFAULT 0,
  avg_engagement_per_post numeric DEFAULT 0,
  total_reactions integer DEFAULT 0,
  total_follows integer DEFAULT 0,
  total_unfollows integer DEFAULT 0,
  total_text_posts integer DEFAULT 0,
  total_audio_posts integer DEFAULT 0,
  total_video_posts integer DEFAULT 0,
  total_media_posts integer DEFAULT 0,
  avg_post_length integer DEFAULT 0,
  avg_reading_time_seconds integer DEFAULT 0,
  total_ad_revenue numeric DEFAULT 0,
  total_tips integer DEFAULT 0,
  total_subscriptions integer DEFAULT 0,
  avg_revenue_per_creator numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_daily_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_earnings_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type = ANY (ARRAY['ad_revenue'::text, 'tip'::text, 'subscription'::text, 'payout'::text])),
  amount numeric NOT NULL,
  currency text DEFAULT 'USD'::text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'completed'::text, 'failed'::text, 'reversed'::text])),
  reference_id text,
  notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  completed_at timestamp with time zone,
  CONSTRAINT chronicles_earnings_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_earnings_transactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_email_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  welcome_email_enabled boolean DEFAULT true,
  digest_email_enabled boolean DEFAULT true,
  notification_email_enabled boolean DEFAULT true,
  digest_frequency text DEFAULT 'daily'::text,
  max_emails_per_day integer DEFAULT 5,
  include_recommendations boolean DEFAULT true,
  include_trending_posts boolean DEFAULT true,
  include_follower_updates boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_email_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_engagement (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  user_id uuid NOT NULL,
  engagement_type text NOT NULL CHECK (engagement_type = ANY (ARRAY['like'::text, 'comment'::text, 'share'::text])),
  content text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_engagement_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_engagement_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_engagement_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_engagement_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  report_date date NOT NULL,
  likes integer DEFAULT 0,
  comments integer DEFAULT 0,
  shares integer DEFAULT 0,
  reposts integer DEFAULT 0,
  follows integer DEFAULT 0,
  engagement_score numeric DEFAULT 0,
  peak_engagement_time integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_engagement_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_engagement_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id)
);
CREATE TABLE public.chronicles_feed_preferences (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  followed_categories ARRAY DEFAULT ARRAY[]::text[],
  followed_creators ARRAY DEFAULT ARRAY[]::uuid[],
  blocked_creators ARRAY DEFAULT ARRAY[]::uuid[],
  feed_algorithm text DEFAULT 'trending'::text,
  show_adult_content boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_feed_preferences_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_feed_preferences_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_flagged_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  chain_entry_post_id uuid,
  flagged_by uuid NOT NULL,
  reason text NOT NULL CHECK (reason = ANY (ARRAY['inappropriate_content'::text, 'spam'::text, 'copyright_violation'::text, 'misinformation'::text, 'hate_speech'::text, 'explicit_content'::text, 'harassment'::text, 'other'::text])),
  description text,
  status text DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'under_review'::text, 'resolved'::text, 'dismissed'::text])),
  resolution text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_flagged_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_flagged_reviews_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_flagged_reviews_chain_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id),
  CONSTRAINT chronicles_flagged_reviews_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES public.admin(id),
  CONSTRAINT chronicles_flagged_reviews_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES public.admin(id)
);
CREATE TABLE public.chronicles_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  follows_id uuid NOT NULL,
  is_following boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_followers_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_followers_follows_id_fkey FOREIGN KEY (follows_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_gamification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  points_per_post integer DEFAULT 10,
  points_per_like integer DEFAULT 1,
  points_per_comment integer DEFAULT 2,
  points_per_share integer DEFAULT 5,
  points_per_follow integer DEFAULT 3,
  streak_bonus_percentage integer DEFAULT 10,
  max_streak_bonus_days integer DEFAULT 30,
  enable_badges boolean DEFAULT true,
  show_badge_notifications boolean DEFAULT true,
  enable_achievements boolean DEFAULT true,
  achievement_notification_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_gamification_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_generated_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  creator_id uuid,
  report_name text NOT NULL,
  report_type text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  report_data jsonb NOT NULL,
  summary text,
  file_path text,
  file_format text DEFAULT 'json'::text,
  file_size_bytes integer,
  generated_by_user_id uuid,
  generation_time_ms integer,
  status text DEFAULT 'generated'::text,
  error_message text,
  download_count integer DEFAULT 0,
  last_downloaded_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_generated_reports_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_generated_reports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.chronicles_report_templates(id),
  CONSTRAINT chronicles_generated_reports_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_hashtag_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hashtag text NOT NULL UNIQUE,
  total_uses integer DEFAULT 0,
  total_posts integer DEFAULT 0,
  total_engagement integer DEFAULT 0,
  trending_rank integer,
  is_trending boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_hashtag_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_hourly_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  timestamp timestamp with time zone NOT NULL UNIQUE,
  hour_of_day integer NOT NULL,
  active_users integer DEFAULT 0,
  new_posts integer DEFAULT 0,
  new_comments integer DEFAULT 0,
  new_likes integer DEFAULT 0,
  page_views integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_hourly_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_leaderboard (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  rank integer,
  category text,
  score integer NOT NULL DEFAULT 0,
  calculation_method text DEFAULT 'weighted'::text,
  calculated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_leaderboard_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_leaderboard_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_leaderboard_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_weight integer DEFAULT 10,
  engagement_weight integer DEFAULT 2,
  streak_weight integer DEFAULT 5,
  follow_weight integer DEFAULT 1,
  show_weekly_leaderboard boolean DEFAULT true,
  show_monthly_leaderboard boolean DEFAULT true,
  show_alltime_leaderboard boolean DEFAULT true,
  show_trending_leaderboard boolean DEFAULT true,
  leaderboard_size integer DEFAULT 100,
  show_creator_stats boolean DEFAULT true,
  show_trending_posts boolean DEFAULT true,
  weekly_reset_day text DEFAULT 'sunday'::text,
  weekly_reset_time time without time zone DEFAULT '00:00:00'::time without time zone,
  monthly_reset_day integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_leaderboard_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_monetization (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  enrolled boolean DEFAULT false,
  program_status text DEFAULT 'inactive'::text CHECK (program_status = ANY (ARRAY['inactive'::text, 'active'::text, 'suspended'::text, 'approved'::text])),
  revenue_share_percent integer DEFAULT 50,
  ad_consent boolean DEFAULT false,
  ad_network_id text,
  payment_method text,
  payment_details jsonb DEFAULT '{}'::jsonb,
  total_earned numeric DEFAULT 0,
  pending_balance numeric DEFAULT 0,
  last_payout_date timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_monetization_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_monetization_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_monetization_report_data (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  creator_id uuid,
  ad_revenue numeric DEFAULT 0,
  tip_revenue numeric DEFAULT 0,
  subscription_revenue numeric DEFAULT 0,
  total_revenue numeric DEFAULT 0,
  platform_fees numeric DEFAULT 0,
  processing_fees numeric DEFAULT 0,
  net_revenue numeric DEFAULT 0,
  ad_impressions integer DEFAULT 0,
  ad_clicks integer DEFAULT 0,
  ctr numeric DEFAULT 0,
  cpm numeric DEFAULT 0,
  subscriber_count integer DEFAULT 0,
  subscriber_growth integer DEFAULT 0,
  subscriber_retention_rate numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_monetization_report_data_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_monetization_report_data_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id),
  CONSTRAINT chronicles_monetization_report_data_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_monetization_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ad_revenue_share_percentage numeric DEFAULT 70.00,
  min_daily_earnings_for_payout numeric DEFAULT 5.00,
  payout_threshold numeric DEFAULT 100.00,
  enable_tipping boolean DEFAULT true,
  tip_minimum numeric DEFAULT 0.99,
  tip_maximum numeric DEFAULT 999.99,
  platform_fee_percentage numeric DEFAULT 5.00,
  enable_subscriptions boolean DEFAULT true,
  default_subscription_price numeric DEFAULT 4.99,
  platform_subscription_fee_percentage numeric DEFAULT 30.00,
  payout_frequency text DEFAULT 'weekly'::text,
  payout_method_enabled ARRAY DEFAULT ARRAY['bank_transfer'::text, 'paypal'::text],
  base_currency text DEFAULT 'USD'::text,
  exchange_rate_update_frequency text DEFAULT 'daily'::text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_monetization_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_notification_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notify_on_follow boolean DEFAULT true,
  notify_on_like boolean DEFAULT true,
  notify_on_comment boolean DEFAULT true,
  notify_on_mention boolean DEFAULT true,
  notify_on_viral_post boolean DEFAULT true,
  notify_on_monetization_milestone boolean DEFAULT true,
  notify_on_leaderboard_change boolean DEFAULT true,
  batch_notifications boolean DEFAULT true,
  batch_delay_minutes integer DEFAULT 15,
  quiet_hours_enabled boolean DEFAULT false,
  quiet_hours_start time without time zone,
  quiet_hours_end time without time zone,
  dnd_enabled boolean DEFAULT false,
  dnd_until timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_notification_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  type text NOT NULL CHECK (type = ANY (ARRAY['new_post_published'::text, 'post_liked'::text, 'post_commented'::text, 'post_shared'::text, 'follower_joined'::text, 'badge_earned'::text, 'streak_milestone'::text, 'sub_admin_offered'::text, 'engagement_summary'::text, 'comment_reply'::text, 'system'::text, 'post_flagged_for_review'::text, 'chain_created'::text, 'chain_entry_added'::text, 'post_added_to_chain'::text])),
  title character varying NOT NULL,
  message text NOT NULL,
  related_post_id uuid,
  related_creator_id uuid,
  data jsonb DEFAULT '{}'::jsonb,
  read boolean DEFAULT false,
  read_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_notifications_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_notifications_related_post_id_fkey FOREIGN KEY (related_post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_notifications_related_creator_id_fkey FOREIGN KEY (related_creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_points_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  points integer NOT NULL,
  reason text NOT NULL,
  related_post_id uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_points_history_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_points_history_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_points_history_related_post_id_fkey FOREIGN KEY (related_post_id) REFERENCES public.chronicles_posts(id)
);
CREATE TABLE public.chronicles_post_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL UNIQUE,
  total_views integer DEFAULT 0,
  total_likes integer DEFAULT 0,
  total_comments integer DEFAULT 0,
  total_shares integer DEFAULT 0,
  total_reposts integer DEFAULT 0,
  engagement_rate numeric DEFAULT 0,
  first_like_at timestamp with time zone,
  first_comment_at timestamp with time zone,
  peak_engagement_at timestamp with time zone,
  unique_viewers integer DEFAULT 0,
  devices_used ARRAY DEFAULT ARRAY[]::text[],
  countries ARRAY DEFAULT ARRAY[]::text[],
  virality_score numeric DEFAULT 0,
  engagement_velocity numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id)
);
CREATE TABLE public.chronicles_post_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'author'::text CHECK (role = ANY (ARRAY['author'::text, 'editor'::text, 'viewer'::text])),
  added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_collaborators_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_post_collaborators_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'wow'::text, 'haha'::text, 'sad'::text, 'angry'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_post_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_post_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  shared_to text NOT NULL DEFAULT 'unknown'::text CHECK (shared_to = ANY (ARRAY['email'::text, 'social'::text, 'link'::text, 'unknown'::text])),
  share_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_shares_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_shares_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_post_shares_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  post_type text DEFAULT 'blog'::text CHECK (post_type = ANY (ARRAY['blog'::text, 'poem'::text])),
  category text,
  tags ARRAY DEFAULT ARRAY[]::text[],
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text, 'scheduled'::text])),
  formatting_data jsonb DEFAULT '{}'::jsonb,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  published_at timestamp with time zone,
  scheduled_for timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_posts_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'ended'::text, 'paused'::text])),
  start_date timestamp with time zone,
  end_date timestamp with time zone,
  created_by uuid NOT NULL,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_programs_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_programs_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  endpoint text NOT NULL UNIQUE,
  auth text NOT NULL,
  p256dh text NOT NULL,
  user_agent text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_push_subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_push_subscriptions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_rate_limiting_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  global_requests_per_minute integer DEFAULT 1000,
  user_requests_per_minute integer DEFAULT 60,
  user_requests_per_hour integer DEFAULT 1000,
  create_post_per_hour integer DEFAULT 10,
  create_comment_per_hour integer DEFAULT 100,
  like_per_hour integer DEFAULT 500,
  rate_limiting_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_rate_limiting_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_realtime_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  metric_key text NOT NULL UNIQUE,
  metric_value jsonb NOT NULL,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_realtime_analytics_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_report_audit_log (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL,
  user_id uuid NOT NULL,
  action text NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_report_audit_log_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_report_audit_log_report_id_fkey FOREIGN KEY (report_id) REFERENCES public.chronicles_generated_reports(id)
);
CREATE TABLE public.chronicles_report_exports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  export_type text NOT NULL,
  date_range_start date NOT NULL,
  date_range_end date NOT NULL,
  format text NOT NULL,
  file_path text NOT NULL,
  file_size_bytes integer,
  row_count integer,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_report_exports_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_report_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  slug text NOT NULL UNIQUE,
  description text,
  report_type text NOT NULL,
  metrics ARRAY NOT NULL,
  include_charts boolean DEFAULT true,
  include_tables boolean DEFAULT true,
  include_summary boolean DEFAULT true,
  is_public boolean DEFAULT false,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  is_active boolean DEFAULT true,
  CONSTRAINT chronicles_report_templates_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_scheduled_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL,
  creator_id uuid,
  report_name text NOT NULL,
  frequency text NOT NULL,
  day_of_week integer,
  day_of_month integer,
  time_of_day time without time zone DEFAULT '00:00:00'::time without time zone,
  email_recipients ARRAY DEFAULT ARRAY[]::text[],
  send_to_creator boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_generated_at timestamp with time zone,
  next_generation_at timestamp with time zone,
  failed_generations integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_scheduled_reports_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_scheduled_reports_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.chronicles_report_templates(id),
  CONSTRAINT chronicles_scheduled_reports_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value text,
  description text,
  updated_by uuid,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_settings_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id)
);
CREATE TABLE public.chronicles_streak_achievements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  milestone_7 boolean DEFAULT false,
  milestone_14 boolean DEFAULT false,
  milestone_30 boolean DEFAULT false,
  milestone_100 boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_streak_achievements_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_streak_achievements_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_streak_history (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  streak_date date NOT NULL,
  post_count integer DEFAULT 0,
  engagement_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_streak_history_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_streak_history_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.chronicles_system_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  feature_enabled boolean DEFAULT true,
  registration_open boolean DEFAULT true,
  maintenance_mode boolean DEFAULT false,
  max_posts_per_day integer DEFAULT 10,
  min_content_length integer DEFAULT 10,
  max_content_length integer DEFAULT 50000,
  auto_publish_delay_seconds integer DEFAULT 0,
  require_email_verification boolean DEFAULT false,
  allow_anonymous_comments boolean DEFAULT false,
  comments_require_moderation boolean DEFAULT false,
  allow_comment_threads boolean DEFAULT true,
  max_comment_depth integer DEFAULT 5,
  enable_content_moderation boolean DEFAULT true,
  auto_flag_duplicates boolean DEFAULT false,
  min_moderation_score_for_publish integer DEFAULT 0,
  enable_adult_content_filter boolean DEFAULT true,
  enable_spam_detection boolean DEFAULT true,
  enable_bot_detection boolean DEFAULT true,
  enable_monetization boolean DEFAULT true,
  enable_ads boolean DEFAULT true,
  enable_tips boolean DEFAULT true,
  enable_subscriptions boolean DEFAULT true,
  enable_notifications boolean DEFAULT true,
  notification_batch_delay_minutes integer DEFAULT 5,
  cache_duration_minutes integer DEFAULT 30,
  enable_caching boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_system_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_theme_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  platform_name text DEFAULT 'Chronicles'::text,
  logo_url text,
  favicon_url text,
  primary_color text DEFAULT '#6366f1'::text,
  secondary_color text DEFAULT '#ec4899'::text,
  accent_color text DEFAULT '#f59e0b'::text,
  primary_font text DEFAULT 'Inter'::text,
  heading_font text DEFAULT 'Poppins'::text,
  max_content_width integer DEFAULT 1200,
  enable_dark_mode boolean DEFAULT true,
  dark_mode_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_theme_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.chronicles_writing_chains (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_writing_chains_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_writing_chains_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.chronicles_creators(id)
);
CREATE TABLE public.comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  author_name character varying NOT NULL,
  author_email character varying NOT NULL,
  author_website character varying,
  content text NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying::text, 'approved'::character varying::text, 'rejected'::character varying::text, 'spam'::character varying::text])),
  admin_reply text,
  user_ip character varying,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT comments_pkey PRIMARY KEY (id),
  CONSTRAINT comments_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.conversation_participants (
  conversation_id uuid NOT NULL,
  admin_id uuid NOT NULL,
  role text DEFAULT 'member'::text,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  last_read_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversation_participants_pkey PRIMARY KEY (conversation_id, admin_id),
  CONSTRAINT conversation_participants_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT conversation_participants_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  is_direct boolean NOT NULL DEFAULT false,
  created_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT conversations_pkey PRIMARY KEY (id),
  CONSTRAINT conversations_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id)
);
CREATE TABLE public.error_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  stack text,
  url text,
  user_agent text,
  source character varying,
  timestamp bigint,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  error_hash character varying,
  resolved boolean DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  notes text,
  next_version character varying,
  build_id character varying,
  environment character varying DEFAULT 'production'::character varying,
  session_id character varying,
  user_id uuid,
  occurrence_count integer DEFAULT 1,
  last_occurrence_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT error_logs_pkey PRIMARY KEY (id)
);
CREATE TABLE public.feedback (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message text NOT NULL,
  name text,
  email text,
  page_url text,
  user_agent text,
  metadata jsonb,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT feedback_pkey PRIMARY KEY (id)
);
CREATE TABLE public.media (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  original_name text NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_url text NOT NULL,
  file_type text NOT NULL,
  file_size integer NOT NULL,
  bucket_name text NOT NULL DEFAULT 'media'::text,
  uploaded_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_pkey PRIMARY KEY (id),
  CONSTRAINT media_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.admin(id)
);
CREATE TABLE public.media_files (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  filename character varying NOT NULL,
  original_name character varying NOT NULL,
  file_type character varying NOT NULL,
  file_size integer NOT NULL,
  file_url text NOT NULL,
  alt_text text,
  caption text,
  admin_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT media_files_pkey PRIMARY KEY (id),
  CONSTRAINT media_files_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.message_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  media_file_id uuid,
  file_url text,
  file_type text,
  file_size bigint,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT message_attachments_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id),
  CONSTRAINT message_attachments_media_file_id_fkey FOREIGN KEY (media_file_id) REFERENCES public.media(id)
);
CREATE TABLE public.message_references (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL,
  ref_type text NOT NULL,
  ref_id text NOT NULL,
  metadata jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT message_references_pkey PRIMARY KEY (id),
  CONSTRAINT message_references_message_id_fkey FOREIGN KEY (message_id) REFERENCES public.messages(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL,
  admin_id uuid,
  content text,
  references_json jsonb,
  tags ARRAY,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_conversation_id_fkey FOREIGN KEY (conversation_id) REFERENCES public.conversations(id),
  CONSTRAINT messages_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid,
  type character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.post_analytics (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  event_type character varying NOT NULL,
  event_data jsonb DEFAULT '{}'::jsonb,
  user_ip character varying,
  user_agent text,
  referrer text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT post_analytics_pkey PRIMARY KEY (id),
  CONSTRAINT post_analytics_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id)
);
CREATE TABLE public.posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  content text NOT NULL,
  excerpt text,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['blog'::character varying::text, 'poem'::character varying::text])),
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::character varying::text, 'published'::character varying::text, 'archived'::character varying::text])),
  admin_id uuid,
  featured boolean DEFAULT false,
  reading_time integer,
  tags ARRAY,
  media_files jsonb DEFAULT '[]'::jsonb,
  seo_title character varying,
  seo_description text,
  slug character varying UNIQUE,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT posts_pkey PRIMARY KEY (id),
  CONSTRAINT posts_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.push_notification_drafts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  body text,
  url text,
  type text DEFAULT 'manual'::text,
  icon text,
  image text,
  actions jsonb,
  created_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT push_notification_drafts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.push_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  url text,
  type text NOT NULL DEFAULT 'manual'::text,
  icon text,
  image text,
  actions jsonb,
  sent_count integer NOT NULL DEFAULT 0,
  sent_by text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT push_notifications_pkey PRIMARY KEY (id)
);
CREATE TABLE public.push_subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  user_agent text,
  ip_address inet,
  browser_info jsonb,
  subscribed_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  last_active_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  is_active boolean DEFAULT true,
  user_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid,
  user_ip character varying,
  user_agent text,
  reaction_type character varying NOT NULL CHECK (reaction_type::text = ANY (ARRAY['like'::character varying::text, 'love'::character varying::text, 'wow'::character varying::text, 'haha'::character varying::text, 'sad'::character varying::text, 'angry'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  user_id uuid,
  CONSTRAINT reactions_pkey PRIMARY KEY (id),
  CONSTRAINT reactions_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.posts(id),
  CONSTRAINT reactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  theme text DEFAULT 'system'::text,
  auto_save boolean DEFAULT true,
  email_notifications boolean DEFAULT true,
  push_notifications boolean DEFAULT false,
  two_factor_auth boolean DEFAULT false,
  session_timeout integer DEFAULT 24,
  backup_frequency text DEFAULT 'weekly'::text,
  analytics_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT settings_pkey PRIMARY KEY (id),
  CONSTRAINT settings_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  url text NOT NULL,
  source character varying NOT NULL,
  utm boolean DEFAULT true,
  user_agent text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT shares_pkey PRIMARY KEY (id)
);
CREATE TABLE public.spoken_words (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title character varying NOT NULL,
  description text,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['audio'::character varying::text, 'video'::character varying::text])),
  media_id uuid NOT NULL,
  admin_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT spoken_words_pkey PRIMARY KEY (id),
  CONSTRAINT spoken_words_media_id_fkey FOREIGN KEY (media_id) REFERENCES public.media(id),
  CONSTRAINT spoken_words_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);
CREATE TABLE public.wall_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wall_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  admin_response text,
  admin_response_updated_at timestamp with time zone,
  CONSTRAINT wall_comments_pkey PRIMARY KEY (id),
  CONSTRAINT wall_comments_wall_id_fkey FOREIGN KEY (wall_id) REFERENCES public.whispr_wall(id)
);
CREATE TABLE public.wall_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  wall_id uuid NOT NULL,
  user_ip text NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like'::text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wall_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT wall_reactions_wall_id_fkey FOREIGN KEY (wall_id) REFERENCES public.whispr_wall(id)
);
CREATE TABLE public.whispr_wall (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  response text,
  admin_id uuid,
  CONSTRAINT whispr_wall_pkey PRIMARY KEY (id),
  CONSTRAINT whispr_wall_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id)
);