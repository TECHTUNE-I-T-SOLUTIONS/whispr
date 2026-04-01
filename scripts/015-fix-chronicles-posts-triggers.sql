-- =====================================================
-- FIX: Drop and Recreate All Triggers on chronicles_posts
-- This script safely removes problematic triggers and recreates them
-- =====================================================

-- Step 1: Disable all triggers temporarily
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Step 2: Drop all existing triggers
DROP TRIGGER IF EXISTS trigger_initialize_post_analytics ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_activity ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_post_published ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_award_points ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_engagement_milestones ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_high_engagement ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_stats ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_viral_post ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post_delete ON public.chronicles_posts;

-- =====================================================
-- Step 3: Recreate Triggers - IN PROPER ORDER FOR INSERT/UPDATE
-- =====================================================

-- TRIGGER 1: Initialize post analytics (AFTER INSERT)
-- This must run first on INSERT to create analytics records
CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

-- TRIGGER 2: Update creator activity (AFTER INSERT)
-- Marks that creator has been active
CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

-- TRIGGER 3: Update daily analytics (AFTER INSERT)
-- Tracks daily post counts
CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- TRIGGER 4: Notify on post published (AFTER UPDATE)
-- Sends notification when post transitions to published
CREATE TRIGGER trigger_post_published
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_post_published();

-- TRIGGER 5: Award points on publish (AFTER UPDATE)
-- Gives creator points when post is published
CREATE TRIGGER trigger_award_points
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION award_points_on_post_publish();

-- TRIGGER 6: Check engagement milestones (AFTER UPDATE)
-- Notifies creator when post hits engagement goals
CREATE TRIGGER trigger_engagement_milestones
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION check_engagement_milestones();

-- TRIGGER 7: Notify admin on high engagement (AFTER UPDATE)
-- Alerts admins when post gets high engagement
CREATE TRIGGER trigger_high_engagement
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_high_engagement();

-- TRIGGER 8: Update creator stats (AFTER UPDATE)
-- Updates creator's total posts, post types, etc.
CREATE TRIGGER trigger_update_creator_stats
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats_on_post();

-- TRIGGER 9: Notify admin on viral post (AFTER UPDATE)
-- Alerts admins when post goes viral
CREATE TRIGGER trigger_viral_post
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_viral_post();

-- TRIGGER 10: Update daily analytics on delete (AFTER DELETE)
-- Decrements daily post counts when post is deleted
CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

-- Step 4: Re-enable all triggers
ALTER TABLE public.chronicles_posts ENABLE TRIGGER ALL;

-- Step 5: Verify
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;
