-- =====================================================
-- PROPER FIX: Drop and Recreate Leaderboard Trigger Safely
-- Fixes the cascade issue while keeping leaderboard updates
-- =====================================================

-- STEP 1: Drop the problematic trigger
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON public.chronicles_creators;

-- STEP 2: Drop the old function (we'll rewrite it)
DROP FUNCTION IF EXISTS update_leaderboard_scores() CASCADE;

-- STEP 3: Create a safer version of the function
-- This function runs on UPDATE of chronicles_creators
-- It only updates the leaderboard without cascading complex queries
CREATE OR REPLACE FUNCTION update_leaderboard_scores()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update if creator stats actually changed
  IF (NEW.total_engagement <> OLD.total_engagement OR 
      NEW.total_posts <> OLD.total_posts OR 
      NEW.streak_count <> OLD.streak_count) THEN
    
    -- Calculate new score
    DECLARE
      new_score NUMERIC;
    BEGIN
      new_score := (COALESCE(NEW.total_engagement, 0) * 2) + 
                   (COALESCE(NEW.total_posts, 0) * 10) + 
                   (COALESCE(NEW.streak_count, 0) * 5);
      
      -- Upsert into leaderboard (insert or update)
      INSERT INTO public.chronicles_leaderboard (creator_id, category, score, calculation_method)
      VALUES (NEW.id, 'weekly', new_score, 'weighted')
      ON CONFLICT (creator_id) 
      DO UPDATE SET 
        score = new_score,
        category = 'weekly',
        calculation_method = 'weighted',
        updated_at = NOW();
    END;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Recreate the trigger
CREATE TRIGGER trigger_update_leaderboard
AFTER UPDATE ON public.chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_leaderboard_scores();

-- STEP 5: Test that chronicles_posts INSERT still works
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
  'Post After Leaderboard Fix',
  'post-leaderboard-fix-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'Test post to verify leaderboard trigger is safe',
  'poem',
  'published',
  'AI Generated',
  'Test post to verify leaderboard trigger...',
  ARRAY['test', 'leaderboard'],
  NULL,
  '{}',
  NOW()
);

-- Clean up test record
DELETE FROM public.chronicles_posts WHERE slug LIKE 'post-leaderboard-fix-%';

-- STEP 6: Verify everything is working
SELECT 'Leaderboard trigger recreated successfully' as status;

SELECT COUNT(*) as leaderboard_entries
FROM public.chronicles_leaderboard
WHERE creator_id = '7c6c58dc-de3c-4faf-afe3-517749efa5cc';

-- Show the trigger exists
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_update_leaderboard'
ORDER BY trigger_name;
