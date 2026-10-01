-- Drop the content_fingerprint trigger since the table doesn't exist
-- This is not essential for the writing challenge feature

DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.posts;

-- Also drop the functions since they're not being used
DROP FUNCTION IF EXISTS create_content_fingerprint();
DROP FUNCTION IF EXISTS create_content_fingerprint_chronicles();
DROP FUNCTION IF EXISTS create_content_fingerprint_posts();

-- Verify no content_fingerprint triggers remain
SELECT 
  trigger_name,
  event_object_table
FROM information_schema.triggers
WHERE trigger_name LIKE '%content_fingerprint%'
  AND trigger_schema = 'public';