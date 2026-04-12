-- =============================================================================
-- BACKFILL SCRIPT: UPDATE ALL EXISTING CREATOR STATS
-- =============================================================================
-- This script updates all creators' stats based on their actual posts, 
-- comments, engagement, and followers.
-- Run this ONCE after creating the triggers to fix all historical data.
--
-- WARNING: This is a one-time migration. Do not run multiple times as it
-- will recalculate stats from scratch each time.
-- =============================================================================

BEGIN;

-- =============================================================================
-- STEP 1: Update all creator stats based on actual data
-- =============================================================================

UPDATE chronicles_creators cc
SET
  -- Count published posts
  total_posts = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  -- Count published poems
  total_poems = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published' AND post_type = 'poem'
  ),
  -- Count published blog posts
  total_blog_posts = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published' AND post_type = 'blog'
  ),
  -- Calculate total engagement (likes + comments + shares from all posts)
  total_engagement = (
    SELECT COALESCE(SUM(likes_count), 0) + 
           COALESCE(SUM(comments_count), 0) + 
           COALESCE(SUM(shares_count), 0)
    FROM chronicles_posts
    WHERE creator_id = cc.id
  ),
  -- Sum of all shares
  total_shares = (
    SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  -- Get the most recent published post date
  last_post_date = (
    SELECT MAX(published_at) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  -- Get the most recent activity (from posts, comments, or reactions)
  last_activity_at = (
    SELECT GREATEST(
      COALESCE((SELECT MAX(updated_at) FROM chronicles_posts WHERE creator_id = cc.id), TIMESTAMP '1970-01-01'),
      COALESCE((SELECT MAX(created_at) FROM chronicles_comments WHERE creator_id = cc.id), TIMESTAMP '1970-01-01'),
      COALESCE((SELECT MAX(created_at) FROM chronicles_comment_reactions WHERE creator_id = cc.id), TIMESTAMP '1970-01-01'),
      COALESCE((SELECT MAX(created_at) FROM chronicles_post_reactions WHERE creator_id = cc.id), TIMESTAMP '1970-01-01')
    )
  ),
  -- Count followers (if followers table exists - currently 0 as table doesn't exist)
  total_followers = 0,
  -- Update timestamp
  updated_at = NOW()
WHERE cc.status != 'banned';  -- Don't update banned creators

-- =============================================================================
-- STEP 2: Verify the update
-- =============================================================================

-- Show summary of updated creators
SELECT 
  COUNT(*) as total_creators_updated,
  SUM(total_posts) as total_published_posts,
  SUM(total_poems) as total_poems,
  SUM(total_blog_posts) as total_blog_posts,
  SUM(total_engagement) as total_engagement,
  SUM(total_shares) as total_shares
FROM chronicles_creators
WHERE status != 'banned';

-- =============================================================================
-- STEP 3: Show top 10 creators by engagement (verification)
-- =============================================================================

SELECT 
  pen_name,
  display_name,
  total_posts,
  total_poems,
  total_blog_posts,
  total_engagement,
  total_shares,
  total_followers,
  last_post_date,
  last_activity_at
FROM chronicles_creators
WHERE status != 'banned' AND total_posts > 0
ORDER BY total_engagement DESC
LIMIT 10;

-- =============================================================================
-- STEP 4: Check for creators with posts but zero counts (edge case check)
-- =============================================================================

SELECT 
  cc.id,
  cc.pen_name,
  cc.display_name,
  cc.total_posts,
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published') as actual_published_posts,
  (SELECT COUNT(*) FROM chronicles_comments WHERE creator_id = cc.id) as total_comments,
  cc.last_activity_at
FROM chronicles_creators cc
WHERE (
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published') > 0
  OR (SELECT COUNT(*) FROM chronicles_comments WHERE creator_id = cc.id) > 0
)
AND cc.total_posts = 0
LIMIT 20;

COMMIT;

-- =============================================================================
-- OPTIONAL: Run this query multiple times to verify data consistency
-- =============================================================================
-- SELECT 
--   cc.id,
--   cc.pen_name,
--   cc.total_posts,
--   (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published') as expected_posts,
--   cc.total_poems,
--   (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published' AND post_type = 'poem') as expected_poems,
--   cc.total_blog_posts,
--   (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published' AND post_type = 'blog') as expected_blog_posts
-- FROM chronicles_creators cc
-- WHERE cc.status != 'banned'
-- AND (
--   cc.total_posts != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published')
--   OR cc.total_poems != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published' AND post_type = 'poem')
--   OR cc.total_blog_posts != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published' AND post_type = 'blog')
-- );
