-- Recreate the content_fingerprint trigger properly for chronicles_posts
-- This will use creator_id instead of admin_id

-- First, drop the incorrect trigger from chronicles_posts
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.chronicles_posts;

-- Create a separate function for chronicles_posts that uses creator_id
CREATE OR REPLACE FUNCTION create_content_fingerprint_chronicles()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_content_fingerprints (post_id, creator_id, content_hash, created_at)
  VALUES (
    NEW.id,
    NEW.creator_id,
    md5(NEW.content),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger on chronicles_posts using the correct function
CREATE TRIGGER trigger_content_fingerprint
AFTER INSERT OR UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint_chronicles();

-- For the posts table, keep the original function or create a separate one
-- Drop the existing trigger on posts if it uses the wrong function
DROP TRIGGER IF EXISTS trigger_content_fingerprint ON public.posts;

-- Create function for posts that uses admin_id
CREATE OR REPLACE FUNCTION create_content_fingerprint_posts()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_content_fingerprints (post_id, admin_id, content_hash, created_at)
  VALUES (
    NEW.id,
    NEW.admin_id,
    md5(NEW.content),
    CURRENT_TIMESTAMP
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger on posts table
CREATE TRIGGER trigger_content_fingerprint
AFTER INSERT OR UPDATE ON public.posts
FOR EACH ROW
EXECUTE FUNCTION create_content_fingerprint_posts();

-- Verify triggers are created correctly
SELECT 
  trigger_name,
  event_object_table,
  action_timing,
  event_manipulation
FROM information_schema.triggers
WHERE trigger_name = 'trigger_content_fingerprint'
  AND trigger_schema = 'public';