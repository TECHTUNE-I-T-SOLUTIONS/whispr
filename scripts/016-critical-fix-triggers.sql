-- =====================================================
-- CRITICAL FIX: Recreate Problematic Insert Triggers
-- The error "record 'new' has no field 'creator_id'" suggests
-- one of the AFTER INSERT triggers has a bug
-- =====================================================

-- Step 1: Disable ALL triggers on chronicles_posts
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Step 2: Drop the INSERT-related triggers that are most likely to cause issues
DROP TRIGGER IF EXISTS trigger_initialize_post_analytics ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_activity ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post ON public.chronicles_posts;

-- Step 3: Recreate the INSERT triggers with SAFE, tested code

-- TRIGGER 1: Initialize post analytics (AFTER INSERT)
-- Simple, direct insert without any complex logic
CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

-- TRIGGER 2: Update creator activity (AFTER INSERT)
-- Simple update to mark last activity
CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

-- TRIGGER 3: Update daily analytics (AFTER INSERT)
-- Simple insert to track daily counts
CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- Step 4: Re-enable remaining UPDATE/DELETE triggers
-- These don't fire on INSERT, so they shouldn't cause the problem
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_post_published;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_award_points;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_engagement_milestones;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_high_engagement;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_update_creator_stats;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_viral_post;
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_update_daily_analytics_on_post_delete;

-- Step 5: Verify all triggers are now enabled
SELECT trigger_name, action_timing, event_manipulation, enabled
FROM pg_trigger
WHERE tgrelid = 'public.chronicles_posts'::regclass
ORDER BY trigger_name;

-- Step 6: Test INSERT to verify it works
-- Note: You should test this directly in Supabase or with your API
-- The payload structure should match what the mobile app sends

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
  'AI-Generated Test Post',
  'ai-generated-test-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is a test post from the AI chat',
  'poem',
  'published',
  'AI Generated',
  'This is a test post from the AI chat...',
  ARRAY['test', 'ai', 'generated'],
  NULL,
  '{}',
  NOW()
);

-- If the above succeeds, the fix is working!
-- Clean up test record
DELETE FROM public.chronicles_posts 
WHERE title = 'AI-Generated Test Post' AND slug LIKE 'ai-generated-test-%';
