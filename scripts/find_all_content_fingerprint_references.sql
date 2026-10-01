-- Find all functions and triggers that reference chronicles_content_fingerprints
-- This will help us find the remaining problematic trigger

-- Search for functions containing 'chronicles_content_fingerprints'
SELECT 
  p.proname as function_name,
  'CONTAINS chronicles_content_fingerprints' as warning
FROM pg_proc p
WHERE p.prosrc LIKE '%chronicles_content_fingerprints%';

-- List all triggers on chronicles_posts
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgtype::text as trigger_type
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_posts'
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY t.tgname;