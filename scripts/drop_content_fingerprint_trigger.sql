-- Simply drop the content_fingerprint trigger from chronicles_posts
-- This trigger is incorrectly using admin_id on a table that has creator_id

-- Drop the trigger from chronicles_posts
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;

-- Verify it's dropped
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
  AND trigger_schema = 'public'
  AND trigger_name = 'trigger_content_fingerprint';