-- Add data column to notifications table for consistency with other notification tables
-- This column is used by the challenge notification triggers

ALTER TABLE public.notifications
ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;
