-- =====================================================================
-- FIX: Platform Daily Analytics Trigger - Correct Table Reference
-- Problem: Trigger referencing 'chronicles_creator_followers' which doesn't exist
-- Solution: Update trigger to use correct table 'chronicles_followers'
-- =====================================================================

SELECT 'Starting Platform Analytics Trigger Fix...' as status;

-- Step 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS trg_update_platform_daily_analytics ON public.chronicles_creators;

SELECT 'Dropped old trigger ✓' as status;

-- Step 2: Drop the old function
DROP FUNCTION IF EXISTS update_platform_daily_analytics() CASCADE;

SELECT 'Dropped old function ✓' as status;

-- Step 3: Recreate the function with correct table reference
CREATE OR REPLACE FUNCTION update_platform_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert platform daily analytics
  INSERT INTO chronicles_daily_analytics (
    date,
    total_creators,
    active_creators,
    total_posts,
    total_likes,
    total_comments,
    total_shares,
    avg_engagement_per_post,
    total_follows
  )
  VALUES (
    CURRENT_DATE,
    (SELECT COUNT(*) FROM chronicles_creators WHERE status = 'active'),
    (SELECT COUNT(*) FROM chronicles_creators WHERE last_activity_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'),
    (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT ROUND(COALESCE(AVG(likes_count + comments_count + shares_count), 0), 2) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COUNT(*) FROM chronicles_followers WHERE created_at >= CURRENT_DATE)
  )
  ON CONFLICT (date) DO UPDATE
  SET
    total_creators = (SELECT COUNT(*) FROM chronicles_creators WHERE status = 'active'),
    active_creators = (SELECT COUNT(*) FROM chronicles_creators WHERE last_activity_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'),
    total_posts = (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published'),
    total_likes = (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE status = 'published'),
    total_comments = (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE status = 'published'),
    total_shares = (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE status = 'published'),
    avg_engagement_per_post = (SELECT ROUND(COALESCE(AVG(likes_count + comments_count + shares_count), 0), 2) FROM chronicles_posts WHERE status = 'published'),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT 'Recreated function with correct table reference ✓' as status;

-- Step 4: Recreate the trigger
CREATE TRIGGER trg_update_platform_daily_analytics
AFTER UPDATE ON public.chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_platform_daily_analytics();

SELECT 'Recreated trigger ✓' as status;

-- Step 5: Verify the trigger is in place
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trg_update_platform_daily_analytics';

SELECT 'Platform Analytics Trigger fixed successfully ✓' as status;
SELECT 'The share recording should now work without table reference errors.' as message;

-- =====================================================================
-- What this fixes:
-- - Share endpoint no longer fails with "relation does not exist" error
-- - Trigger now correctly references 'chronicles_followers' table
-- - Platform daily analytics properly updated when creators change
-- - No API changes needed
-- =====================================================================
