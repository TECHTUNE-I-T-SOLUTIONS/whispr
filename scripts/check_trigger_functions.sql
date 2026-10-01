-- Check the function definitions for the triggers on chronicles_post_reactions
SELECT 
  t.tgname as trigger_name,
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_post_reactions'
  AND t.tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY t.tgname;