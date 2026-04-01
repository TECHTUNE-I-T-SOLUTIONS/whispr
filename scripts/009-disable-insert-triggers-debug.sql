-- =====================================================
-- TEMPORARY: Disable INSERT triggers on chronicles_posts
-- This helps isolate if a trigger is causing the error
-- =====================================================

-- Disable INSERT triggers temporarily
DROP TRIGGER IF EXISTS trigger_initialize_post_analytics ON chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_activity ON chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post ON chronicles_posts;

-- Keep UPDATE/DELETE triggers active since they shouldn't fire on INSERT
-- trigger_award_points - AFTER UPDATE
-- trigger_engagement_milestones - AFTER UPDATE
-- trigger_high_engagement - AFTER UPDATE  
-- trigger_post_published - AFTER UPDATE
-- trigger_update_creator_stats - AFTER UPDATE
-- trigger_viral_post - AFTER UPDATE
-- trigger_update_daily_analytics_on_post_delete - AFTER DELETE
