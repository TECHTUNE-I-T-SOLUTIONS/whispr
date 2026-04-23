-- ============================================================================
-- Whispr Community Page — Tables, Indexes, Triggers, RLS, Search RPC
-- Run this file in the Supabase SQL Editor.
-- It is idempotent (safe to re-run).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ----------------------------------------------------------------------------
-- community_issues
-- Anonymous-friendly issues / complaints / questions raised by site visitors.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general','bug','account','content','suggestion','complaint','feature','other')),
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','in_progress','resolved','closed')),
  priority text NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low','normal','high','urgent')),
  tags text[] NOT NULL DEFAULT '{}'::text[],
  author_name text,
  author_email text,
  author_token text NOT NULL,
  reply_count integer NOT NULL DEFAULT 0,
  upvote_count integer NOT NULL DEFAULT 0,
  view_count integer NOT NULL DEFAULT 0,
  is_pinned boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  resolved_by uuid,
  search_vector tsvector,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_issues_pkey PRIMARY KEY (id),
  CONSTRAINT community_issues_resolved_by_fkey
    FOREIGN KEY (resolved_by) REFERENCES public.admin(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS community_issues_status_idx     ON public.community_issues(status);
CREATE INDEX IF NOT EXISTS community_issues_category_idx   ON public.community_issues(category);
CREATE INDEX IF NOT EXISTS community_issues_created_idx    ON public.community_issues(created_at DESC);
CREATE INDEX IF NOT EXISTS community_issues_pinned_idx     ON public.community_issues(is_pinned);
CREATE INDEX IF NOT EXISTS community_issues_search_idx     ON public.community_issues USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS community_issues_title_trgm_idx ON public.community_issues USING GIN(title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS community_issues_desc_trgm_idx  ON public.community_issues USING GIN(description gin_trgm_ops);

CREATE OR REPLACE FUNCTION public.community_issues_tsvector_update()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.tags, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'C');
  NEW.updated_at := now();
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_issues_tsv_trg ON public.community_issues;
CREATE TRIGGER community_issues_tsv_trg
  BEFORE INSERT OR UPDATE ON public.community_issues
  FOR EACH ROW EXECUTE FUNCTION public.community_issues_tsvector_update();

-- ----------------------------------------------------------------------------
-- community_replies
-- Replies / solutions, can be left by anonymous visitors or admins.
-- Threaded via parent_reply_id.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_replies (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  parent_reply_id uuid,
  content text NOT NULL,
  author_name text,
  author_email text,
  author_token text,
  is_admin boolean NOT NULL DEFAULT false,
  admin_id uuid,
  is_solution boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_replies_pkey PRIMARY KEY (id),
  CONSTRAINT community_replies_issue_fkey
    FOREIGN KEY (issue_id) REFERENCES public.community_issues(id) ON DELETE CASCADE,
  CONSTRAINT community_replies_parent_fkey
    FOREIGN KEY (parent_reply_id) REFERENCES public.community_replies(id) ON DELETE CASCADE,
  CONSTRAINT community_replies_admin_fkey
    FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS community_replies_issue_idx
  ON public.community_replies(issue_id, created_at);

CREATE OR REPLACE FUNCTION public.community_replies_after_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.community_issues
     SET reply_count = reply_count + 1,
         updated_at  = now(),
         status      = CASE
                         WHEN NEW.is_admin AND status = 'open' THEN 'in_progress'
                         ELSE status
                       END
   WHERE id = NEW.issue_id;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_replies_after_insert_trg ON public.community_replies;
CREATE TRIGGER community_replies_after_insert_trg
  AFTER INSERT ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.community_replies_after_insert();

CREATE OR REPLACE FUNCTION public.community_replies_after_delete()
RETURNS trigger AS $$
BEGIN
  UPDATE public.community_issues
     SET reply_count = GREATEST(reply_count - 1, 0),
         updated_at  = now()
   WHERE id = OLD.issue_id;
  RETURN OLD;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_replies_after_delete_trg ON public.community_replies;
CREATE TRIGGER community_replies_after_delete_trg
  AFTER DELETE ON public.community_replies
  FOR EACH ROW EXECUTE FUNCTION public.community_replies_after_delete();

-- ----------------------------------------------------------------------------
-- community_upvotes
-- Anonymous "me too" / signal-boost votes, scoped by visitor token.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_upvotes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  voter_token text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT community_upvotes_pkey PRIMARY KEY (id),
  CONSTRAINT community_upvotes_unique UNIQUE (issue_id, voter_token),
  CONSTRAINT community_upvotes_issue_fkey
    FOREIGN KEY (issue_id) REFERENCES public.community_issues(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS community_upvotes_issue_idx ON public.community_upvotes(issue_id);

CREATE OR REPLACE FUNCTION public.community_upvotes_after_insert()
RETURNS trigger AS $$
BEGIN
  UPDATE public.community_issues
     SET upvote_count = upvote_count + 1
   WHERE id = NEW.issue_id;
  RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_upvotes_after_insert_trg ON public.community_upvotes;
CREATE TRIGGER community_upvotes_after_insert_trg
  AFTER INSERT ON public.community_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.community_upvotes_after_insert();

CREATE OR REPLACE FUNCTION public.community_upvotes_after_delete()
RETURNS trigger AS $$
BEGIN
  UPDATE public.community_issues
     SET upvote_count = GREATEST(upvote_count - 1, 0)
   WHERE id = OLD.issue_id;
  RETURN OLD;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS community_upvotes_after_delete_trg ON public.community_upvotes;
CREATE TRIGGER community_upvotes_after_delete_trg
  AFTER DELETE ON public.community_upvotes
  FOR EACH ROW EXECUTE FUNCTION public.community_upvotes_after_delete();

-- ----------------------------------------------------------------------------
-- Row Level Security
-- All writes go through the service-role key in the API routes; the public
-- anon key only needs to read.
-- ----------------------------------------------------------------------------
ALTER TABLE public.community_issues  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_replies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_upvotes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS community_issues_public_read  ON public.community_issues;
DROP POLICY IF EXISTS community_replies_public_read ON public.community_replies;
DROP POLICY IF EXISTS community_upvotes_public_read ON public.community_upvotes;

CREATE POLICY community_issues_public_read  ON public.community_issues  FOR SELECT USING (true);
CREATE POLICY community_replies_public_read ON public.community_replies FOR SELECT USING (true);
CREATE POLICY community_upvotes_public_read ON public.community_upvotes FOR SELECT USING (true);

-- ----------------------------------------------------------------------------
-- Search RPC: hybrid full-text + trigram fuzzy match used by "search before
-- you post" feature.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.search_community_issues(q text, lim integer DEFAULT 10)
RETURNS SETOF public.community_issues
LANGUAGE sql STABLE AS $$
  SELECT *
    FROM public.community_issues
   WHERE
     q IS NULL OR q = ''
     OR search_vector @@ plainto_tsquery('simple', q)
     OR title       ILIKE '%' || q || '%'
     OR description ILIKE '%' || q || '%'
     OR similarity(title, q) > 0.2
   ORDER BY
     is_pinned DESC,
     GREATEST(
       similarity(title,       coalesce(q, '')),
       similarity(description, coalesce(q, ''))
     ) DESC NULLS LAST,
     upvote_count DESC,
     created_at  DESC
   LIMIT lim;
$$;
