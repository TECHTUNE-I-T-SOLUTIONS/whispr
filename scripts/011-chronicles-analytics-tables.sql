-- WHISPR CHRONICLES - ANALYTICS TABLES
-- Comprehensive analytics, metrics, and performance tracking
-- Run this AFTER running 010-chronicles-phase2-extensions.sql

-- =====================================================
-- ANALYTICS & METRICS TRACKING
-- =====================================================

-- Daily Analytics Summary (For fast querying)
CREATE TABLE IF NOT EXISTS chronicles_daily_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  
  -- User metrics
  total_creators INT DEFAULT 0,
  new_creators INT DEFAULT 0,
  active_creators INT DEFAULT 0,
  deleted_creators INT DEFAULT 0,
  
  -- Post metrics
  total_posts INT DEFAULT 0,
  new_posts INT DEFAULT 0,
  deleted_posts INT DEFAULT 0,
  flagged_posts INT DEFAULT 0,
  
  -- Engagement metrics
  total_likes INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_reposts INT DEFAULT 0,
  avg_engagement_per_post NUMERIC(10, 2) DEFAULT 0,
  
  -- Interaction metrics
  total_reactions INT DEFAULT 0,
  total_follows INT DEFAULT 0,
  total_unfollows INT DEFAULT 0,
  
  -- Content metrics
  total_text_posts INT DEFAULT 0,
  total_audio_posts INT DEFAULT 0,
  total_video_posts INT DEFAULT 0,
  total_media_posts INT DEFAULT 0,
  
  -- Performance metrics
  avg_post_length INT DEFAULT 0,
  avg_reading_time_seconds INT DEFAULT 0,
  
  -- Monetization metrics
  total_ad_revenue NUMERIC(12, 2) DEFAULT 0,
  total_tips INT DEFAULT 0,
  total_subscriptions INT DEFAULT 0,
  avg_revenue_per_creator NUMERIC(10, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(date)
);

-- Hourly Analytics (For detailed hourly tracking)
CREATE TABLE IF NOT EXISTS chronicles_hourly_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  hour_of_day INT NOT NULL, -- 0-23
  
  active_users INT DEFAULT 0,
  new_posts INT DEFAULT 0,
  new_comments INT DEFAULT 0,
  new_likes INT DEFAULT 0,
  page_views INT DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(timestamp)
);

-- Creator Analytics (Per-creator performance)
CREATE TABLE IF NOT EXISTS chronicles_creator_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  
  -- Post stats
  posts_created INT DEFAULT 0,
  total_views INT DEFAULT 0,
  
  -- Engagement stats
  total_likes INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_reposts INT DEFAULT 0,
  avg_engagement_rate NUMERIC(5, 2) DEFAULT 0, -- percentage
  
  -- Follower stats
  new_followers INT DEFAULT 0,
  total_followers INT DEFAULT 0,
  follow_growth_rate NUMERIC(5, 2) DEFAULT 0,
  
  -- Performance stats
  best_post_id UUID REFERENCES chronicles_posts(id) ON DELETE SET NULL,
  best_post_engagement INT DEFAULT 0,
  peak_activity_hour INT, -- 0-23
  
  -- Monetization stats
  earnings NUMERIC(12, 2) DEFAULT 0,
  ad_impressions INT DEFAULT 0,
  ad_clicks INT DEFAULT 0,
  ctr NUMERIC(5, 2) DEFAULT 0, -- Click-through rate
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(creator_id, date)
);

