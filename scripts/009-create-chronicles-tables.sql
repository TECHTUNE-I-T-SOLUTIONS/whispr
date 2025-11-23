-- Whispr Chronicles: Creator Platform
-- New tables for the Chronicles feature (Writer/Creator Management)

-- Chronicles Programs (Contest/Campaign Management)
CREATE TABLE IF NOT EXISTS chronicles_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'ended', 'paused')),
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Creator Accounts (Participants/Writers)
CREATE TABLE IF NOT EXISTS chronicles_creators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES chronicles_programs(id) ON DELETE CASCADE,
  
  -- Profile Info
  pen_name TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  social_links JSONB DEFAULT '{}'::JSONB, -- {twitter, instagram, linkedin, website}
  
  -- Preferences
  content_type TEXT DEFAULT 'blog' CHECK (content_type IN ('blog', 'poem', 'both')),
  preferred_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status & Role
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending')),
  role TEXT DEFAULT 'creator' CHECK (role IN ('creator', 'verified_creator', 'sub_admin')),
  is_verified BOOLEAN DEFAULT FALSE,
  is_banned BOOLEAN DEFAULT FALSE,
  
  -- Gamification
  streak_count INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  total_posts INT DEFAULT 0,
  total_poems INT DEFAULT 0,
  total_blog_posts INT DEFAULT 0,
  total_engagement INT DEFAULT 0, -- comments + likes combined
  total_shares INT DEFAULT 0,
  
  -- Rewards & Achievements
  points INT DEFAULT 0,
  badges TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array of badge IDs earned
  sub_admin_offered BOOLEAN DEFAULT FALSE,
  sub_admin_offered_at TIMESTAMP WITH TIME ZONE,
  
  -- Settings
  push_notifications_enabled BOOLEAN DEFAULT TRUE,
  email_digest_enabled BOOLEAN DEFAULT TRUE,
  email_on_engagement BOOLEAN DEFAULT TRUE,
  profile_visibility TEXT DEFAULT 'public' CHECK (profile_visibility IN ('public', 'private')),
  
  -- Tracking
  last_post_date TIMESTAMP WITH TIME ZONE,
  last_activity_at TIMESTAMP WITH TIME ZONE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Posts (Creator-written content)
CREATE TABLE IF NOT EXISTS chronicles_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Content
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  cover_image_url TEXT,
  
  -- Metadata
  post_type TEXT DEFAULT 'blog' CHECK (post_type IN ('blog', 'poem')),
  category TEXT,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'scheduled')),
  
  -- Formatting
  formatting_data JSONB DEFAULT '{}'::JSONB, -- Rich text format (for WYSIWYG)
  
  -- Engagement
  likes_count INT DEFAULT 0,
  comments_count INT DEFAULT 0,
  shares_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Engagement (Likes, Comments, Shares)
CREATE TABLE IF NOT EXISTS chronicles_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  engagement_type TEXT NOT NULL CHECK (engagement_type IN ('like', 'comment', 'share')),
  content TEXT, -- For comments only
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(post_id, user_id, engagement_type) -- Prevent duplicate likes/shares
);

-- Chronicles Creator Notifications (Notifications for creators)
CREATE TABLE IF NOT EXISTS chronicles_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  type TEXT NOT NULL CHECK (type IN (
    'new_post_published', 'post_liked', 'post_commented', 'post_shared',
    'follower_joined', 'badge_earned', 'streak_milestone', 'sub_admin_offered',
    'engagement_summary', 'comment_reply', 'system'
  )),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related data
  related_post_id UUID REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  related_creator_id UUID REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  data JSONB DEFAULT '{}'::JSONB, -- Additional context
  
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Notifications for Creator Actions (linked to admin notifications)
CREATE TABLE IF NOT EXISTS chronicles_admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin(id) ON DELETE SET NULL,
  
  activity_type TEXT NOT NULL CHECK (activity_type IN (
    'creator_signup', 'creator_banned', 'post_reported', 'post_removed',
    'comment_removed', 'badge_awarded', 'sub_admin_offered', 'feature_toggled'
  )),
  
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  post_id UUID REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Push Subscriptions for Creators
CREATE TABLE IF NOT EXISTS chronicles_push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  endpoint TEXT NOT NULL UNIQUE,
  auth TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  
  user_agent TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Streak Tracking (Daily tracking for streak logic)
