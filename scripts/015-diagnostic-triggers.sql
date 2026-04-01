-- =====================================================
-- DIAGNOSTIC: Test chronicles_posts INSERT with triggers
-- This helps identify which trigger is causing the error
-- =====================================================

-- First, let's verify the table structure
\d+ public.chronicles_posts

-- Test 1: Insert directly without triggers
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

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
  formatting_data
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post Without Triggers',
  'test-post-no-triggers-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is test content',
  'poem',
  'draft',
  'Test',
  'Test excerpt',
  ARRAY['test', 'tag'],
  NULL,
  '{}'::jsonb
);

-- If above succeeds, triggers are the issue
-- Test 2: Enable triggers one by one and test

-- Re-enable triggers one at a time to find the problematic one
ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_initialize_post_analytics;

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
  formatting_data
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post With Analytics Trigger',
  'test-post-analytics-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is test content',
  'poem',
  'draft',
  'Test',
  'Test excerpt',
  ARRAY['test', 'tag'],
  NULL,
  '{}'::jsonb
);

-- If above fails, it's trigger_initialize_post_analytics
-- If above succeeds, test the next trigger

ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_update_creator_activity;

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
  formatting_data
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post With Creator Activity Trigger',
  'test-post-activity-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is test content',
  'poem',
  'draft',
  'Test',
  'Test excerpt',
  ARRAY['test', 'tag'],
  NULL,
  '{}'::jsonb
);

-- Continue enabling and testing other INSERT triggers...
-- After finding the problematic trigger, we'll fix it

ALTER TABLE public.chronicles_posts ENABLE TRIGGER trigger_update_daily_analytics_on_post;

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
  formatting_data
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post With Daily Analytics Trigger',
  'test-post-daily-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'This is test content',
  'poem',
  'draft',
  'Test',
  'Test excerpt',
  ARRAY['test', 'tag'],
  NULL,
  '{}'::jsonb
);

-- If ALL the above succeed, check the constraint definitions
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'chronicles_posts';

-- Check column info
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chronicles_posts'
ORDER BY ordinal_position;

-- Check triggers info
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- Clean up test records
DELETE FROM public.chronicles_posts WHERE title LIKE 'Test Post%';
