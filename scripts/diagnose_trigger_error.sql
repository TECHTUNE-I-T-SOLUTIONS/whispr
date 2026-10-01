-- Diagnostic: Find which trigger is causing the admin_id error
-- Run this in Supabase SQL Editor to identify the problematic trigger

-- Step 1: List all triggers on chronicles_posts
SELECT 
  trigger_name,
  action_timing,
  event_manipulation,
  event_manipulation as event_type,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
  AND trigger_schema = 'public'
ORDER BY trigger_name;

-- Step 2: Show function definitions for each trigger function
-- This will show the actual PL/pgSQL code that might reference NEW.admin_id

-- Get function definitions (note: pg_get_functiondef may not work in Supabase)
-- If it doesn't work, check the function source manually

-- Step 3: Alternative approach - disable ALL triggers temporarily
-- This will confirm if triggers are the issue
ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Step 4: Test insert with all triggers disabled
-- Insert a test post to see if it works without triggers
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

-- If the above insert succeeds, triggers are the problem
-- Clean up the test post
DELETE FROM public.chronicles_posts WHERE slug LIKE 'test-triggers-disabled-%';

-- Step 5: Re-enable triggers one by one to find the culprit
-- First, check if any triggers reference admin_id in their function bodies
-- This query searches for 'admin_id' in function definitions
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_trigger t ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE c.relname = 'chronicles_posts'
  AND pg_get_functiondef(p.oid) LIKE '%admin_id%';

-- Step 6: If the above doesn't work, manually check these common function names:
-- - initialize_post_analytics
-- - update_creator_activity
-- - update_daily_analytics_on_post
-- - notify_post_published
-- - award_points_on_post_publish
-- - check_engagement_milestones
-- - notify_admin_on_high_engagement
-- - update_creator_stats_on_post
-- - notify_admin_on_viral_post

-- Check each function individually:
SELECT pg_get_functiondef('initialize_post_analytics'::regprocedure);
SELECT pg_get_functiondef('update_creator_activity'::regprocedure);
SELECT pg_get_functiondef('update_daily_analytics_on_post'::regprocedure);
SELECT pg_get_functiondef('notify_post_published'::regprocedure);
SELECT pg_get_functiondef('award_points_on_post_publish'::regprocedure);
SELECT pg_get_functiondef('check_engagement_milestones'::regprocedure);
SELECT pg_get_functiondef('notify_admin_on_high_engagement'::regprocedure);
SELECT pg_get_functiondef('update_creator_stats_on_post'::regprocedure);
SELECT pg_get_functiondef('notify_admin_on_viral_post'::regprocedure);