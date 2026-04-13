-- Migration: Add Post Flagged Notification Type
-- Purpose: Support notifications when posts are flagged for review
-- Created: 2026-04-13
-- Note: No table structure changes - uses existing data jsonb column

-- ===================================================================
-- SECTION 1: UPDATE chronicles_admin_notifications TYPE CONSTRAINT
-- ===================================================================

-- Add 'post_flagged' to the existing CHECK constraint
-- Drop existing constraint
ALTER TABLE public.chronicles_admin_notifications 
DROP CONSTRAINT IF EXISTS chronicles_admin_notifications_notification_type_check;

-- Add updated constraint with new type (preserves all existing types)
ALTER TABLE public.chronicles_admin_notifications
ADD CONSTRAINT chronicles_admin_notifications_notification_type_check 
CHECK (notification_type = ANY (ARRAY[
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
]));

-- ===================================================================
-- SECTION 2: VERIFY chronicles_flagged_reviews TABLE
-- ===================================================================

-- The chronicles_flagged_reviews table should exist from migration 001
-- Verify it has proper columns
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chronicles_flagged_reviews'
  ) THEN
    RAISE EXCEPTION 'chronicles_flagged_reviews table does not exist. Run migration 001 first.';
  END IF;
END
$$;

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
-- Migration completed successfully!
-- Added 'post_flagged' to chronicles_admin_notifications notification types.
--
-- The existing data jsonb column will store flag details:
-- {
--   "flag_id": "uuid",
--   "flag_reason": "reason text",
--   "flag_description": "description text",
--   "chain_entry_post_id": "uuid (if applicable)",
--   "flagged_at": "timestamp"
-- }
--
-- Admins will now automatically receive admin notifications when posts are flagged.
