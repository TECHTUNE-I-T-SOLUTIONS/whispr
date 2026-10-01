-- Fix the create_content_fingerprint function to use creator_id instead of admin_id
-- This function is likely used by a trigger on chronicles_posts

-- First, let's see the current function definition
SELECT pg_get_functiondef('create_content_fingerprint'::regprocedure) as current_definition;

-- Find which trigger uses this function
SELECT 
  t.tgname as trigger_name,
  c.relname as table_name
FROM pg_trigger t
JOIN pg_proc p ON t.tgfoid = p.oid
JOIN pg_class c ON c.oid = t.tgrelid
WHERE p.proname = 'create_content_fingerprint';

-- Drop the trigger that uses this function on chronicles_posts
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;

-- Recreate the function to use creator_id for chronicles_posts
CREATE OR REPLACE FUNCTION create_content_fingerprint()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this is chronicles_posts (uses creator_id) or posts (uses admin_id)
  IF TG_TABLE_NAME = 'chronicles_posts' THEN
    INSERT INTO chronicles_content_fingerprints (post_id, creator_id, content_hash, created_at)
    VALUES (
      NEW.id,
      NEW.creator_id,
      md5(NEW.content),
      CURRENT_TIMESTAMP
    );
  ELSIF TG_TABLE_NAME = 'posts' THEN
    INSERT INTO chronicles_content_fingerprints (post_id, admin_id, content_hash, created_at)
    VALUES (
      NEW.id,
      NEW.admin_id,
      md5(NEW.content),
      CURRENT_TIMESTAMP
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger only if needed (for posts table, not chronicles_posts)
-- The trigger should only be on the posts table, not chronicles_posts
-- Drop it from chronicles_posts if it exists
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;

-- Recreate it on posts table if it was removed
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.posts;
CREATE TRIGGER trigger_content_fingerprint
AFTER INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint();