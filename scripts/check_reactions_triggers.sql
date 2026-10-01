-- Check for triggers on chronicles_post_reactions
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_post_reactions'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Check for any function that might be creating fingerprints
SELECT 
  p.proname as function_name,
  'CONTAINS content_fingerprints' as warning
FROM pg_proc p
WHERE p.prosrc LIKE '%content_fingerprints%'
  AND p.proname NOT LIKE '%create_content_fingerprint%';