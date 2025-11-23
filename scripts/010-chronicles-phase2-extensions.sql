-- WHISPR CHRONICLES - PHASE 2 EXTENSIONS
-- Leaderboard, Comments, Monetization, and Enhanced Admin Notifications
-- Run this AFTER running 009-create-chronicles-tables.sql

-- =====================================================
-- LEADERBOARD & DISCOVERY (Public Feed)
-- =====================================================

-- Leaderboard Table (Cached rankings for performance)
CREATE TABLE IF NOT EXISTS chronicles_leaderboard (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  rank INT,
  category TEXT, -- 'weekly', 'monthly', 'alltime', 'trending'
  score INT NOT NULL DEFAULT 0, -- Calculated from engagement, posts, streak
  
  calculation_method TEXT DEFAULT 'weighted', -- weighted engagement + post frequency + streak
  calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Creator Feed (For discovery/public feed)
CREATE TABLE IF NOT EXISTS chronicles_feed_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Interests for personalization
  followed_categories TEXT[] DEFAULT ARRAY[]::TEXT[],
  followed_creators UUID[] DEFAULT ARRAY[]::UUID[],
  blocked_creators UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Feed settings
  feed_algorithm TEXT DEFAULT 'trending', -- trending, chronological, personalized
  show_adult_content BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(creator_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboard_rank ON chronicles_leaderboard(rank);
CREATE INDEX IF NOT EXISTS idx_leaderboard_category ON chronicles_leaderboard(category);
CREATE INDEX IF NOT EXISTS idx_feed_preferences_creator ON chronicles_feed_preferences(creator_id);

-- =====================================================
-- GAMIFICATION UI & ACHIEVEMENTS
-- =====================================================

-- Badges Display & Tier System
CREATE TABLE IF NOT EXISTS chronicles_badge_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 'Beginner', 'Rising Star', 'Creator', 'Influencer'
  level INT NOT NULL UNIQUE,
  min_points INT NOT NULL,
  max_points INT,
  icon_url TEXT,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Streak Achievements
CREATE TABLE IF NOT EXISTS chronicles_streak_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  
  milestone_7 BOOLEAN DEFAULT FALSE, -- 7-day streak milestone
  milestone_14 BOOLEAN DEFAULT FALSE,
  milestone_30 BOOLEAN DEFAULT FALSE,
  milestone_100 BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(creator_id)
);

-- Points & Rewards History (For audit trail)
CREATE TABLE IF NOT EXISTS chronicles_points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  points INT NOT NULL,
  reason TEXT NOT NULL, -- 'post_published', 'received_like', 'streak_milestone', 'badge_earned'
  related_post_id UUID REFERENCES chronicles_posts(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_streak_achievements_creator ON chronicles_streak_achievements(creator_id);
CREATE INDEX IF NOT EXISTS idx_points_history_creator ON chronicles_points_history(creator_id);

-- =====================================================
-- COMMENTS SYSTEM WITH THREADING
-- =====================================================

-- Comments Table (Supports threading/replies)
CREATE TABLE IF NOT EXISTS chronicles_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES chronicles_comments(id) ON DELETE CASCADE, -- For replies/threading
  
  likes_count INT DEFAULT 0,
  replies_count INT DEFAULT 0,
  
  status TEXT DEFAULT 'approved' CHECK (status IN ('approved', 'pending', 'rejected', 'hidden')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comment Reactions/Likes
CREATE TABLE IF NOT EXISTS chronicles_comment_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  comment_id UUID NOT NULL REFERENCES chronicles_comments(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like', 'helpful', 'love', 'funny')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(comment_id, creator_id, reaction_type)
);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON chronicles_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_creator_id ON chronicles_comments(creator_id);
CREATE INDEX IF NOT EXISTS idx_comments_parent_id ON chronicles_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_comment ON chronicles_comment_reactions(comment_id);

-- =====================================================
-- MONETIZATION INTEGRATION
-- =====================================================

-- Creator Monetization Programs
CREATE TABLE IF NOT EXISTS chronicles_monetization (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Program Status
  enrolled BOOLEAN DEFAULT FALSE,
  program_status TEXT DEFAULT 'inactive' CHECK (program_status IN ('inactive', 'active', 'suspended', 'approved')),
  
  -- Revenue Sharing
  revenue_share_percent INT DEFAULT 50, -- Platform keeps 50%, creator gets 50%
  ad_consent BOOLEAN DEFAULT FALSE,
  ad_network_id TEXT, -- For ad network integration
  
  -- Bank Details (Encrypted in production)
  payment_method TEXT, -- 'stripe', 'paypal', 'bank_transfer'
  payment_details JSONB DEFAULT '{}'::JSONB, -- Encrypted payment info
  
  -- Earnings
  total_earned DECIMAL(10, 2) DEFAULT 0,
  pending_balance DECIMAL(10, 2) DEFAULT 0,
  last_payout_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Earnings Transaction History
CREATE TABLE IF NOT EXISTS chronicles_earnings_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('ad_revenue', 'tip', 'subscription', 'payout')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'reversed')),
  
  reference_id TEXT, -- External transaction ID
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Ad Network Integration
CREATE TABLE IF NOT EXISTS chronicles_ad_placements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  placement_name TEXT NOT NULL UNIQUE, -- 'feed_sidebar', 'post_below_content', 'creator_profile'
  position TEXT NOT NULL,
  ad_type TEXT NOT NULL CHECK (ad_type IN ('banner', 'native', 'video', 'sponsored_post')),
  
  enabled BOOLEAN DEFAULT TRUE,
  ad_network TEXT, -- 'adsense', 'custom_network', 'sponsorship'
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ad Analytics
CREATE TABLE IF NOT EXISTS chronicles_ad_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_id UUID NOT NULL REFERENCES chronicles_ad_placements(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  impressions INT DEFAULT 0,
  clicks INT DEFAULT 0,
  revenue DECIMAL(10, 2) DEFAULT 0,
  
  recorded_date DATE NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_monetization_creator ON chronicles_monetization(creator_id);
CREATE INDEX IF NOT EXISTS idx_earnings_creator ON chronicles_earnings_transactions(creator_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_placement ON chronicles_ad_analytics(placement_id);
CREATE INDEX IF NOT EXISTS idx_ad_analytics_creator ON chronicles_ad_analytics(creator_id);

-- =====================================================
-- ADMIN NOTIFICATIONS (For Platform Admins)
-- =====================================================

-- Enhanced Admin Notifications Table
CREATE TABLE IF NOT EXISTS chronicles_admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  notification_type TEXT NOT NULL CHECK (notification_type IN (
    'creator_signup', 'creator_milestone', 'post_viral', 'post_reported', 'comment_flagged',
    'high_engagement', 'low_quality_post', 'creator_banned', 'revenue_milestone',
    'subscriber_milestone', 'admin_action_needed', 'system_alert'
  )),
  
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  
  -- Related Data
  creator_id UUID REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  post_id UUID REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES chronicles_comments(id) ON DELETE CASCADE,
  
  -- Urgency & Priority
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  -- Status
  read BOOLEAN DEFAULT FALSE,
  read_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  read_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  
  -- Data Payload
  data JSONB DEFAULT '{}'::JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Admin Notification Preferences
CREATE TABLE IF NOT EXISTS chronicles_admin_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification Preferences
  notify_new_creators BOOLEAN DEFAULT TRUE,
  notify_viral_posts BOOLEAN DEFAULT TRUE,
  notify_reported_content BOOLEAN DEFAULT TRUE,
  notify_revenue_milestones BOOLEAN DEFAULT TRUE,
  notify_high_engagement BOOLEAN DEFAULT TRUE,
  notify_system_alerts BOOLEAN DEFAULT TRUE,
  
  -- Frequency
  notification_frequency TEXT DEFAULT 'realtime' CHECK (notification_frequency IN ('realtime', 'daily', 'weekly', 'off')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(admin_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON chronicles_admin_notifications(notification_type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_read ON chronicles_admin_notifications(read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority ON chronicles_admin_notifications(priority);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created ON chronicles_admin_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_settings_admin ON chronicles_admin_notification_settings(admin_id);

-- =====================================================
-- ENHANCED TRIGGERS FOR ADMIN NOTIFICATIONS
-- =====================================================

-- Trigger: Notify admin when new creator signs up
CREATE OR REPLACE FUNCTION notify_admin_on_creator_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_admin_notifications (notification_type, creator_id, title, message, priority, data)
  VALUES (
    'creator_signup',
    NEW.id,
    'New Creator Signup',
    'Creator ' || NEW.pen_name || ' (' || NEW.email || ') has joined Chronicles',
    'normal',
    jsonb_build_object('pen_name', NEW.pen_name, 'email', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_creator_signup ON chronicles_creators;
CREATE TRIGGER trigger_creator_signup
AFTER INSERT ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_creator_signup();

-- Trigger: Notify admin when post reaches viral threshold (100+ likes)
CREATE OR REPLACE FUNCTION notify_admin_on_viral_post()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.likes_count >= 100 AND OLD.likes_count < 100 THEN
    INSERT INTO chronicles_admin_notifications (notification_type, creator_id, post_id, title, message, priority, data)
    SELECT 'post_viral', NEW.creator_id, NEW.id, 
           '🚀 Viral Post Alert!',
           'Post "' || NEW.title || '" reached ' || NEW.likes_count || ' likes',
           'high',
           jsonb_build_object('likes_count', NEW.likes_count, 'title', NEW.title)
    FROM chronicles_creators cc
    WHERE cc.id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_viral_post ON chronicles_posts;
CREATE TRIGGER trigger_viral_post
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_viral_post();

-- Trigger: Notify admin when creator reaches milestone (10 posts, 100 followers, etc)
CREATE OR REPLACE FUNCTION notify_admin_on_creator_milestone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_posts = 10 AND OLD.total_posts < 10 THEN
    INSERT INTO chronicles_admin_notifications (notification_type, creator_id, title, message, priority)
    VALUES ('creator_milestone', NEW.id, 'Creator Milestone: 10 Posts', 
            NEW.pen_name || ' has published their 10th post!', 'normal');
  END IF;
  
  IF NEW.total_posts = 50 AND OLD.total_posts < 50 THEN
    INSERT INTO chronicles_admin_notifications (notification_type, creator_id, title, message, priority)
    VALUES ('creator_milestone', NEW.id, 'Creator Milestone: 50 Posts', 
            NEW.pen_name || ' has published 50 posts!', 'normal');
  END IF;
  
  IF NEW.streak_count = 30 AND OLD.streak_count < 30 THEN
    INSERT INTO chronicles_admin_notifications (notification_type, creator_id, title, message, priority)
    VALUES ('creator_milestone', NEW.id, 'Creator Milestone: 30-Day Streak', 
            NEW.pen_name || ' has achieved a 30-day posting streak!', 'normal');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_creator_milestone ON chronicles_creators;
CREATE TRIGGER trigger_creator_milestone
AFTER UPDATE ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_creator_milestone();

-- Trigger: Notify admin on high engagement posts (50+ comments)
CREATE OR REPLACE FUNCTION notify_admin_on_high_engagement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.comments_count >= 50 AND OLD.comments_count < 50 THEN
    INSERT INTO chronicles_admin_notifications (notification_type, post_id, creator_id, title, message, priority, data)
    SELECT 'high_engagement', NEW.id, NEW.creator_id,
           '💬 High Engagement Post',
           'Post "' || NEW.title || '" has ' || NEW.comments_count || ' comments',
           'high',
           jsonb_build_object('comments_count', NEW.comments_count, 'engagement_total', 
                            NEW.likes_count + NEW.comments_count + NEW.shares_count)
    FROM chronicles_creators cc
    WHERE cc.id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_high_engagement ON chronicles_posts;
CREATE TRIGGER trigger_high_engagement
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_high_engagement();

-- Trigger: Create notification when comment is flagged/reported
CREATE OR REPLACE FUNCTION notify_admin_on_flagged_comment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'pending' THEN
    INSERT INTO chronicles_admin_notifications (notification_type, comment_id, post_id, creator_id, title, message, priority, data)
    VALUES ('comment_flagged', NEW.id, NEW.post_id, NEW.creator_id,
           'Comment Flagged for Review',
           'A comment has been flagged and requires review',
           'high',
           jsonb_build_object('comment_id', NEW.id, 'content', NEW.content));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_flagged_comment
AFTER INSERT OR UPDATE ON chronicles_comments
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_flagged_comment();

-- Trigger: Notify admin when creator reaches monetization milestone ($1000 earned)
CREATE OR REPLACE FUNCTION notify_admin_on_revenue_milestone()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.total_earned >= 1000 AND (OLD.total_earned IS NULL OR OLD.total_earned < 1000) THEN
    INSERT INTO chronicles_admin_notifications (notification_type, creator_id, title, message, priority, data)
    SELECT 'revenue_milestone', NEW.creator_id,
           '💰 Revenue Milestone: $1000 Earned',
           cc.pen_name || ' has earned $1000 on the platform!',
           'normal',
           jsonb_build_object('total_earned', NEW.total_earned)
    FROM chronicles_creators cc
    WHERE cc.id = NEW.creator_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_revenue_milestone
AFTER UPDATE ON chronicles_monetization
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_revenue_milestone();

-- Trigger: Auto-add points when post is published
CREATE OR REPLACE FUNCTION award_points_on_post_publish()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    UPDATE chronicles_creators
    SET points = points + 10  -- 10 points per published post
    WHERE id = NEW.creator_id;
    
    INSERT INTO chronicles_points_history (creator_id, points, reason, related_post_id)
    VALUES (NEW.creator_id, 10, 'post_published', NEW.id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_award_points ON chronicles_posts;
CREATE TRIGGER trigger_award_points
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION award_points_on_post_publish();

-- Trigger: Auto-add points when receiving engagement
CREATE OR REPLACE FUNCTION award_points_on_engagement()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.engagement_type = 'like' THEN
    UPDATE chronicles_creators cc
    SET points = points + 1
    FROM chronicles_posts cp
    WHERE cp.id = NEW.post_id AND cc.id = cp.creator_id;
    
    INSERT INTO chronicles_points_history (creator_id, points, reason, related_post_id)
    SELECT cp.creator_id, 1, 'received_like', NEW.post_id
    FROM chronicles_posts cp
    WHERE cp.id = NEW.post_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_engagement_points ON chronicles_engagement;
CREATE TRIGGER trigger_engagement_points
AFTER INSERT ON chronicles_engagement
FOR EACH ROW
EXECUTE FUNCTION award_points_on_engagement();

-- Trigger: Update leaderboard scores
CREATE OR REPLACE FUNCTION update_leaderboard_scores()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_leaderboard (creator_id, category, score, calculation_method)
  SELECT 
    cc.id,
    'weekly',
    (cc.total_engagement * 2) + (cc.total_posts * 10) + (cc.streak_count * 5),
    'weighted'
  FROM chronicles_creators cc
  WHERE cc.id = NEW.creator_id
  ON CONFLICT (creator_id) DO UPDATE
  SET score = EXCLUDED.score, updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard ON chronicles_creators;
CREATE TRIGGER trigger_update_leaderboard
AFTER UPDATE ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_scores();

-- Enable RLS for new tables
ALTER TABLE chronicles_leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_feed_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_badge_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_streak_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_points_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_comment_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_monetization ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_earnings_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_ad_placements ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_ad_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE chronicles_admin_notification_settings ENABLE ROW LEVEL SECURITY;

-- Insert initial badge tiers
INSERT INTO chronicles_badge_tiers (name, level, min_points, max_points, description)
VALUES
  ('Newcomer', 1, 0, 99, 'Welcome to Whispr Chronicles! Start your creator journey'),
  ('Rising Star', 2, 100, 499, 'Growing audience and engagement'),
  ('Creator', 3, 500, 1499, 'Established creator with solid following'),
  ('Influencer', 4, 1500, 4999, 'Influential voice in the community'),
  ('Legend', 5, 5000, NULL, 'Top creator on the platform')
ON CONFLICT (name) DO NOTHING;

-- Insert initial ad placements
INSERT INTO chronicles_ad_placements (placement_name, position, ad_type, ad_network, enabled)
VALUES
  ('feed_sidebar', 'right_sidebar', 'native', 'adsense', TRUE),
  ('post_below_content', 'after_post_body', 'banner', 'adsense', TRUE),
  ('creator_profile_sidebar', 'right_sidebar', 'native', 'custom_network', TRUE),
  ('sponsored_post', 'inline_feed', 'sponsored_post', 'sponsorship', FALSE)
ON CONFLICT (placement_name) DO NOTHING;

-- Completion message
SELECT 'Phase 2 Extensions Successfully Installed! ✅' AS status;
