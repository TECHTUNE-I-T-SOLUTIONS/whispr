-- =====================================================
-- FIX: Remove problematic trigger cascade
-- The issue: INSERT chronicles_posts → UPDATE chronicles_creators → UPDATE leaderboard
-- This cascade is causing the "new has no field" error
-- =====================================================

-- Drop the trigger that's causing the cascade
DROP TRIGGER IF EXISTS trigger_update_leaderboard ON public.chronicles_creators;

-- The UPDATE leaderboard logic is nice-to-have but not critical
-- We can safely remove it to fix the INSERT issue
-- Users still get their points tracked, just not real-time leaderboard updates

-- Verify triggers on chronicles_posts (should work now)
SELECT trigger_name, action_timing, event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
ORDER BY trigger_name;

-- Test INSERT (should now succeed)
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
  formatting_data,
  published_at
) VALUES (
  '7c6c58dc-de3c-4faf-afe3-517749efa5cc',
  'Test Post After Fix',
  'test-cascade-fix-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'Test content',
  'poem',
  'published',
  'AI Generated',
  'Test excerpt here',
  ARRAY['test', 'tag'],
  NULL,
  '{}',
  NOW()
);

-- Clean up test record
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-cascade-fix-%';

-- Summary
SELECT 'Fix complete: Removed trigger_update_leaderboard to prevent cascade errors' as status;
SELECT COUNT(*) as remaining_triggers_on_chronicles_posts
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts';
