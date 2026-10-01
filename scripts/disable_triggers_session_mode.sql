-- Use session replication mode to bypass all triggers temporarily
-- This works even with system triggers

SET session_replication_role = 'replica';

-- Test insert with triggers bypassed
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
  'Test Post - Session Replication Mode',
  'test-session-replication-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
  'Test content',
  'blog',
  'draft',
  'lifestyle',
  'Test excerpt',
  ARRAY['test'],
  NULL,
  '{}',
  NULL
);

-- If this succeeds, triggers were bypassed
-- Clean up test post
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-session-replication-%';

-- Reset to normal mode
SET session_replication_role = 'origin';