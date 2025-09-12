-- 008-create-feedback-table.sql
-- Creates a feedback table for anonymous user feedback
-- Note: gen_random_uuid() requires the pgcrypto extension. If unavailable, replace with uuid_generate_v4().

BEGIN;

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  name text NULL,
  email text NULL,
  page_url text NULL,
  user_agent text NULL,
  metadata jsonb NULL,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback (created_at DESC);

COMMIT;
