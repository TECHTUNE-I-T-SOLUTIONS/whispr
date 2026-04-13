-- Migration: Create chronicles_admin_notifications table
-- File: 008_create_chronicles_admin_notifications.sql
-- Purpose: Store admin notifications for chronicles content management
-- Created: 2026-04-13

-- ===================================================================
-- CREATE CHRONICLES ADMIN NOTIFICATIONS TABLE
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.chronicles_admin_notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  notification_type text NOT NULL,
  title character varying(255) NOT NULL,
  message text NOT NULL,
  creator_id uuid NULL,
  post_id uuid NULL,
  comment_id uuid NULL,
  priority text NULL DEFAULT 'normal'::text,
  read boolean NULL DEFAULT false,
  read_by uuid NULL,
  read_at timestamp with time zone NULL,
  action_taken text NULL,
  data jsonb NULL DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chronicles_admin_notifications_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_admin_notifications_creator_id_fkey 
    FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators (id) ON DELETE CASCADE,
  CONSTRAINT chronicles_admin_notifications_comment_id_fkey 
    FOREIGN KEY (comment_id) REFERENCES public.chronicles_comments (id) ON DELETE CASCADE,
  CONSTRAINT chronicles_admin_notifications_post_id_fkey 
    FOREIGN KEY (post_id) REFERENCES public.chronicles_posts (id) ON DELETE CASCADE,
  CONSTRAINT chronicles_admin_notifications_read_by_fkey 
    FOREIGN KEY (read_by) REFERENCES auth.users (id) ON DELETE SET NULL,
  CONSTRAINT chronicles_admin_notifications_notification_type_check CHECK (
    notification_type = ANY(ARRAY[
      'creator_signup'::text,
      'creator_milestone'::text,
      'post_viral'::text,
      'post_reported'::text,
      'post_flagged'::text,
      'comment_flagged'::text,
      'high_engagement'::text,
      'low_quality_post'::text,
      'creator_banned'::text,
      'revenue_milestone'::text,
      'subscriber_milestone'::text,
      'admin_action_needed'::text,
      'system_alert'::text
    ])
  ),
  CONSTRAINT chronicles_admin_notifications_priority_check CHECK (
    priority = ANY(ARRAY[
      'low'::text,
      'normal'::text,
      'high'::text,
      'critical'::text
    ])
  )
) TABLESPACE pg_default;

-- ===================================================================
-- CREATE INDEXES
-- ===================================================================

CREATE INDEX IF NOT EXISTS idx_admin_notifications_type 
  ON public.chronicles_admin_notifications USING btree (notification_type) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_read 
  ON public.chronicles_admin_notifications USING btree (read) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_priority 
  ON public.chronicles_admin_notifications USING btree (priority) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created 
  ON public.chronicles_admin_notifications USING btree (created_at DESC) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_post_id 
  ON public.chronicles_admin_notifications USING btree (post_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_creator_id 
  ON public.chronicles_admin_notifications USING btree (creator_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_unread 
  ON public.chronicles_admin_notifications USING btree (read, created_at DESC) 
  TABLESPACE pg_default;

-- ===================================================================
-- MIGRATION NOTES
-- ===================================================================
-- This table stores admin notifications for:
-- - Flagged posts/comments
-- - Creator actions (signups, milestones)
-- - Content quality alerts
-- - System alerts
--
-- Indexes optimize for:
-- - Filtering by notification type
-- - Finding unread notifications
-- - Sorting by priority and date
-- - Finding notifications for specific posts/creators
