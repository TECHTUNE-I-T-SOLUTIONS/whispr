-- Find which trigger function references admin_id incorrectly
-- Run this with session_replication_mode to bypass triggers temporarily

SET session_replication_role = 'replica';

-- Get all functions used by triggers on chronicles_posts
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  t.tgtype::text as trigger_type,
  CASE 
    WHEN t.tgtype::int & 2 != 0 THEN 'BEFORE'
    WHEN t.tgtype::int & 16 != 0 THEN 'AFTER'
    ELSE 'UNKNOWN'
  END as timing,
  CASE 
    WHEN t.tgtype::int & 4 != 0 THEN 'INSERT'
    WHEN t.tgtype::int & 8 != 0 THEN 'DELETE'
    WHEN t.tgtype::int & 1 != 0 THEN 'UPDATE'
    ELSE 'UNKNOWN'
  END as event
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_posts'
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY t.tgname;

-- Search for functions that contain 'admin_id' in their definition
SELECT 
  p.proname as function_name,
  'CONTAINS admin_id' as warning
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_posts'
  AND p.prosrc LIKE '%admin_id%'
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%';

-- Reset session mode
SET session_replication_role = 'origin';