-- Post Performance Analytics (Detailed per-post)
CREATE TABLE IF NOT EXISTS chronicles_post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL UNIQUE REFERENCES chronicles_posts(id) ON DELETE CASCADE,
  
  -- Engagement tracking
  total_views INT DEFAULT 0,
  total_likes INT DEFAULT 0,
  total_comments INT DEFAULT 0,
  total_shares INT DEFAULT 0,
  total_reposts INT DEFAULT 0,
  engagement_rate NUMERIC(5, 2) DEFAULT 0, -- percentage
  
  -- Time to metrics
  first_like_at TIMESTAMP WITH TIME ZONE,
  first_comment_at TIMESTAMP WITH TIME ZONE,
  peak_engagement_at TIMESTAMP WITH TIME ZONE,
  
  -- Audience reach
  unique_viewers INT DEFAULT 0,
  devices_used TEXT[] DEFAULT ARRAY[]::TEXT[], -- 'mobile', 'desktop', 'tablet'
  countries TEXT[] DEFAULT ARRAY[]::TEXT[], -- top 5 countries
  
  -- Performance score
  virality_score NUMERIC(10, 2) DEFAULT 0,
  engagement_velocity NUMERIC(10, 2) DEFAULT 0, -- engagements per hour
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hashtag Analytics
CREATE TABLE IF NOT EXISTS chronicles_hashtag_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hashtag TEXT NOT NULL UNIQUE,
  
  total_uses INT DEFAULT 0,
  total_posts INT DEFAULT 0,
  total_engagement INT DEFAULT 0,
  
  trending_rank INT,
  is_trending BOOLEAN DEFAULT FALSE,
  
  -- Time tracking
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Audience Demographics (For aggregate reporting)
CREATE TABLE IF NOT EXISTS chronicles_audience_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL UNIQUE REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  -- Age distribution
  age_13_17 INT DEFAULT 0,
  age_18_24 INT DEFAULT 0,
  age_25_34 INT DEFAULT 0,
  age_35_44 INT DEFAULT 0,
  age_45_54 INT DEFAULT 0,
  age_55_plus INT DEFAULT 0,
  
  -- Gender distribution
  gender_male INT DEFAULT 0,
  gender_female INT DEFAULT 0,
  gender_other INT DEFAULT 0,
  
  -- Location distribution
  top_countries JSONB DEFAULT '[]'::JSONB, -- Array of {country, count}
  top_regions JSONB DEFAULT '[]'::JSONB, -- Array of {region, count}
  
  -- Device distribution
  device_mobile INT DEFAULT 0,
  device_desktop INT DEFAULT 0,
  device_tablet INT DEFAULT 0,
  
  -- Engagement by device
  avg_engagement_mobile NUMERIC(5, 2) DEFAULT 0,
  avg_engagement_desktop NUMERIC(5, 2) DEFAULT 0,
  avg_engagement_tablet NUMERIC(5, 2) DEFAULT 0,
  
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time Analytics Cache
CREATE TABLE IF NOT EXISTS chronicles_realtime_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_key TEXT NOT NULL UNIQUE,
  metric_value JSONB NOT NULL,
  
  -- Current snapshot
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Example keys: 'active_users', 'trending_posts', 'top_creators', etc.
  
  UNIQUE(metric_key)
);

