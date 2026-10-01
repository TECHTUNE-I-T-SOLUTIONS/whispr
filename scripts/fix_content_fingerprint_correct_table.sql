-- Fix the content_fingerprint function to use the correct table schema
-- The table is 'content_fingerprints' with columns: article_id, article_type, sha256_hash, etc.
-- Also adds support for stories

-- Drop the existing triggers
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

-- Drop the old function
DROP FUNCTION IF EXISTS create_content_fingerprint() CASCADE;

-- Create the correct function for content_fingerprints table with ON CONFLICT handling
CREATE OR REPLACE FUNCTION create_content_fingerprint()
RETURNS TRIGGER AS $$
BEGIN
  -- For chronicles_posts: use creator_id and article_type = 'chronicles_post'
  IF TG_TABLE_NAME = 'chronicles_posts' THEN
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
      'chronicles_post',
      1,
      encode(sha256(NEW.content::bytea), 'hex'),
      length(NEW.content),
      COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
      NEW.creator_id,
      'sha-256',
      '{}'::jsonb
    )
    ON CONFLICT (sha256_hash) DO NOTHING;
  
  -- For posts: use admin_id and article_type = 'post'
  ELSIF TG_TABLE_NAME = 'posts' THEN
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
      'post',
      1,
      encode(sha256(NEW.content::bytea), 'hex'),
      length(NEW.content),
      COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
      NEW.admin_id,
      'sha-256',
      '{}'::jsonb
    )
    ON CONFLICT (sha256_hash) DO NOTHING;
  
  -- For chronicles_chain_entry_posts: use creator_id and article_type = 'chronicles_chain_entry'
  ELSIF TG_TABLE_NAME = 'chronicles_chain_entry_posts' THEN
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
      'chronicles_chain_entry',
      1,
      encode(sha256(NEW.content::bytea), 'hex'),
      length(NEW.content),
      COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
      NEW.creator_id,
      'sha-256',
      '{}'::jsonb
    )
    ON CONFLICT (sha256_hash) DO NOTHING;
  
  -- For chronicles_stories: use creator_id and article_type = 'story'
  ELSIF TG_TABLE_NAME = 'chronicles_stories' THEN
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
      'story',
      1,
      encode(sha256(NEW.description::bytea), 'hex'),
      length(NEW.description),
      COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
      NEW.creator_id,
      'sha-256',
      jsonb_build_object('title', NEW.title)
    )
    ON CONFLICT (sha256_hash) DO NOTHING;
  
  -- For chronicles_story_chapters: use creator_id and article_type = 'story_chapter'
  ELSIF TG_TABLE_NAME = 'chronicles_story_chapters' THEN
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
      'story_chapter',
      1,
      encode(sha256(NEW.content::bytea), 'hex'),
      length(NEW.content),
      COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
      NEW.creator_id,
      'sha-256',
      jsonb_build_object('story_id', NEW.story_id, 'sequence', NEW.sequence)
    )
    ON CONFLICT (sha256_hash) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate triggers for INSERT
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

CREATE TRIGGER trigger_create_fingerprint_insert_stories
AFTER INSERT ON public.chronicles_stories
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_insert_story_chapters
AFTER INSERT ON public.chronicles_story_chapters
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();

-- Recreate triggers for UPDATE
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

CREATE TRIGGER trigger_create_fingerprint_update_stories
AFTER UPDATE ON public.chronicles_stories
FOR EACH ROW
WHEN (OLD.description IS DISTINCT FROM NEW.description)
EXECUTE FUNCTION create_content_fingerprint();

CREATE TRIGGER trigger_create_fingerprint_update_story_chapters
AFTER UPDATE ON public.chronicles_story_chapters
FOR EACH ROW
WHEN (OLD.content IS DISTINCT FROM NEW.content)
EXECUTE FUNCTION create_content_fingerprint();

-- Update the article_type check constraint to include story types
ALTER TABLE public.content_fingerprints
DROP CONSTRAINT IF EXISTS content_fingerprints_article_type_check;

ALTER TABLE public.content_fingerprints
ADD CONSTRAINT content_fingerprints_article_type_check
CHECK (article_type = ANY (ARRAY['post'::text, 'chronicles_post'::text, 'chronicles_chain_entry'::text, 'story'::text, 'story_chapter'::text]));

-- Verify triggers are created
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name LIKE '%content_fingerprint%'
  AND trigger_schema = 'public'
ORDER BY trigger_name;