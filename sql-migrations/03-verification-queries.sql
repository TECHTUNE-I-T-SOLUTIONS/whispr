-- =============================================================================
-- VERIFICATION AND MONITORING QUERIES
-- =============================================================================
-- Use these queries to verify that creator stats are being maintained correctly
-- and to diagnose any data consistency issues.
-- =============================================================================

-- =============================================================================
-- QUERY 1: Verify Trigger Installation
-- =============================================================================
-- Check that all required triggers are installed
SELECT 
  trigger_name,
  trigger_schema,
  event_object_table,
  event_manipulation,
  action_timing
FROM information_schema.triggers
WHERE trigger_name LIKE 'trg_%'
ORDER BY trigger_name;

-- Expected output: Should show 6 triggers:
-- - trg_update_creator_post_stats
-- - trg_update_creator_engagement_stats
-- - trg_update_engagement_on_post_reaction
-- - trg_update_shares_on_post_share
-- - trg_update_last_activity_comment_reaction
-- - trg_update_followers_count

-- =============================================================================
-- QUERY 2: Find Creators with Data Inconsistencies
-- =============================================================================
-- Shows creators where the stored stats don't match actual data
-- Run this to identify problems

SELECT 
  cc.id,
  cc.pen_name,
  cc.total_posts as stored_posts,
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published') as actual_posts,
  cc.total_poems as stored_poems,
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND post_type = 'poem' AND status = 'published') as actual_poems,
  cc.total_blog_posts as stored_blogs,
  (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND post_type = 'blog' AND status = 'published') as actual_blogs,
  cc.total_engagement as stored_engagement,
  (SELECT COALESCE(SUM(likes_count + comments_count + shares_count), 0) FROM chronicles_posts WHERE creator_id = cc.id) as actual_engagement
FROM chronicles_creators cc
WHERE (
  cc.total_posts != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published')
  OR cc.total_poems != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND post_type = 'poem' AND status = 'published')
  OR cc.total_blog_posts != (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND post_type = 'blog' AND status = 'published')
)
ORDER BY ABS(cc.total_posts - (SELECT COUNT(*) FROM chronicles_posts WHERE creator_id = cc.id AND status = 'published')) DESC
LIMIT 50;

-- If this returns rows, those creators need their stats resynced

-- =============================================================================
-- QUERY 3: Creator Stats Summary Report
-- =============================================================================
-- Get overall statistics and activity

SELECT 
  COUNT(*) as total_creators,
  COUNT(*) FILTER (WHERE total_posts > 0) as creators_with_posts,
  COUNT(*) FILTER (WHERE total_posts = 0) as creators_no_posts,
  AVG(total_posts) as avg_posts_per_creator,
  MAX(total_posts) as max_posts,
  SUM(total_posts) as total_posts_all_creators,
  SUM(total_poems) as total_poems_all,
  SUM(total_blog_posts) as total_blog_posts_all,
  SUM(total_engagement) as total_engagement_all,
  SUM(total_followers) as total_followers_all
FROM chronicles_creators
WHERE status != 'banned';

-- =============================================================================
-- QUERY 4: Top 20 Most Active Creators
-- =============================================================================

SELECT 
  ROW_NUMBER() OVER (ORDER BY total_engagement DESC) as rank,
  pen_name,
  display_name,
  total_posts,
  total_poems,
  total_blog_posts,
  total_engagement,
  total_shares,
  total_followers,
  last_post_date,
  last_activity_at,
  status
FROM chronicles_creators
WHERE status != 'banned'
ORDER BY total_engagement DESC
LIMIT 20;

-- =============================================================================
-- QUERY 5: Creators Active in Last 7 Days
-- =============================================================================

SELECT 
  pen_name,
  display_name,
  total_posts,
  total_engagement,
  last_activity_at,
  AGE(NOW(), last_activity_at) as time_since_activity
FROM chronicles_creators
WHERE 
  status != 'banned'
  AND last_activity_at >= NOW() - INTERVAL '7 days'
ORDER BY last_activity_at DESC;

-- =============================================================================
-- QUERY 6: Recent Posts Activity (Last 24 Hours)
-- =============================================================================
-- Verify that new posts are being recorded

SELECT 
  COUNT(*) as new_posts_24h,
  SUM(CASE WHEN post_type = 'poem' THEN 1 ELSE 0 END) as poems_24h,
  SUM(CASE WHEN post_type = 'blog' THEN 1 ELSE 0 END) as blogs_24h,
  COUNT(DISTINCT creator_id) as creators_posted_24h
