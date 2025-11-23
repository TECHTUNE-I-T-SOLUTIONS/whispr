-- WHISPR CHRONICLES - SETTINGS & CONFIGURATION TABLES
-- Comprehensive settings management and configuration storage
-- Run this AFTER running 011-chronicles-analytics-tables.sql

-- =====================================================
-- SYSTEM SETTINGS
-- =====================================================

-- Chronicles System Settings
CREATE TABLE IF NOT EXISTS chronicles_system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Feature Flags
  feature_enabled BOOLEAN DEFAULT TRUE,
  registration_open BOOLEAN DEFAULT TRUE,
  maintenance_mode BOOLEAN DEFAULT FALSE,
  
  -- Post Restrictions
  max_posts_per_day INT DEFAULT 10,
  min_content_length INT DEFAULT 10,
  max_content_length INT DEFAULT 50000,
  auto_publish_delay_seconds INT DEFAULT 0,
  require_email_verification BOOLEAN DEFAULT FALSE,
  
  -- Comment Settings
  allow_anonymous_comments BOOLEAN DEFAULT FALSE,
  comments_require_moderation BOOLEAN DEFAULT FALSE,
  allow_comment_threads BOOLEAN DEFAULT TRUE,
  max_comment_depth INT DEFAULT 5,
  
  -- Content Moderation
  enable_content_moderation BOOLEAN DEFAULT TRUE,
  auto_flag_duplicates BOOLEAN DEFAULT FALSE,
  min_moderation_score_for_publish INT DEFAULT 0,
  
  -- Safety Settings
  enable_adult_content_filter BOOLEAN DEFAULT TRUE,
  enable_spam_detection BOOLEAN DEFAULT TRUE,
  enable_bot_detection BOOLEAN DEFAULT TRUE,
  
  -- Monetization Settings
  enable_monetization BOOLEAN DEFAULT TRUE,
  enable_ads BOOLEAN DEFAULT TRUE,
  enable_tips BOOLEAN DEFAULT TRUE,
  enable_subscriptions BOOLEAN DEFAULT TRUE,
  
  -- Notification Settings
  enable_notifications BOOLEAN DEFAULT TRUE,
  notification_batch_delay_minutes INT DEFAULT 5,
  
  -- Performance Settings
  cache_duration_minutes INT DEFAULT 30,
  enable_caching BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Content Policy Settings
CREATE TABLE IF NOT EXISTS chronicles_content_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  policy_name TEXT NOT NULL UNIQUE,
  description TEXT,
  
  -- Policy Rules
  prohibited_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
  prohibited_content_types TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'hate_speech', 'violence', 'nsfw', etc
  
  -- Enforcement
  enforcement_level TEXT DEFAULT 'warning', -- 'warning', 'hide', 'remove', 'ban'
  auto_enforcement BOOLEAN DEFAULT FALSE,
  require_manual_review BOOLEAN DEFAULT TRUE,
  
  -- Categories this applies to
  applies_to_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Email Configuration Settings
CREATE TABLE IF NOT EXISTS chronicles_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Email Templates
  welcome_email_enabled BOOLEAN DEFAULT TRUE,
  digest_email_enabled BOOLEAN DEFAULT TRUE,
  notification_email_enabled BOOLEAN DEFAULT TRUE,
  
  -- Email Frequency
  digest_frequency TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'never'
  max_emails_per_day INT DEFAULT 5,
  
  -- Email Content
  include_recommendations BOOLEAN DEFAULT TRUE,
  include_trending_posts BOOLEAN DEFAULT TRUE,
  include_follower_updates BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Push Notification Settings
CREATE TABLE IF NOT EXISTS chronicles_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Notification Types
  notify_on_follow BOOLEAN DEFAULT TRUE,
  notify_on_like BOOLEAN DEFAULT TRUE,
  notify_on_comment BOOLEAN DEFAULT TRUE,
  notify_on_mention BOOLEAN DEFAULT TRUE,
  notify_on_viral_post BOOLEAN DEFAULT TRUE,
  notify_on_monetization_milestone BOOLEAN DEFAULT TRUE,
  notify_on_leaderboard_change BOOLEAN DEFAULT TRUE,
  
  -- Notification Frequency
  batch_notifications BOOLEAN DEFAULT TRUE,
  batch_delay_minutes INT DEFAULT 15,
  
  -- Quiet Hours
  quiet_hours_enabled BOOLEAN DEFAULT FALSE,
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  
  -- Do Not Disturb
  dnd_enabled BOOLEAN DEFAULT FALSE,
  dnd_until TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Leaderboard Settings
