-- TEMPORARY FIX: Disable ALL triggers on chronicles_posts
-- This will allow posts to be saved while we diagnose the trigger issue
-- Run this in Supabase SQL Editor

ALTER TABLE public.chronicles_posts DISABLE TRIGGER ALL;

-- Verify triggers are disabled
SELECT 
  trigger_name,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE event_object_table = 'chronicles_posts'
  AND trigger_schema = 'public'
ORDER BY trigger_name;