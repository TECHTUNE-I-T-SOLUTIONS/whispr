-- =====================================================
-- COMPLETE FIX: All Triggers - Drop, Recreate, and Test
-- Run this ONE script to fix everything at once
-- =====================================================

-- ========== PHASE 1: Check Current State ==========
SELECT 'PHASE 1: Checking current trigger state...' as phase;

SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
  OR event_object_table = 'chronicles_creators'
ORDER BY event_object_table, trigger_name;

-- ========== PHASE 2: Drop All Problematic Triggers ==========
SELECT 'PHASE 2: Dropping all problematic triggers...' as phase;

-- Drop chronicles_posts triggers
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

-- Drop leaderboard trigger and function
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON public.chronicles_creators;
DROP FUNCTION IF EXISTS update_leaderboard_scores() CASCADE;

-- ========== PHASE 3: Test Data Insertion Without Triggers ==========
SELECT 'PHASE 3: Testing INSERT without triggers...' as phase;

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

DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-no-triggers-%';
SELECT 'INSERT/DELETE test passed ✓' as result;

-- ========== PHASE 4: Recreate chronicles_posts Triggers ==========
SELECT 'PHASE 4: Recreating chronicles_posts triggers...' as phase;

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

CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

SELECT 'chronicles_posts triggers recreated ✓' as result;

-- ========== PHASE 5: Recreate Safe Leaderboard Trigger ==========
SELECT 'PHASE 5: Recreating leaderboard trigger (safe version)...' as phase;

CREATE OR REPLACE FUNCTION update_leaderboard_scores()
RETURNS TRIGGER AS $$
DECLARE
  new_score NUMERIC;
BEGIN
  -- Only update leaderboard if creator stats changed
  IF (NEW.total_engagement <> OLD.total_engagement OR 
      NEW.total_posts <> OLD.total_posts OR 
      NEW.streak_count <> OLD.streak_count) THEN
    
    -- Calculate score: (engagement * 2) + (posts * 10) + (streak * 5)
    new_score := (COALESCE(NEW.total_engagement, 0) * 2) + 
                 (COALESCE(NEW.total_posts, 0) * 10) + 
                 (COALESCE(NEW.streak_count, 0) * 5);
    
    -- Insert or update leaderboard entry
    INSERT INTO public.chronicles_leaderboard (creator_id, category, score, calculation_method, updated_at)
    VALUES (NEW.id, 'weekly', new_score, 'weighted', NOW())
    ON CONFLICT (creator_id) 
    DO UPDATE SET 
      score = new_score,
      category = 'weekly',
      calculation_method = 'weighted',
      updated_at = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER trigger_update_leaderboard
AFTER UPDATE ON public.chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_scores();

SELECT 'Leaderboard trigger recreated ✓' as result;

-- ========== PHASE 6: Test Full Flow ==========
SELECT 'PHASE 6: Testing full flow with all triggers active...' as phase;

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
  'Post After Complete Fix',
  'post-final-test-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
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

SELECT 'Full flow test PASSED ✓ - POST INSERT with all triggers succeeded!' as result;

-- Clean up test record
DELETE FROM public.chronicles_posts WHERE slug LIKE 'post-final-test-%';

-- ========== PHASE 7: Final Verification ==========
SELECT 'PHASE 7: Final verification...' as phase;

SELECT 'CHRONICLES_POSTS TRIGGERS:' as section;
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

SELECT '' as spacer;
SELECT 'LEADERBOARD TRIGGER:' as section;
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_leaderboard'
ORDER BY trigger_name;

SELECT '' as spacer;
SELECT '✓ ALL FIXES COMPLETE!' as status;
SELECT 'Summary:' as section;
SELECT 'Triggers recreated: ' || COUNT(*) || ' on chronicles_posts + 1 on chronicles_creators' as summary
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts';

SELECT 'Next: Test publishing from mobile app' as next_step;