CREATE TABLE IF NOT EXISTS chronicles_leaderboard_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Scoring Algorithm
  post_weight INT DEFAULT 10,
  engagement_weight INT DEFAULT 2,
  streak_weight INT DEFAULT 5,
  follow_weight INT DEFAULT 1,
  
  -- Categories
  show_weekly_leaderboard BOOLEAN DEFAULT TRUE,
  show_monthly_leaderboard BOOLEAN DEFAULT TRUE,
  show_alltime_leaderboard BOOLEAN DEFAULT TRUE,
  show_trending_leaderboard BOOLEAN DEFAULT TRUE,
  
  -- Display
  leaderboard_size INT DEFAULT 100,
  show_creator_stats BOOLEAN DEFAULT TRUE,
  show_trending_posts BOOLEAN DEFAULT TRUE,
  
  -- Reset Schedule
  weekly_reset_day TEXT DEFAULT 'sunday',
  weekly_reset_time TIME DEFAULT '00:00:00',
  monthly_reset_day INT DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Gamification Settings
CREATE TABLE IF NOT EXISTS chronicles_gamification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Point System
  points_per_post INT DEFAULT 10,
  points_per_like INT DEFAULT 1,
  points_per_comment INT DEFAULT 2,
  points_per_share INT DEFAULT 5,
  points_per_follow INT DEFAULT 3,
  
  -- Streak Bonuses
  streak_bonus_percentage INT DEFAULT 10, -- multiplier for daily streaks
  max_streak_bonus_days INT DEFAULT 30,
  
  -- Badges
  enable_badges BOOLEAN DEFAULT TRUE,
  show_badge_notifications BOOLEAN DEFAULT TRUE,
  
  -- Achievements
  enable_achievements BOOLEAN DEFAULT TRUE,
  achievement_notification_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Monetization Settings
CREATE TABLE IF NOT EXISTS chronicles_monetization_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Ad Settings
  ad_revenue_share_percentage NUMERIC(5, 2) DEFAULT 70.00, -- Creator gets 70% of ad revenue
  min_daily_earnings_for_payout NUMERIC(12, 2) DEFAULT 5.00,
  payout_threshold NUMERIC(12, 2) DEFAULT 100.00,
  
  -- Tip Settings
  enable_tipping BOOLEAN DEFAULT TRUE,
  tip_minimum NUMERIC(10, 2) DEFAULT 0.99,
  tip_maximum NUMERIC(10, 2) DEFAULT 999.99,
  platform_fee_percentage NUMERIC(5, 2) DEFAULT 5.00,
  
  -- Subscription Settings
  enable_subscriptions BOOLEAN DEFAULT TRUE,
  default_subscription_price NUMERIC(10, 2) DEFAULT 4.99,
  platform_subscription_fee_percentage NUMERIC(5, 2) DEFAULT 30.00,
  
  -- Payout Settings
  payout_frequency TEXT DEFAULT 'weekly', -- 'daily', 'weekly', 'monthly'
  payout_method_enabled TEXT[] DEFAULT ARRAY['bank_transfer', 'paypal']::TEXT[],
  
  -- Currency
  base_currency TEXT DEFAULT 'USD',
  exchange_rate_update_frequency TEXT DEFAULT 'daily',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CATEGORY & THEME SETTINGS
-- =====================================================

-- Content Categories Configuration
CREATE TABLE IF NOT EXISTS chronicles_category_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  category_name TEXT NOT NULL UNIQUE,
  category_slug TEXT NOT NULL UNIQUE,
  
  description TEXT,
  icon_url TEXT,
  color_code TEXT, -- Hex color for UI
  
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INT DEFAULT 0,
  
  -- Policies
  require_moderation BOOLEAN DEFAULT FALSE,
  min_age_rating INT DEFAULT 13,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Theme Settings
CREATE TABLE IF NOT EXISTS chronicles_theme_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Branding
  platform_name TEXT DEFAULT 'Chronicles',
  logo_url TEXT,
  favicon_url TEXT,
  
  -- Colors
  primary_color TEXT DEFAULT '#6366f1',
  secondary_color TEXT DEFAULT '#ec4899',
  accent_color TEXT DEFAULT '#f59e0b',
  
  -- Fonts
  primary_font TEXT DEFAULT 'Inter',
  heading_font TEXT DEFAULT 'Poppins',
  
  -- Layout
  max_content_width INT DEFAULT 1200,
  enable_dark_mode BOOLEAN DEFAULT TRUE,
  dark_mode_default BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- API Rate Limiting Settings
CREATE TABLE IF NOT EXISTS chronicles_rate_limiting_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Global limits
  global_requests_per_minute INT DEFAULT 1000,
  
  -- Per-user limits
  user_requests_per_minute INT DEFAULT 60,
  user_requests_per_hour INT DEFAULT 1000,
  
  -- Specific endpoint limits
  create_post_per_hour INT DEFAULT 10,
  create_comment_per_hour INT DEFAULT 100,
  like_per_hour INT DEFAULT 500,
  
  -- Enable/disable
  rate_limiting_enabled BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INDEXES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_content_policies_active ON chronicles_content_policies(is_active);
