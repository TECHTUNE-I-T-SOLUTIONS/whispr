-- Migration: Create v_flagged_posts_summary view
-- File: 007_create_flagged_posts_summary_view.sql
-- Purpose: Provides a summary view of flagged posts with details
-- Created: 2026-04-13

-- ===================================================================
-- DROP EXISTING VIEW IF EXISTS
-- ===================================================================

DROP VIEW IF EXISTS public.v_flagged_posts_summary CASCADE;

-- ===================================================================
-- CREATE FLAGGED POSTS SUMMARY VIEW
-- ===================================================================

CREATE VIEW public.v_flagged_posts_summary AS
SELECT
  cfr.id as flag_id,
  cfr.post_id,
  cfr.chain_entry_post_id,
  cfr.reason,
  cfr.description,
  cfr.status,
  cfr.created_at as flagged_at,
  cfr.flagged_by,
  admin_user.username as flagged_by_username,
  CASE 
    WHEN cfr.post_id IS NOT NULL THEN 'post'
    WHEN cfr.chain_entry_post_id IS NOT NULL THEN 'chain_entry_post'
    ELSE 'unknown'
  END as content_type,
  -- Get post details if post_id exists
  COALESCE(
    (SELECT title FROM public.chronicles_posts WHERE id = cfr.post_id LIMIT 1),
    (SELECT title FROM public.chronicles_chain_entry_posts WHERE id = cfr.chain_entry_post_id LIMIT 1),
    'Unknown Title'
  ) as content_title,
  -- Get creator details
  COALESCE(
    (SELECT creator_id FROM public.chronicles_posts WHERE id = cfr.post_id LIMIT 1),
    (SELECT added_by FROM public.chronicles_chain_entry_posts WHERE id = cfr.chain_entry_post_id LIMIT 1)
  ) as creator_id
FROM public.chronicles_flagged_reviews cfr
LEFT JOIN public.admin admin_user ON cfr.flagged_by = admin_user.id
WHERE cfr.status = 'pending'
ORDER BY cfr.created_at DESC;

-- ===================================================================
-- MIGRATION NOTES
-- ===================================================================
-- This view provides:
-- - flag_id: The flag record ID
-- - post_id / chain_entry_post_id: The content being flagged
-- - reason: Why it was flagged
-- - status: Current flag status (pending, under_review, etc)
-- - flagged_at: When it was flagged
-- - flagged_by: Admin who flagged it
-- - flagged_by_username: Admin username
-- - content_type: What type of content (post, chain_entry_post)
-- - content_title: Title of the content
-- - creator_id: ID of the content creator
