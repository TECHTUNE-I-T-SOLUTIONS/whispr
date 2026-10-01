-- Drop only user-created triggers on chronicles_posts (not system triggers)
-- System triggers like RI_ConstraintTrigger cannot be dropped by users

-- Disable all user triggers on chronicles_posts
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Drop specific user triggers by name (these are the ones we created)
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

-- Verify which triggers remain (only system triggers should remain)
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
  AND trigger_schema = 'public'
ORDER BY trigger_name;