CREATE INDEX IF NOT EXISTS idx_category_settings_active ON chronicles_category_settings(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_leaderboard_settings_id ON chronicles_leaderboard_settings(id);
CREATE INDEX IF NOT EXISTS idx_monetization_settings_id ON chronicles_monetization_settings(id);

-- =====================================================
-- INITIAL CONFIGURATION DATA
-- =====================================================

-- Insert default system settings
INSERT INTO chronicles_system_settings (
  feature_enabled, registration_open, max_posts_per_day, min_content_length,
  require_email_verification, allow_anonymous_comments
) VALUES (
  TRUE, TRUE, 10, 10, FALSE, FALSE
)
ON CONFLICT DO NOTHING;

-- Insert default content policies
INSERT INTO chronicles_content_policies (policy_name, description, enforcement_level, is_active)
VALUES
  ('Hate Speech', 'Prohibits hateful speech targeting protected groups', 'remove', TRUE),
  ('Violence', 'Prohibits content glorifying or promoting violence', 'remove', TRUE),
  ('Harassment', 'Prohibits targeted harassment or bullying', 'hide', TRUE),
  ('Spam', 'Prohibits spam and commercial content', 'hide', TRUE),
  ('Misinformation', 'Flags potentially false health or safety claims', 'warning', TRUE)
ON CONFLICT (policy_name) DO NOTHING;

-- Insert default categories
INSERT INTO chronicles_category_settings (category_name, category_slug, description, is_active, display_order)
VALUES
  ('Personal Stories', 'personal-stories', 'Share your personal experiences and life stories', TRUE, 1),
  ('Poetry', 'poetry', 'Creative poetry and verse', TRUE, 2),
  ('Audio Performances', 'audio-performances', 'Music, spoken word, and audio content', TRUE, 3),
  ('Wellness', 'wellness', 'Mental health, fitness, and wellbeing', TRUE, 4),
  ('Creativity', 'creativity', 'Art, design, and creative projects', TRUE, 5),
  ('Inspiration', 'inspiration', 'Motivational and inspiring content', TRUE, 6),
  ('Lifestyle', 'lifestyle', 'Fashion, home, and lifestyle tips', TRUE, 7),
  ('Technology', 'technology', 'Tech tips, reviews, and insights', TRUE, 8)
ON CONFLICT (category_name) DO NOTHING;

-- Insert default leaderboard settings
INSERT INTO chronicles_leaderboard_settings (
  post_weight, engagement_weight, streak_weight, follow_weight,
  show_weekly_leaderboard, show_monthly_leaderboard, show_alltime_leaderboard
) VALUES (
  10, 2, 5, 1, TRUE, TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- Insert default gamification settings
INSERT INTO chronicles_gamification_settings (
  points_per_post, points_per_like, points_per_comment, points_per_share,
  streak_bonus_percentage, enable_badges
) VALUES (
  10, 1, 2, 5, 10, TRUE
)
ON CONFLICT DO NOTHING;

-- Insert default monetization settings
INSERT INTO chronicles_monetization_settings (
  ad_revenue_share_percentage, payout_threshold, enable_tipping,
  enable_subscriptions, payout_frequency
) VALUES (
  70.00, 100.00, TRUE, TRUE, 'weekly'
)
ON CONFLICT DO NOTHING;

-- Insert default theme settings
INSERT INTO chronicles_theme_settings (
  platform_name, primary_color, secondary_color, enable_dark_mode
) VALUES (
  'Chronicles', '#6366f1', '#ec4899', TRUE
)
ON CONFLICT DO NOTHING;

-- Insert default notification settings
INSERT INTO chronicles_notification_settings (
  notify_on_follow, notify_on_like, notify_on_comment, notify_on_mention,
  batch_notifications, batch_delay_minutes, quiet_hours_enabled
) VALUES (
  TRUE, TRUE, TRUE, TRUE, TRUE, 15, FALSE
)
ON CONFLICT DO NOTHING;

-- Insert default email settings
INSERT INTO chronicles_email_settings (
  welcome_email_enabled, digest_email_enabled, digest_frequency,
  include_recommendations, include_trending_posts
) VALUES (
  TRUE, TRUE, 'daily', TRUE, TRUE
)
ON CONFLICT DO NOTHING;

-- Insert default rate limiting settings
INSERT INTO chronicles_rate_limiting_settings (
  global_requests_per_minute, user_requests_per_minute,
  create_post_per_hour, rate_limiting_enabled
) VALUES (
  1000, 60, 10, TRUE
)
ON CONFLICT DO NOTHING;

COMMIT;
