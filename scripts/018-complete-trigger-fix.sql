-- =====================================================
-- COMPREHENSIVE FIX: Diagnose and Fix chronicles_posts Triggers
-- Run this step-by-step to identify and resolve the issue
-- =====================================================

-- SECTION 1: BACKUP - Check current state
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- SECTION 2: ISOLATION TEST - Disable all triggers
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Try insert with ALL triggers disabled
INSERT INTO public.chronicles_posts (
  creator_id,
  title,
  slug,
  content,
  post_type,
  status,
  category,
  excerpt,
  tags,
  cover_image_url,
  formatting_data,
  published_at
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post No Triggers',
  'test-no-triggers-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'Test content',
  'poem',
  'published',
  'AI Generated',
  'Test excerpt here',
  ARRAY['test', 'tag'],
  NULL,
  '{}',
 NOW()
);

-- If above succeeds, the issue is definitely with the triggers
-- Clean up test record
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-no-triggers-%';

-- SECTION 3: DROP All INSERT Triggers
DROP TRIGGER IF EXISTS trigger_initialize_post_analytics ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_activity ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post ON public.chronicles_posts;

-- SECTION 4: Recreate INSERT Triggers with Simple, Pure Versions
-- Trigger 1: Initialize empty analytics record
CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

-- Trigger 2: Update creator's last activity timestamp
CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

-- Trigger 3: Update daily analytics
CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- SECTION 5: Drop and Recreate UPDATE Triggers (they should be fine, but let's be clean)
DROP TRIGGER IF EXISTS trigger_post_published ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_award_points ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_engagement_milestones ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_high_engagement ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_stats ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_viral_post ON public.chronicles_posts;

-- CREATE UPDATE triggers fresh
CREATE TRIGGER trigger_post_published
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_post_published();

CREATE TRIGGER trigger_award_points
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION award_points_on_post_publish();

CREATE TRIGGER trigger_engagement_milestones
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION check_engagement_milestones();

CREATE TRIGGER trigger_high_engagement
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_high_engagement();

CREATE TRIGGER trigger_update_creator_stats
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_stats_on_post();

CREATE TRIGGER trigger_viral_post
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_admin_on_viral_post();

-- SECTION 6: DROP and RECREATE DELETE trigger
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post_delete ON public.chronicles_posts;

CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

-- SECTION 7: Enable all triggers
ALTER TABLE public.chronicles_posts ENABLE TRIGGER ALL;

-- SECTION 8: VERIFICATION - Run the exact test case that was failing
INSERT INTO public.chronicles_posts (
  creator_id,
  title,
  slug,
  content,
  post_type,
  status,
  category,
  excerpt,
  tags,
  cover_image_url,
  formatting_data,
  published_at
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Post After Trigger Fix',
  'post-after-fix-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'Chronicle: The Unyielding Ember

In the age of the long-shadowed winter,
When the frost carved its name into the marrow of the world,
We kept the tally of the fading stars.',
  'poem',
  'published',
  'AI Generated',
  'Chronicle: The Unyielding Ember

In the age of the long-shadowed winter,
When the frost carved its name into the marrow of the world,...',
  ARRAY['chronicle', 'unyielding', 'ember'],
  NULL,
  '{}',
  NOW()
);

-- SECTION 9: CLEANUP - Remove test records
DELETE FROM public.chronicles_posts 
WHERE slug LIKE 'post-after-fix-%' OR slug LIKE 'test-no-triggers-%';

-- SECTION 10: SUMMARY - Show final state
SELECT 
  COUNT(*) as total_triggers,
  MAX(CASE WHEN action_timing = 'AFTER' AND event_manipulation = 'INSERT' THEN 1 END) as has_after_insert_triggers,
  MAX(CASE WHEN action_timing = 'AFTER' AND event_manipulation = 'UPDATE' THEN 1 END) as has_after_update_triggers,
  MAX(CASE WHEN action_timing = 'AFTER' AND event_manipulation = 'DELETE' THEN 1 END) as has_after_delete_triggers
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts';

-- List all current triggers
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;
