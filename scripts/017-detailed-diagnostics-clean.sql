-- =====================================================
-- DETAILED DIAGNOSTICS: Full schema and trigger analysis
-- =====================================================

-- Show all columns and their properties
SELECT 
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

-- Show all triggers with their definitions
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- Test: Try a minimal insert (wrapped in transaction for safety)
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
  -- Check if insert succeeded
  SELECT COUNT(*) as inserted_count FROM public.chronicles_posts 
  WHERE title = 'Minimal Test';
ROLLBACK;  -- Rolls back so no actual record remains