FROM chronicles_posts
WHERE status = 'published' AND published_at >= NOW() - INTERVAL '24 hours';

-- =============================================================================
-- QUERY 7: Recent Comments Activity (Last 24 Hours)
-- =============================================================================

SELECT 
  COUNT(*) as new_comments_24h,
  COUNT(DISTINCT creator_id) as creators_commented_24h
FROM chronicles_comments
WHERE status = 'approved' AND created_at >= NOW() - INTERVAL '24 hours';

-- =============================================================================
-- QUERY 8: Manual Fix for Specific Creator
-- =============================================================================
-- When you need to manually update a single creator's stats
-- Replace 'creator_uuid_here' with the actual creator ID

UPDATE chronicles_creators cc
SET
  total_posts = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  total_poems = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published' AND post_type = 'poem'
  ),
  total_blog_posts = (
    SELECT COUNT(*) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published' AND post_type = 'blog'
  ),
  total_engagement = (
    SELECT COALESCE(SUM(likes_count + comments_count + shares_count), 0)
    FROM chronicles_posts
    WHERE creator_id = cc.id
  ),
  total_shares = (
    SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  last_post_date = (
    SELECT MAX(published_at) FROM chronicles_posts
    WHERE creator_id = cc.id AND status = 'published'
  ),
  last_activity_at = NOW(),
  updated_at = NOW()
WHERE cc.id = 'creator_uuid_here'::uuid;

-- Then verify:
SELECT pen_name, total_posts, total_poems, total_blog_posts, total_engagement 
FROM chronicles_creators 
WHERE id = 'creator_uuid_here'::uuid;

-- =============================================================================
-- QUERY 9: Check Trigger Functionality (Test)
-- =============================================================================
-- After running this test, manually check if creator stats updated

-- Step 1: Get an existing creator ID for testing
SELECT id, pen_name, total_posts FROM chronicles_creators WHERE total_posts > 0 LIMIT 1;

-- Step 2: Get a post to use for testing
SELECT id, post_type FROM chronicles_posts WHERE status = 'published' LIMIT 1;

-- Step 3: Create a test comment (replace IDs with actual values)
-- INSERT INTO chronicles_comments (post_id, creator_id, content, status)
-- VALUES ('post_id_here', 'creator_id_here', 'Test comment for trigger verification', 'approved');

-- Step 4: Check if last_activity_at updated
-- SELECT pen_name, last_activity_at FROM chronicles_creators WHERE id = 'creator_id_here'::uuid;

-- =============================================================================
-- QUERY 10: Database Health Check
-- =============================================================================
-- Verify that all required tables exist and are accessible

SELECT 
  'chronicles_creators' as table_name,
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chronicles_creators') as exists_check,
  (SELECT COUNT(*) FROM chronicles_creators) as row_count
UNION ALL
SELECT 
  'chronicles_posts',
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chronicles_posts'),
  (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published')
UNION ALL
SELECT 
  'chronicles_comments',
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chronicles_comments'),
  (SELECT COUNT(*) FROM chronicles_comments WHERE status = 'approved')
UNION ALL
SELECT 
  'chronicles_post_likes',
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chronicles_post_likes'),
  COALESCE((SELECT COUNT(*) FROM chronicles_post_likes), 0)
UNION ALL
SELECT 
  'chronicles_followers',
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_name = 'chronicles_followers'),
  COALESCE((SELECT COUNT(*) FROM chronicles_followers), 0);

-- =============================================================================
-- QUERY 11: Orphaned Posts (Posts without creators) - Data Integrity Check
-- =============================================================================

SELECT 
  cp.id,
  cp.title,
  cp.creator_id,
  cp.status,
  cp.published_at
FROM chronicles_posts cp
LEFT JOIN chronicles_creators cc ON cp.creator_id = cc.id
WHERE cc.id IS NULL;

-- =============================================================================
-- QUERY 12: Performance: Verify Indexes Exist for Triggers
-- =============================================================================
-- Indices help triggers perform efficiently

SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename IN ('chronicles_creators', 'chronicles_posts', 'chronicles_comments', 'chronicles_post_likes')
ORDER BY tablename, indexname;

-- If missing, create indices:
-- CREATE INDEX idx_chronicles_posts_creator_id ON chronicles_posts(creator_id);
-- CREATE INDEX idx_chronicles_posts_status ON chronicles_posts(status);
-- CREATE INDEX idx_chronicles_comments_creator_id ON chronicles_comments(creator_id);
-- CREATE INDEX idx_chronicles_post_likes_creator_id ON chronicles_post_likes(creator_id);
