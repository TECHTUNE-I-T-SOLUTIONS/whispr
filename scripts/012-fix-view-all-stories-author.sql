-- Fix author identity on the unified stories view.
--
-- Two problems with the original definition:
--   1. author_name preferred `display_name`, which is usually the account
--      username, so the app showed "@Prince" instead of the pen name.
--   2. author_avatar read `avatar_url`, which is almost always NULL — the
--      real image lives in `profile_image_url` — so the app fell back to a
--      single-letter placeholder.
--
-- Pen name wins, and the avatar falls back to profile_image_url.

-- Postgres refuses CREATE OR REPLACE when a column's type would change
-- (author_name was varchar, and COALESCE of two text expressions is text),
-- so the view is dropped and recreated. Dependent views are dropped first
-- and recreated afterwards is not needed: nothing else selects from it via
-- a stored definition (the app queries it directly).
DROP VIEW IF EXISTS public.view_all_stories;

CREATE VIEW public.view_all_stories AS
SELECT
  s.id,
  s.admin_id AS author_id,
  'admin'::text AS author_type,
  COALESCE(NULLIF(a.full_name, '')::text, a.username::text) AS author_name,
  a.username AS author_username,
  COALESCE(NULLIF(a.profile_image_url, '')::text, NULLIF(a.avatar_url, '')::text) AS author_avatar,
  s.title,
  s.slug,
  s.description,
  s.excerpt,
  s.genre,
  s.cover_image_url,
  s.status,
  s.views_count,
  s.likes_count,
  s.comments_count,
  s.shares_count,
  s.created_at,
  s.updated_at,
  s.published_at,
  COALESCE(
    (SELECT array_agg(h.name)
     FROM public.admin_story_hashtags ash
     JOIN public.hashtags h ON ash.hashtag_id = h.id
     WHERE ash.story_id = s.id),
    ARRAY[]::varchar[]
  ) AS hashtags,
  (SELECT count(*)::integer FROM public.admin_story_chapters c WHERE c.story_id = s.id AND c.status = 'published') AS chapters_count
FROM public.admin_stories s
LEFT JOIN public.admin a ON s.admin_id = a.id

UNION ALL

SELECT
  s.id,
  s.creator_id AS author_id,
  'chronicle'::text AS author_type,
  COALESCE(NULLIF(c.pen_name, ''), NULLIF(c.display_name, ''), 'Unknown')::text AS author_name,
  c.pen_name AS author_username,
  COALESCE(NULLIF(c.profile_image_url, '')::text, NULLIF(c.avatar_url, '')::text) AS author_avatar,
  s.title,
  s.slug,
  s.description,
  s.excerpt,
  s.genre,
  s.cover_image_url,
  s.status,
  s.views_count,
  s.likes_count,
  s.comments_count,
  s.shares_count,
  s.created_at,
  s.updated_at,
  s.published_at,
  COALESCE(
    (SELECT array_agg(h.name)
     FROM public.chronicles_story_hashtags csh
     JOIN public.hashtags h ON csh.hashtag_id = h.id
     WHERE csh.story_id = s.id),
    ARRAY[]::varchar[]
  ) AS hashtags,
  (SELECT count(*)::integer FROM public.chronicles_story_chapters c WHERE c.story_id = s.id AND c.status = 'published') AS chapters_count
FROM public.chronicles_stories s
LEFT JOIN public.chronicles_creators c ON s.creator_id = c.id;

GRANT SELECT ON public.view_all_stories TO anon, authenticated;
