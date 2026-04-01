-- =====================================================
-- DETAILED DIAGNOSTICS: Full schema and trigger analysis
-- =====================================================

-- Show the complete CREATE TABLE statement as Postgres sees it
-- (Using information_schema since pg_get_create_table_as_sql may not exist)
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'chronicles_posts'
ORDER BY ordinal_position;

-- Show all constraints on the table
SELECT constraint_name, constraint_type, table_name
FROM information_schema.table_constraints
WHERE table_name = 'chronicles_posts'
ORDER BY constraint_name;

-- Show check constraint details
SELECT constraint_name, check_clause
FROM information_schema.check_constraints
WHERE constraint_name IN (
  SELECT constraint_name
  FROM information_schema.table_constraints
  WHERE table_name = 'chronicles_posts' AND constraint_type = 'CHECK'
);

-- Show all columns and their properties
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'chronicles_posts'
ORDER BY ordinal_position;

-- Show all triggers with their definitions
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- Show function definitions for each trigger function
-- Note: pg_get_functiondef might not be available in Supabase
-- If the below queries fail, you can skip them
-- SELECT pg_get_functiondef('initialize_post_analytics'::regprocedure);
-- SELECT pg_get_functiondef('update_creator_activity'::regprocedure);
-- SELECT pg_get_functiondef('update_daily_analytics_on_post'::regprocedure);

-- Test: Try a minimal insert
BEGIN;
  INSERT INTO public.chronicles_posts (
    creator_id,
    title,
    slug,
    content,
    post_type,
    status
  ) VALUES (
    '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
    'Minimal Test',
    'minimal-test-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
    'Test',
    'poem',
    'draft'
  );
ROLLBACK;  -- This rolls back so no actual record is created
