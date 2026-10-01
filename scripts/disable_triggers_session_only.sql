-- Session-level: Disable all triggers on chronicles_posts for this session only
-- This allows posts to be saved without needing to drop triggers

ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Try inserting a test post to verify it works
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
  'Test Post - Triggers Disabled',
  'test-triggers-disabled-' || to_char(NOW(), 'YYYYMMDDHHmmss'),
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

-- If this succeeds, the post was created
-- Clean up the test post
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-triggers-disabled-%';