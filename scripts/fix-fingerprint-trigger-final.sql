-- =============================================================================
-- FIX: Broken content_fingerprint triggers
-- 
-- PROBLEM: The trigger function create_content_fingerprint() references
-- "chronicles_content_fingerprints" which does NOT exist in the database.
-- The correct table is "content_fingerprints" (public.content_fingerprints).
-- This causes all PUT (UPDATE) operations on the posts table to return 500.
--
-- SOLUTION: Drop all old broken trigger variants, then recreate the function
-- and triggers pointing to the correct "content_fingerprints" table.
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor > New query).
-- =============================================================================

-- Step 1: Drop ALL possible trigger names that might exist on these tables
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.posts;
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_chain_entry_posts;
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_stories;
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_story_chapters;

DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_posts ON public.posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_chronicles_posts ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_chain_entries ON public.chronicles_chain_entry_posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_stories ON public.chronicles_stories;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_story_chapters ON public.chronicles_story_chapters;

DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_posts ON public.posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_chronicles_posts ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_chain_entries ON public.chronicles_chain_entry_posts;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_stories ON public.chronicles_stories;
DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_story_chapters ON public.chronicles_story_chapters;

-- Step 2: Drop ALL old function variants (CASCADE removes any attached triggers)
DROP FUNCTION IF EXISTS create_content_fingerprint() CASCADE;
DROP FUNCTION IF EXISTS create_content_fingerprint_chronicles() CASCADE;
DROP FUNCTION IF EXISTS create_content_fingerprint_posts() CASCADE;

-- Step 3: Fix the article_type constraint to include all required values
ALTER TABLE public.content_fingerprints
DROP CONSTRAINT IF EXISTS content_fingerprints_article_type_check;

ALTER TABLE public.content_fingerprints
ADD CONSTRAINT content_fingerprints_article_type_check
CHECK (article_type = ANY (ARRAY[
  'post'::text,
  'chronicles_post'::text,
  'chronicles_chain_entry'::text,
  'story'::text,
  'story_chapter'::text
]));

-- Step 4: Create the unified fingerprint function targeting the CORRECT table
CREATE OR REPLACE FUNCTION create_content_fingerprint()
RETURNS TRIGGER AS $$
DECLARE
  v_article_type text;
  v_creator_id   uuid;
  v_content_text text;
  v_published_at timestamptz;
  v_meta         jsonb;
BEGIN
  IF TG_TABLE_NAME = 'chronicles_posts' THEN
    v_article_type := 'chronicles_post';
    v_creator_id   := NEW.creator_id;
    v_content_text := COALESCE(NEW.content, '');
    v_published_at := COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
    v_meta         := '{}'::jsonb;

  ELSIF TG_TABLE_NAME = 'posts' THEN
    v_article_type := 'post';
    v_creator_id   := NEW.admin_id;
    v_content_text := COALESCE(NEW.content, '');
    v_published_at := COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
    v_meta         := jsonb_build_object('type', COALESCE(NEW.type, 'blog'));

  ELSIF TG_TABLE_NAME = 'chronicles_chain_entry_posts' THEN
    v_article_type := 'chronicles_chain_entry';
    v_creator_id   := NEW.creator_id;
    v_content_text := COALESCE(NEW.content, '');
    v_published_at := COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
    v_meta         := '{}'::jsonb;

  ELSIF TG_TABLE_NAME = 'chronicles_stories' THEN
    v_article_type := 'story';
    v_creator_id   := NEW.creator_id;
    v_content_text := COALESCE(NEW.description, '');
    v_published_at := COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
    v_meta         := jsonb_build_object('title', COALESCE(NEW.title, ''));

  ELSIF TG_TABLE_NAME = 'chronicles_story_chapters' THEN
    v_article_type := 'story_chapter';
    v_creator_id   := NEW.creator_id;
    v_content_text := COALESCE(NEW.content, '');
    v_published_at := COALESCE(NEW.published_at, CURRENT_TIMESTAMP);
    v_meta         := jsonb_build_object(
                        'story_id', NEW.story_id,
                        'sequence', COALESCE(NEW.sequence, 1)
                      );
  ELSE
    RETURN NEW;
  END IF;

  IF v_creator_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Insert into the CORRECT table: public.content_fingerprints
  INSERT INTO public.content_fingerprints (
    article_id,
    article_type,
    article_version,
    sha256_hash,
    content_length,
    published_at,
    created_by,
    algorithm,
    metadata
  )
  VALUES (
    NEW.id,
    v_article_type,
    1,
    encode(sha256(v_content_text::bytea), 'hex'),
    length(v_content_text),
    v_published_at,
    v_creator_id,
    'sha-256',
    v_meta
  )
  ON CONFLICT (sha256_hash) DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 5: Attach INSERT triggers
CREATE TRIGGER trigger_create_fingerprint_insert_posts
AFTER INSERT ON public.posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_insert_chronicles_posts
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_insert_chain_entries
AFTER INSERT ON public.chronicles_chain_entry_posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chronicles_stories') THEN
    EXECUTE 'CREATE TRIGGER trigger_create_fingerprint_insert_stories
             AFTER INSERT ON public.chronicles_stories
             FOR EACH ROW EXECUTE FUNCTION create_content_fingerprint()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chronicles_story_chapters') THEN
    EXECUTE 'CREATE TRIGGER trigger_create_fingerprint_insert_story_chapters
             AFTER INSERT ON public.chronicles_story_chapters
             FOR EACH ROW EXECUTE FUNCTION create_content_fingerprint()';
  END IF;
END $$;

-- Step 6: Attach UPDATE triggers (only fire when content actually changes)
CREATE TRIGGER trigger_create_fingerprint_update_posts
AFTER UPDATE ON public.posts
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_update_chronicles_posts
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_update_chain_entries
AFTER UPDATE ON public.chronicles_chain_entry_posts
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION create_content_fingerprint();

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chronicles_stories') THEN
    EXECUTE 'CREATE TRIGGER trigger_create_fingerprint_update_stories
             AFTER UPDATE ON public.chronicles_stories
             FOR EACH ROW
             WHEN (OLD.description IS DISTINCT FROM NEW.description)
             EXECUTE FUNCTION create_content_fingerprint()';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'chronicles_story_chapters') THEN
    EXECUTE 'CREATE TRIGGER trigger_create_fingerprint_update_story_chapters
             AFTER UPDATE ON public.chronicles_story_chapters
             FOR EACH ROW
             WHEN (OLD.content IS DISTINCT FROM NEW.content)
             EXECUTE FUNCTION create_content_fingerprint()';
  END IF;
END $$;

-- Step 7: Verify – run this to confirm triggers are attached correctly
SELECT
  trigger_name,
  event_object_table AS table_name,
  action_timing,
  event_manipulation AS event
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND trigger_name LIKE '%fingerprint%'
ORDER BY event_object_table, event_manipulation;
