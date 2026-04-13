-- Migration: Fix foreign key constraint for chronicles_flagged_reviews
-- File: 006_fix_flagged_by_foreign_key.sql
-- Purpose: Change flagged_by constraint to reference admin table instead of auth.users
-- Reason: Admin users flag content, not regular auth.users
-- Created: 2026-04-13

-- ===================================================================
-- DROP EXISTING CONSTRAINT
-- ===================================================================

ALTER TABLE public.chronicles_flagged_reviews
DROP CONSTRAINT IF EXISTS chronicles_flagged_reviews_flagged_by_fkey;

-- ===================================================================
-- ADD NEW CONSTRAINT (References admin table)
-- ===================================================================

ALTER TABLE public.chronicles_flagged_reviews
ADD CONSTRAINT chronicles_flagged_reviews_flagged_by_fkey 
FOREIGN KEY (flagged_by) REFERENCES public.admin (id) ON DELETE SET NULL;

-- ===================================================================
-- ALSO FIX resolved_by CONSTRAINT
-- ===================================================================

ALTER TABLE public.chronicles_flagged_reviews
DROP CONSTRAINT IF EXISTS chronicles_flagged_reviews_resolved_by_fkey;

ALTER TABLE public.chronicles_flagged_reviews
ADD CONSTRAINT chronicles_flagged_reviews_resolved_by_fkey 
FOREIGN KEY (resolved_by) REFERENCES public.admin (id) ON DELETE SET NULL;

-- ===================================================================
-- MIGRATION NOTES
-- ===================================================================
-- Changed:
-- flagged_by: auth.users(id) → admin(id)
-- resolved_by: auth.users(id) → admin(id)
--
-- This allows admins to properly flag content and track who resolved flags.
-- Both columns are now SET NULL on admin deletion for data integrity.