-- =====================================================
-- INDEXES FOR ANALYTICS
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_daily_analytics_date ON chronicles_daily_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_timestamp ON chronicles_hourly_analytics(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_hourly_analytics_hour ON chronicles_hourly_analytics(hour_of_day);
CREATE INDEX IF NOT EXISTS idx_creator_analytics_creator_date ON chronicles_creator_analytics(creator_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_creator_analytics_date ON chronicles_creator_analytics(date DESC);
CREATE INDEX IF NOT EXISTS idx_post_analytics_virality ON chronicles_post_analytics(virality_score DESC);
CREATE INDEX IF NOT EXISTS idx_post_analytics_engagement ON chronicles_post_analytics(engagement_rate DESC);
CREATE INDEX IF NOT EXISTS idx_hashtag_analytics_trending ON chronicles_hashtag_analytics(is_trending, trending_rank);
CREATE INDEX IF NOT EXISTS idx_hashtag_analytics_uses ON chronicles_hashtag_analytics(total_uses DESC);

-- =====================================================
-- TRIGGERS FOR ANALYTICS UPDATES
-- =====================================================

-- Update daily analytics when posts are created
CREATE OR REPLACE FUNCTION update_daily_analytics_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_daily_analytics (date, new_posts, total_posts)
  VALUES (CURRENT_DATE, 1, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_posts = chronicles_daily_analytics.total_posts + 1,
    new_posts = chronicles_daily_analytics.new_posts + 1,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- Update daily analytics when posts are deleted
CREATE OR REPLACE FUNCTION update_daily_analytics_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_daily_analytics (date, deleted_posts)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_posts = GREATEST(0, chronicles_daily_analytics.total_posts - 1),
    deleted_posts = chronicles_daily_analytics.deleted_posts + 1,
    updated_at = CURRENT_TIMESTAMP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

-- Initialize post analytics when post is created
CREATE OR REPLACE FUNCTION initialize_post_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_post_analytics (post_id, total_views, created_at)
  VALUES (NEW.id, 0, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

-- Update post engagement when likes are added
CREATE OR REPLACE FUNCTION update_post_analytics_on_like()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_post_analytics
  SET
    total_likes = total_likes + 1,
    engagement_rate = ROUND(((total_likes + total_comments + total_shares) * 100.0) / NULLIF(total_views, 0), 2),
    updated_at = CURRENT_TIMESTAMP
  WHERE post_id = NEW.post_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_post_analytics_on_like
AFTER INSERT ON chronicles_likes
FOR EACH ROW
EXECUTE FUNCTION update_post_analytics_on_like();

-- Update daily analytics for new creators
CREATE OR REPLACE FUNCTION update_daily_analytics_on_creator_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_daily_analytics (date, new_creators, total_creators)
  VALUES (CURRENT_DATE, 1, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_creators = chronicles_daily_analytics.total_creators + 1,
    new_creators = chronicles_daily_analytics.new_creators + 1,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics_on_creator_signup
AFTER INSERT ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_creator_signup();

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample daily analytics for last 30 days
INSERT INTO chronicles_daily_analytics (date, total_creators, new_creators, active_creators, total_posts, new_posts, total_likes, total_comments, total_shares, avg_engagement_per_post, total_ad_revenue)
SELECT
  CURRENT_DATE - (n || ' days')::INTERVAL,
  50 + (RANDOM() * 100)::INT,
  5 + (RANDOM() * 20)::INT,
  30 + (RANDOM() * 70)::INT,
  100 + (RANDOM() * 200)::INT,
  20 + (RANDOM() * 50)::INT,
  500 + (RANDOM() * 2000)::INT,
  100 + (RANDOM() * 500)::INT,
  50 + (RANDOM() * 300)::INT,
  ROUND((RANDOM() * 50)::NUMERIC, 2),
  ROUND((500 + RANDOM() * 5000)::NUMERIC, 2)
FROM generate_series(0, 29) AS t(n)
WHERE NOT EXISTS (SELECT 1 FROM chronicles_daily_analytics WHERE date = CURRENT_DATE - (n || ' days')::INTERVAL);

-- Insert sample hourly analytics for today
INSERT INTO chronicles_hourly_analytics (timestamp, hour_of_day, active_users, new_posts, new_comments, new_likes, page_views)
SELECT
  CURRENT_TIMESTAMP - (n || ' hours')::INTERVAL,
  EXTRACT(HOUR FROM CURRENT_TIMESTAMP - (n || ' hours')::INTERVAL)::INT,
  50 + (RANDOM() * 500)::INT,
  5 + (RANDOM() * 30)::INT,
  10 + (RANDOM() * 100)::INT,
  50 + (RANDOM() * 500)::INT,
  200 + (RANDOM() * 2000)::INT
FROM generate_series(0, 23) AS t(n)
WHERE NOT EXISTS (SELECT 1 FROM chronicles_hourly_analytics WHERE timestamp >= (CURRENT_DATE)::TIMESTAMP WITH TIME ZONE AND timestamp < (CURRENT_DATE + '1 day'::INTERVAL)::TIMESTAMP WITH TIME ZONE);

-- Insert sample hashtag analytics
INSERT INTO chronicles_hashtag_analytics (hashtag, total_uses, total_posts, total_engagement, trending_rank, is_trending)
VALUES
  ('#storytelling', 1250, 450, 8500, 1, TRUE),
  ('#voices', 980, 380, 7200, 2, TRUE),
  ('#poetry', 750, 320, 5600, 3, TRUE),
  ('#inspiration', 620, 280, 4800, 4, TRUE),
  ('#creative', 580, 240, 4200, 5, TRUE),
  ('#wellness', 450, 180, 3200, 6, FALSE),
  ('#lifestyle', 380, 160, 2800, 7, FALSE),
  ('#music', 320, 140, 2400, 8, FALSE)
ON CONFLICT (hashtag) DO NOTHING;

COMMIT;
