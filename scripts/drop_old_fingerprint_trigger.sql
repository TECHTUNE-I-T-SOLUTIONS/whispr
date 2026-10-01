-- Drop the old trigger that's causing the error
-- Keep only the new triggers: trigger_create_fingerprint_insert_chronicles_posts and trigger_create_fingerprint_update_chronicles_posts

DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;

-- Also drop the old function since it's not being used anymore
DROP FUNCTION IF EXISTS create_content_fingerprint_chronicles();

-- Verify only the correct triggers remain
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_posts'
  AND t.tgname LIKE '%fingerprint%'
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY t.tgname;