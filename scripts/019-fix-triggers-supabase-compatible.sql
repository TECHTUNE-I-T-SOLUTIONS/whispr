-- =====================================================
-- FIXED FOR SUPABASE: Drop and Recreate chronicles_posts Triggers
-- Uses correct column names for Supabase PostgreSQL
-- =====================================================

-- SECTION 1: Check current trigger state
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- SECTION 2: Test insert without user-created triggers
-- (We won't disable triggers as Supabase doesn't allow disabling system triggers)
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

-- If the insert above succeeded, triggers are the issue
-- Clean up test record
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-no-triggers-%';

-- SECTION 3: Drop ALL existing triggers
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

-- SECTION 4: Recreate INSERT Triggers
CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- SECTION 5: Recreate UPDATE Triggers
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

-- SECTION 6: Recreate DELETE Trigger
CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

-- SECTION 7: All triggers are now recreated

-- SECTION 8: Test the fix - insert exactly like the mobile app does
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
We kept the tally of the fading stars.
The ink was dry, the parchment brittle as bone,
And the scribes spoke only of the retreat of the tide,
Of empires crumbling into the quiet salt of memory.',
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

-- Clean up test record
DELETE FROM public.chronicles_posts 
WHERE slug LIKE 'post-after-fix-%' OR slug LIKE 'test-no-triggers-%';

-- SECTION 9: Final verification
SELECT COUNT(*) as total_triggers
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts';

SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;