CREATE TABLE IF NOT EXISTS chronicles_streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  streak_date DATE NOT NULL,
  post_count INT DEFAULT 0,
  engagement_count INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(creator_id, streak_date)
);

-- Chronicles Achievements/Badges (Definition table)
CREATE TABLE IF NOT EXISTS chronicles_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  badge_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon_url TEXT,
  requirement TEXT, -- Description of how to earn
  points_reward INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Chronicles Creator Achievements (Earned by creators)
CREATE TABLE IF NOT EXISTS chronicles_creator_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES chronicles_achievements(id) ON DELETE CASCADE,
  
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(creator_id, achievement_id)
);

-- Chronicles Feature Flag (Global control)
CREATE TABLE IF NOT EXISTS chronicles_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value TEXT,
  description TEXT,
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert initial settings
INSERT INTO chronicles_settings (setting_key, setting_value, description) 
VALUES 
  ('feature_enabled', 'false', 'Enable/disable entire Chronicles feature'),
  ('registration_open', 'false', 'Allow new creator registrations'),
  ('max_creators_per_program', '500', 'Maximum creators allowed per program'),
  ('require_email_verification', 'true', 'Require email verification for signup'),
  ('min_bio_length', '10', 'Minimum bio character length'),
  ('post_moderation_enabled', 'true', 'Require post approval before publishing'),
  ('notification_digest_frequency', 'daily', 'Daily, weekly, or realtime')
