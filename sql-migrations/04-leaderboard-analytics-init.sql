-- =============================================================================
-- BACKFILL SCRIPT: INITIALIZE LEADERBOARD AND ANALYTICS
-- =============================================================================
-- This script initializes leaderboard entries and daily analytics for all creators.
-- Run this AFTER running 02-backfill-creator-stats.sql
--
-- Operations:
-- 1. Delete existing leaderboard entries
-- 2. Create new leaderboard entries with calculated scores
-- 3. Initialize creator daily analytics for today
-- 4. Update platform daily analytics
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Clear existing leaderboard entries (optional - remove if you want to preserve)
-- =============================================================================
DELETE FROM chronicles_leaderboard;

-- =============================================================================
-- STEP 2: Populate leaderboard with calculated scores
-- =============================================================================
INSERT INTO chronicles_leaderboard (creator_id, score, category, calculation_method, calculated_at, updated_at)
SELECT 
  cc.id,
  -- Weighted score calculation
  COALESCE(
    (cc.total_posts * COALESCE(cls.post_weight, 10)) +
    (cc.total_engagement * COALESCE(cls.engagement_weight, 2)) +
    (cc.streak_count * COALESCE(cls.streak_weight, 5)) +
    (cc.total_followers * COALESCE(cls.follow_weight, 1)),
    cc.total_posts + cc.total_engagement
  ) as score,
  'general' as category,
  'weighted' as calculation_method,
  NOW() as calculated_at,
  NOW() as updated_at
FROM chronicles_creators cc
LEFT JOIN chronicles_leaderboard_settings cls ON true
WHERE cc.status = 'active' AND cc.is_banned = false
ORDER BY score DESC;

-- =============================================================================
-- STEP 3: Initialize or update creator daily analytics
-- =============================================================================
INSERT INTO chronicles_creator_analytics (
  creator_id,
  date,
  posts_created,
  total_followers,
  total_likes,
  total_comments,
  total_shares,
  avg_engagement_rate,
  created_at,
  updated_at
)
SELECT 
  cc.id,
  CURRENT_DATE,
  cc.total_posts,
  cc.total_followers,
  (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE creator_id = cc.id),
  (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE creator_id = cc.id),
  (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE creator_id = cc.id),
  CASE 
    WHEN cc.total_posts = 0 THEN 0
    ELSE ROUND((cc.total_engagement::numeric / cc.total_posts) * 100, 2)
  END as avg_engagement_rate,
  NOW(),
  NOW()
FROM chronicles_creators cc
WHERE cc.status = 'active' AND cc.is_banned = false
ON CONFLICT (creator_id, date) DO UPDATE
SET
  posts_created = EXCLUDED.posts_created,
  total_followers = EXCLUDED.total_followers,
  total_likes = EXCLUDED.total_likes,
  total_comments = EXCLUDED.total_comments,
  total_shares = EXCLUDED.total_shares,
  avg_engagement_rate = EXCLUDED.avg_engagement_rate,
  updated_at = NOW();

-- =============================================================================
-- STEP 4: Initialize platform daily analytics
-- =============================================================================
INSERT INTO chronicles_daily_analytics (
  date,
  total_creators,
  active_creators,
  total_posts,
  total_likes,
  total_comments,
  total_shares,
  avg_engagement_per_post,
  total_follows,
  updated_at
)
SELECT 
  CURRENT_DATE,
  (SELECT COUNT(*) FROM chronicles_creators WHERE status = 'active'),
  (SELECT COUNT(*) FROM chronicles_creators 
   WHERE last_activity_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'),
  (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published'),
  (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE status = 'published'),
  (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE status = 'published'),
  (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE status = 'published'),
  (SELECT ROUND(COALESCE(AVG(likes_count + comments_count + shares_count), 0), 2) 
   FROM chronicles_posts WHERE status = 'published'),
  0 as total_follows,
  NOW()
ON CONFLICT (date) DO UPDATE
SET
  total_creators = EXCLUDED.total_creators,
  active_creators = EXCLUDED.active_creators,
  total_posts = EXCLUDED.total_posts,
  total_likes = EXCLUDED.total_likes,
  total_comments = EXCLUDED.total_comments,
  total_shares = EXCLUDED.total_shares,
  avg_engagement_per_post = EXCLUDED.avg_engagement_per_post,
  updated_at = NOW();

-- =============================================================================
-- STEP 5: Verification - Show results
-- =============================================================================

-- Leaderboard summary
SELECT 
  COUNT(*) as total_leaderboard_entries,
  ROUND(AVG(score), 2) as average_score,
  MAX(score) as highest_score,
  MIN(score) as lowest_score
FROM chronicles_leaderboard;

-- Top 10 by leaderboard score
SELECT
  rank() OVER (ORDER BY score DESC) as rank,
  cc.pen_name,
  cc.total_posts,
  cc.total_engagement,
  cl.score
FROM chronicles_leaderboard cl
JOIN chronicles_creators cc ON cc.id = cl.creator_id
ORDER BY cl.score DESC
LIMIT 10;

-- Creator analytics summary
SELECT 
  COUNT(*) as total_analytics_records,
  ROUND(AVG(avg_engagement_rate), 2) as average_engagement_rate,
  MAX(total_likes) as max_creator_likes,
  MAX(total_comments) as max_creator_comments
FROM chronicles_creator_analytics
WHERE date = CURRENT_DATE;

-- Platform analytics for today
SELECT 
  date,
  total_creators,
  active_creators,
  total_posts,
  total_likes,
  total_comments,
  total_shares,
  avg_engagement_per_post
FROM chronicles_daily_analytics
WHERE date = CURRENT_DATE;

COMMIT;

-- =============================================================================
-- SUCCESS SUMMARY
-- =============================================================================
-- ✅ Leaderboard entries created with weighted scores
-- ✅ Creator daily analytics initialized
-- ✅ Platform daily analytics updated
-- ✅ All data ready for automatic updates via triggers
-- 
-- Next: New posts, comments, and engagement will automatically update these tables
