-- =====================================================================
-- Feature Requests (public, no-auth)
-- Run this in the Supabase SQL editor.
-- Mirrors the community_issues pattern but has NO auth / user_id column.
-- Anyone can submit a request or suggestion; admins review them.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Main table
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_requests (
  id            uuid NOT NULL DEFAULT gen_random_uuid(),
  title         text NOT NULL,
  description   text NOT NULL,
  category      text NOT NULL DEFAULT 'feature'
                  CHECK (category = ANY (ARRAY[
                    'feature'::text,      -- new feature
                    'improvement'::text,  -- improve something existing
                    'integration'::text,  -- connect another tool/service
                    'ui_ux'::text,        -- design / usability
                    'content'::text,      -- content / editorial idea
                    'suggestion'::text,   -- general suggestion
                    'other'::text
                  ])),
  status        text NOT NULL DEFAULT 'open'
                  CHECK (status = ANY (ARRAY[
                    'open'::text,          -- submitted, not yet triaged
                    'under_review'::text,  -- team is considering it
                    'planned'::text,       -- accepted, on the roadmap
                    'in_progress'::text,   -- being built
                    'shipped'::text,       -- released
                    'declined'::text       -- won't do
                  ])),
  tags          text[] NOT NULL DEFAULT '{}'::text[],
  -- Optional, purely for follow-up / display. NOT authentication.
  author_name   text,
  author_email  text,
  -- Anonymous visitor token (localStorage). Used only to prevent a person
  -- from double-upvoting; it is NOT a login and can be null.
  author_token  text,
  upvote_count  integer NOT NULL DEFAULT 0,
  is_pinned     boolean NOT NULL DEFAULT false,
  admin_note    text,        -- optional internal/public note from the team
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_requests_pkey PRIMARY KEY (id)
);

CREATE INDEX IF NOT EXISTS feature_requests_status_idx    ON public.feature_requests (status);
CREATE INDEX IF NOT EXISTS feature_requests_category_idx  ON public.feature_requests (category);
CREATE INDEX IF NOT EXISTS feature_requests_created_idx   ON public.feature_requests (created_at DESC);
CREATE INDEX IF NOT EXISTS feature_requests_upvotes_idx   ON public.feature_requests (upvote_count DESC);

-- ---------------------------------------------------------------------
-- 2. Upvotes (one row per visitor token per request)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.feature_request_votes (
  id           uuid NOT NULL DEFAULT gen_random_uuid(),
  request_id   uuid NOT NULL,
  voter_token  text NOT NULL,
  created_at   timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT feature_request_votes_pkey PRIMARY KEY (id),
  CONSTRAINT feature_request_votes_request_fkey
    FOREIGN KEY (request_id) REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  CONSTRAINT feature_request_votes_unique UNIQUE (request_id, voter_token)
);

CREATE INDEX IF NOT EXISTS feature_request_votes_request_idx ON public.feature_request_votes (request_id);

-- ---------------------------------------------------------------------
-- 3. Keep upvote_count in sync via triggers
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_feature_request_upvotes()
RETURNS trigger AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.feature_requests
      SET upvote_count = upvote_count + 1, updated_at = now()
      WHERE id = NEW.request_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.feature_requests
      SET upvote_count = GREATEST(upvote_count - 1, 0), updated_at = now()
      WHERE id = OLD.request_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feature_request_upvotes ON public.feature_request_votes;
CREATE TRIGGER trg_feature_request_upvotes
  AFTER INSERT OR DELETE ON public.feature_request_votes
  FOR EACH ROW EXECUTE FUNCTION public.sync_feature_request_upvotes();

-- ---------------------------------------------------------------------
-- 4. keep updated_at fresh on edits
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.touch_feature_request_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_feature_request_touch ON public.feature_requests;
CREATE TRIGGER trg_feature_request_touch
  BEFORE UPDATE ON public.feature_requests
  FOR EACH ROW EXECUTE FUNCTION public.touch_feature_request_updated_at();

-- ---------------------------------------------------------------------
-- 5. Row Level Security
--    The app writes with the SERVICE ROLE key (server routes), which
--    bypasses RLS. We still enable RLS and add a public read policy so
--    the table is safe if ever queried with the anon key directly.
-- ---------------------------------------------------------------------
ALTER TABLE public.feature_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_request_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "feature_requests public read" ON public.feature_requests;
CREATE POLICY "feature_requests public read"
  ON public.feature_requests FOR SELECT
  USING (true);

-- Votes: allow public read of counts (rows contain no PII beyond a random token)
DROP POLICY IF EXISTS "feature_request_votes public read" ON public.feature_request_votes;
CREATE POLICY "feature_request_votes public read"
  ON public.feature_request_votes FOR SELECT
  USING (true);

-- No INSERT/UPDATE/DELETE policies are defined for the anon role on purpose:
-- all writes go through server routes using the service role key.
