-- ============================================================================
-- Chronicles Post Reactions & Shares Tables Migration
-- ============================================================================
-- This migration creates the missing tables for tracking reactions and shares
-- on chronicles posts, following the same pattern as chronicles_comments

-- ============================================================================
-- Table: chronicles_post_reactions
-- Purpose: Track individual user reactions to chronicle posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chronicles_post_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text NOT NULL DEFAULT 'like'::text 
    CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'wow'::text, 'haha'::text, 'sad'::text, 'angry'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_reactions_post_id_fkey FOREIGN KEY (post_id) 
    REFERENCES public.chronicles_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_post_reactions_creator_id_fkey FOREIGN KEY (creator_id) 
    REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_post_reactions_unique UNIQUE (post_id, creator_id, reaction_type)
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_chronicles_post_reactions_post_id 
  ON public.chronicles_post_reactions(post_id);

CREATE INDEX IF NOT EXISTS idx_chronicles_post_reactions_creator_id 
  ON public.chronicles_post_reactions(creator_id);

CREATE INDEX IF NOT EXISTS idx_chronicles_post_reactions_created_at 
  ON public.chronicles_post_reactions(created_at DESC);

-- ============================================================================
-- Table: chronicles_post_shares
-- Purpose: Track individual user shares of chronicle posts
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chronicles_post_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  shared_to text NOT NULL DEFAULT 'unknown'::text 
    CHECK (shared_to = ANY (ARRAY['email'::text, 'social'::text, 'link'::text, 'unknown'::text])),
  share_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_post_shares_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_post_shares_post_id_fkey FOREIGN KEY (post_id) 
    REFERENCES public.chronicles_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_post_shares_creator_id_fkey FOREIGN KEY (creator_id) 
    REFERENCES public.chronicles_creators(id) ON DELETE CASCADE
);

-- Indexes for optimal query performance
CREATE INDEX IF NOT EXISTS idx_chronicles_post_shares_post_id 
  ON public.chronicles_post_shares(post_id);

CREATE INDEX IF NOT EXISTS idx_chronicles_post_shares_creator_id 
  ON public.chronicles_post_shares(creator_id);

CREATE INDEX IF NOT EXISTS idx_chronicles_post_shares_created_at 
  ON public.chronicles_post_shares(created_at DESC);

-- ============================================================================
-- Trigger Function: Update chronicles_posts.likes_count on reaction changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chronicles_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reaction_type = 'like' THEN
    UPDATE public.chronicles_posts
    SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reaction_type = 'like' THEN
    UPDATE public.chronicles_posts
    SET likes_count = GREATEST(likes_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_chronicles_post_likes_count 
  ON public.chronicles_post_reactions;

-- Create trigger to automatically update likes_count
CREATE TRIGGER trigger_update_chronicles_post_likes_count
AFTER INSERT OR DELETE ON public.chronicles_post_reactions
FOR EACH ROW
EXECUTE FUNCTION update_chronicles_post_likes_count();

-- ============================================================================
-- Trigger Function: Update chronicles_posts.shares_count on share creation
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chronicles_post_shares_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chronicles_posts
    SET shares_count = shares_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chronicles_posts
    SET shares_count = GREATEST(shares_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_chronicles_post_shares_count 
  ON public.chronicles_post_shares;

-- Create trigger to automatically update shares_count
CREATE TRIGGER trigger_update_chronicles_post_shares_count
AFTER INSERT OR DELETE ON public.chronicles_post_shares
FOR EACH ROW
EXECUTE FUNCTION update_chronicles_post_shares_count();

-- ============================================================================
-- Trigger Function: Update chronicles_posts.comments_count on comment changes
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chronicles_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.status = 'approved' THEN
    UPDATE public.chronicles_posts
    SET comments_count = comments_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'approved' THEN
    UPDATE public.chronicles_posts
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status = 'approved' AND OLD.status != 'approved' THEN
    UPDATE public.chronicles_posts
    SET comments_count = comments_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.post_id;
  ELSIF TG_OP = 'UPDATE' AND NEW.status != 'approved' AND OLD.status = 'approved' THEN
    UPDATE public.chronicles_posts
    SET comments_count = GREATEST(comments_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_chronicles_post_comments_count 
  ON public.chronicles_comments;

-- Create trigger to automatically update comments_count
CREATE TRIGGER trigger_update_chronicles_post_comments_count
AFTER INSERT OR DELETE OR UPDATE ON public.chronicles_comments
FOR EACH ROW
EXECUTE FUNCTION update_chronicles_post_comments_count();

-- ============================================================================
-- Trigger Function: Update chronicles_comments.likes_count on comment reaction
-- ============================================================================
CREATE OR REPLACE FUNCTION update_chronicles_comment_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.reaction_type = 'like' THEN
    UPDATE public.chronicles_comments
    SET likes_count = likes_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.reaction_type = 'like' THEN
    UPDATE public.chronicles_comments
    SET likes_count = GREATEST(likes_count - 1, 0), updated_at = CURRENT_TIMESTAMP
    WHERE id = OLD.comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_chronicles_comment_likes_count 
  ON public.chronicles_comment_reactions;

-- Create trigger to automatically update comment likes_count
CREATE TRIGGER trigger_update_chronicles_comment_likes_count
AFTER INSERT OR DELETE ON public.chronicles_comment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_chronicles_comment_likes_count();

-- ============================================================================
-- Verification: Check tables were created successfully
-- ============================================================================
-- SELECT 
--   table_name,
--   column_name,
--   data_type,
--   is_nullable
-- FROM information_schema.columns
-- WHERE table_name IN ('chronicles_post_reactions', 'chronicles_post_shares')
-- ORDER BY table_name, ordinal_position;