ON CONFLICT (setting_key) DO NOTHING;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_user_id ON chronicles_creators(user_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_program_id ON chronicles_creators(program_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_role ON chronicles_creators(role);
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_status ON chronicles_creators(status);
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_pen_name ON chronicles_creators(pen_name);

CREATE INDEX IF NOT EXISTS idx_chronicles_posts_creator_id ON chronicles_posts(creator_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_posts_status ON chronicles_posts(status);
CREATE INDEX IF NOT EXISTS idx_chronicles_posts_post_type ON chronicles_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_chronicles_posts_published_at ON chronicles_posts(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_chronicles_posts_category ON chronicles_posts(category);
CREATE INDEX IF NOT EXISTS idx_chronicles_posts_slug ON chronicles_posts(slug);

CREATE INDEX IF NOT EXISTS idx_chronicles_engagement_post_id ON chronicles_engagement(post_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_engagement_user_id ON chronicles_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_engagement_type ON chronicles_engagement(engagement_type);

CREATE INDEX IF NOT EXISTS idx_chronicles_notifications_creator_id ON chronicles_notifications(creator_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_notifications_read ON chronicles_notifications(read);
CREATE INDEX IF NOT EXISTS idx_chronicles_notifications_created_at ON chronicles_notifications(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chronicles_admin_activity_creator_id ON chronicles_admin_activity_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_admin_activity_type ON chronicles_admin_activity_log(activity_type);

CREATE INDEX IF NOT EXISTS idx_chronicles_streak_creator_date ON chronicles_streak_history(creator_id, streak_date DESC);

CREATE INDEX IF NOT EXISTS idx_chronicles_push_subscriptions_creator ON chronicles_push_subscriptions(creator_id);

-- Enable RLS (Row Level Security) for data isolation
ALTER TABLE chronicles_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_engagement ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_streak_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_creator_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Create Storage Bucket for Creator Profiles
-- Note: Run this via Supabase Dashboard UI or via API
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronicles-profiles', 'chronicles-profiles', true);

-- Storage Bucket for Post Images (Google Drive URLs will be used primarily)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronicles-posts', 'chronicles-posts', true);

-- RLS Policies will be set up in admin section or via separate policy file

-- =====================================================
-- TRIGGERS FOR NOTIFICATIONS & AUTOMATED ACTIONS
-- =====================================================

-- Trigger: Notify creator when post is published
CREATE OR REPLACE FUNCTION notify_post_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO chronicles_notifications (creator_id, type, title, message, related_post_id)
    SELECT NEW.creator_id, 'new_post_published', 'Post Published!', 
           'Your post "' || NEW.title || '" is now live!', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_published
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_post_published();

-- Trigger: Update post engagement counts on engagement
CREATE OR REPLACE FUNCTION update_post_engagement_counts()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.engagement_type = 'like' THEN
      UPDATE chronicles_posts SET likes_count = likes_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.engagement_type = 'comment' THEN
      UPDATE chronicles_posts SET comments_count = comments_count + 1 WHERE id = NEW.post_id;
    ELSIF NEW.engagement_type = 'share' THEN
      UPDATE chronicles_posts SET shares_count = shares_count + 1 WHERE id = NEW.post_id;
    END IF;
    
    -- Notify creator of engagement
    INSERT INTO chronicles_notifications (creator_id, type, title, message, related_post_id, data)
    SELECT cc.id, CONCAT('post_', NEW.engagement_type), 
           'New ' || NEW.engagement_type || '!',
           'Your post received a new ' || NEW.engagement_type,
           NEW.post_id,
           jsonb_build_object('engagement_id', NEW.id)
    FROM chronicles_posts cp
    JOIN chronicles_creators cc ON cp.creator_id = cc.id
    WHERE cp.id = NEW.post_id;
    
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.engagement_type = 'like' THEN
      UPDATE chronicles_posts SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.engagement_type = 'comment' THEN
      UPDATE chronicles_posts SET comments_count = GREATEST(comments_count - 1, 0) WHERE id = OLD.post_id;
    ELSIF OLD.engagement_type = 'share' THEN
      UPDATE chronicles_posts SET shares_count = GREATEST(shares_count - 1, 0) WHERE id = OLD.post_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_engagement_counts
AFTER INSERT OR DELETE ON chronicles_engagement
FOR EACH ROW
EXECUTE FUNCTION update_post_engagement_counts();

-- Trigger: Update creator stats when post is published
CREATE OR REPLACE FUNCTION update_creator_stats_on_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    UPDATE chronicles_creators
    SET 
      total_posts = total_posts + 1,
      total_blog_posts = CASE WHEN NEW.post_type = 'blog' THEN total_blog_posts + 1 ELSE total_blog_posts END,
      total_poems = CASE WHEN NEW.post_type = 'poem' THEN total_poems + 1 ELSE total_poems END,
      last_post_date = NEW.published_at,
      last_activity_at = NOW()
    WHERE id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_stats
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats_on_post();

-- Trigger: Create admin notification when new creator signs up
CREATE OR REPLACE FUNCTION log_creator_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_admin_activity_log (activity_type, creator_id, title, description)
  VALUES ('creator_signup', NEW.id, 'New Creator Signup', 
          'Creator ' || NEW.pen_name || ' (' || NEW.email || ') has joined Chronicles');
  
  -- Insert into admin notifications
  INSERT INTO notifications (admin_id, type, title, message)
  SELECT a.id, 'chronicles_creator_signup', 'New Chronicles Creator', 
         'Creator ' || NEW.pen_name || ' has signed up'
  FROM admin a
  WHERE a.role = 'admin' OR a.role = 'super_admin'
  LIMIT 1; -- Notify at least one admin
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_creator_signup
AFTER INSERT ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION log_creator_signup();

-- Trigger: Log when post reaches milestones (100 likes, 50 comments, etc)
CREATE OR REPLACE FUNCTION check_engagement_milestones()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.likes_count = 100 AND OLD.likes_count < 100 THEN
    INSERT INTO chronicles_notifications (creator_id, type, title, message, related_post_id)
    SELECT cc.id, 'streak_milestone', '🌟 Viral Post!', 
           'Your post "' || NEW.title || '" reached 100 likes!', NEW.id
    FROM chronicles_creators cc
    WHERE cc.id = NEW.creator_id;
  END IF;
  
  IF NEW.comments_count = 50 AND OLD.comments_count < 50 THEN
    INSERT INTO chronicles_notifications (creator_id, type, title, message, related_post_id)
    SELECT cc.id, 'streak_milestone', '💬 Community Favorite!', 
           'Your post received 50+ comments!', NEW.id
    FROM chronicles_creators cc
    WHERE cc.id = NEW.creator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_engagement_milestones
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION check_engagement_milestones();

-- Trigger: Update last_activity_at on any engagement
CREATE OR REPLACE FUNCTION update_creator_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_creators
  SET last_activity_at = NOW()
  WHERE id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

-- Trigger: Clean up read notifications older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM chronicles_notifications
  WHERE read = true AND created_at < NOW() - INTERVAL '30 days';
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Run cleanup job periodically (daily)
-- SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications()');

-- Trigger: Auto-mark posts as published when scheduled_for time arrives
-- This would typically be handled by a background job, not a trigger
