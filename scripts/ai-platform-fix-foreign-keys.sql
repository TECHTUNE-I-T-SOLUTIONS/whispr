-- AI Platform Foreign Key Fix Migration
-- This migration drops foreign key constraints to auth.users since Whispr uses a custom admin table
-- Run this after ai-platform-migration.sql if you already ran it

-- ============================================
-- DROP FOREIGN KEY CONSTRAINTS
-- ============================================

-- Drop foreign key from recommendation_profiles
ALTER TABLE public.recommendation_profiles DROP CONSTRAINT IF EXISTS recommendation_profiles_user_id_fkey;

-- Drop foreign key from recommendation_scores
ALTER TABLE public.recommendation_scores DROP CONSTRAINT IF EXISTS recommendation_scores_user_id_fkey;

-- Drop foreign key from user_interests
ALTER TABLE public.user_interests DROP CONSTRAINT IF EXISTS user_interests_user_id_fkey;

-- Drop foreign key from user_topics
ALTER TABLE public.user_topics DROP CONSTRAINT IF EXISTS user_topics_user_id_fkey;

-- Drop foreign key from user_search_history
ALTER TABLE public.user_search_history DROP CONSTRAINT IF EXISTS user_search_history_user_id_fkey;

-- Drop foreign key from prompt_versions
ALTER TABLE public.prompt_versions DROP CONSTRAINT IF EXISTS prompt_versions_created_by_fkey;

-- Drop foreign key from system_settings
ALTER TABLE public.system_settings DROP CONSTRAINT IF EXISTS system_settings_updated_by_fkey;
