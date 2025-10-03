-- 009-add-last-read.sql
-- Add last_read_at to conversation_participants so we can compute unread message counts per participant

BEGIN;

ALTER TABLE IF EXISTS public.conversation_participants
  ADD COLUMN IF NOT EXISTS last_read_at timestamptz;

-- Initialize existing rows to joined_at where available
UPDATE public.conversation_participants
  SET last_read_at = COALESCE(last_read_at, joined_at, now())
  WHERE last_read_at IS NULL;

-- Set a default and make non-null to match the requirement that this value exist
ALTER TABLE public.conversation_participants
  ALTER COLUMN last_read_at SET DEFAULT now();

ALTER TABLE public.conversation_participants
  ALTER COLUMN last_read_at SET NOT NULL;

COMMIT;
