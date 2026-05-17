-- Job opportunities and arts listings
-- Creates public job/category tables and publish triggers that notify admins and chronicle creators.

BEGIN;

CREATE TABLE IF NOT EXISTS public.job_opportunity_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  icon text,
  color text,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_opportunity_categories_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.job_opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  category_id uuid NOT NULL,
  created_by_admin_id uuid,
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  summary text NOT NULL,
  description text NOT NULL,
  organization_name text NOT NULL,
  organization_website text,
  opportunity_type text NOT NULL DEFAULT 'job'::text CHECK (
    opportunity_type = ANY (ARRAY[
      'job'::text,
      'freelance'::text,
      'internship'::text,
      'grant'::text,
      'residency'::text,
      'competition'::text,
      'commission'::text,
      'call_for_submissions'::text,
      'volunteer'::text
    ])
  ),
  location text,
  remote_type text DEFAULT 'any'::text CHECK (
    remote_type = ANY (ARRAY['onsite'::text, 'hybrid'::text, 'remote'::text, 'any'::text])
  ),
  compensation text,
  application_url text NOT NULL,
  source_url text,
  contact_email text,
  image_url text,
  image_alt text,
  tags text[] DEFAULT ARRAY[]::text[],
  requirements text[] DEFAULT ARRAY[]::text[],
  benefits text[] DEFAULT ARRAY[]::text[],
  featured boolean DEFAULT false,
  status text DEFAULT 'draft'::text CHECK (
    status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])
  ),
  deadline_at timestamp with time zone,
  published_at timestamp with time zone,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT job_opportunities_pkey PRIMARY KEY (id),
  CONSTRAINT job_opportunities_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.job_opportunity_categories(id),
  CONSTRAINT job_opportunities_created_by_admin_id_fkey FOREIGN KEY (created_by_admin_id) REFERENCES public.admin(id)
);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_status_created_at
  ON public.job_opportunities USING btree (status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_category
  ON public.job_opportunities USING btree (category_id);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_featured
  ON public.job_opportunities USING btree (featured DESC, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_deadline
  ON public.job_opportunities USING btree (deadline_at ASC);

CREATE INDEX IF NOT EXISTS idx_job_opportunities_search
  ON public.job_opportunities USING gin (
    to_tsvector(
      'english',
      coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(description, '') || ' ' || coalesce(organization_name, '')
    )
  );

CREATE OR REPLACE FUNCTION public.handle_job_opportunity_publish_notifications()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  category_name text;
  admin_record record;
  creator_record record;
BEGIN
  SELECT name INTO category_name
  FROM public.job_opportunity_categories
  WHERE id = NEW.category_id;

  IF NEW.status = 'published' AND (TG_OP = 'INSERT' OR COALESCE(OLD.status, '') IS DISTINCT FROM 'published') THEN
    IF NEW.published_at IS NULL THEN
      NEW.published_at := now();
    END IF;

    FOR admin_record IN
      SELECT id, full_name, username
      FROM public.admin
      WHERE is_active = true
    LOOP
      INSERT INTO public.notifications (
        admin_id,
        type,
        title,
        message,
        read,
        created_at
      ) VALUES (
        admin_record.id,
        'opportunity_created',
        'New opportunity published',
        coalesce(NEW.title, 'A new opportunity') || ' has been published in ' || coalesce(category_name, 'Whispr opportunities') || '.',
        false,
        now()
      );
    END LOOP;

    FOR creator_record IN
      SELECT id, pen_name, display_name
      FROM public.chronicles_creators
      WHERE status = 'active'
    LOOP
      INSERT INTO public.chronicles_notifications (
        creator_id,
        type,
        title,
        message,
        data,
        read,
        created_at
      ) VALUES (
        creator_record.id,
        'system',
        'New opportunity posted',
        coalesce(NEW.title, 'A new opportunity') || ' is now available in ' || coalesce(category_name, 'writing and arts') || '.',
        jsonb_build_object(
          'opportunity_id', NEW.id,
          'opportunity_slug', NEW.slug,
          'category', category_name,
          'organization_name', NEW.organization_name,
          'opportunity_type', NEW.opportunity_type,
          'application_url', NEW.application_url,
          'created_by_admin_id', NEW.created_by_admin_id
        ),
        false,
        now()
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_job_opportunities_publish_notifications ON public.job_opportunities;
CREATE TRIGGER trg_job_opportunities_publish_notifications
AFTER INSERT OR UPDATE OF status ON public.job_opportunities
FOR EACH ROW
EXECUTE FUNCTION public.handle_job_opportunity_publish_notifications();

INSERT INTO public.job_opportunity_categories (slug, name, description, icon, color, sort_order) VALUES
  ('writing-jobs', 'Writing Jobs', 'Editorial, copywriting, and content roles for writers.', 'pen-tool', '#911A1B', 1),
  ('poetry-fellowships', 'Poetry Fellowships', 'Residencies, grants, and fellowships for poets.', 'sparkles', '#A855F7', 2),
  ('publishing', 'Publishing', 'Publishing, editorial, and literary production roles.', 'book-open', '#0F766E', 3),
  ('editing', 'Editing', 'Developmental, copy, and proof editing opportunities.', 'file-text', '#2563EB', 4),
  ('arts-design', 'Arts & Design', 'Illustration, visual arts, and design opportunities.', 'palette', '#D97706', 5),
  ('events-festivals', 'Events & Festivals', 'Open calls for festivals, readings, and live events.', 'calendar-days', '#059669', 6),
  ('grants-residencies', 'Grants & Residencies', 'Funding, artist residencies, and creative support.', 'landmark', '#7C3AED', 7),
  ('call-for-submissions', 'Calls for Submissions', 'Anthologies, magazines, and showcase submissions.', 'megaphone', '#BE123C', 8),
  ('freelance-commissions', 'Freelance & Commissions', 'Project-based gigs for writers and artists.', 'briefcase-business', '#DC2626', 9),
  ('teaching-mentorship', 'Teaching & Mentorship', 'Workshops, teaching, and creative mentorship roles.', 'graduation-cap', '#0891B2', 10)
ON CONFLICT (slug) DO NOTHING;

COMMIT;