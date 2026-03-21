-- Migration: Add Comments and Likes tables for Chain Entry Posts
-- Created: 2026-03-19
-- Purpose: Enable tracking of likes and comments for writing chain entry posts

-- ============================================================================
-- 1. CREATE CHAIN ENTRY POST LIKES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chronicles_chain_entry_post_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_entry_post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'love'::text, 'wow'::text, 'haha'::text, 'sad'::text, 'angry'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_likes_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_likes_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_likes_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_likes_unique UNIQUE(chain_entry_post_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_chain_entry_post_likes_post_id ON public.chronicles_chain_entry_post_likes(chain_entry_post_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_likes_creator_id ON public.chronicles_chain_entry_post_likes(creator_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_likes_created_at ON public.chronicles_chain_entry_post_likes(created_at);

-- ============================================================================
-- 2. CREATE CHAIN ENTRY POST COMMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chronicles_chain_entry_post_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_entry_post_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_comments_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_comments_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_comments_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.chronicles_chain_entry_post_comments(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comments_post_id ON public.chronicles_chain_entry_post_comments(chain_entry_post_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comments_creator_id ON public.chronicles_chain_entry_post_comments(creator_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comments_parent_id ON public.chronicles_chain_entry_post_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comments_created_at ON public.chronicles_chain_entry_post_comments(created_at);

-- ============================================================================
-- 3. CREATE CHAIN ENTRY POST COMMENT REACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.chronicles_chain_entry_post_comment_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  reaction_type text DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'helpful'::text, 'love'::text, 'funny'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_comment_id_fkey FOREIGN KEY (comment_id) REFERENCES public.chronicles_chain_entry_post_comments(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_post_comment_reactions_unique UNIQUE(comment_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comment_reactions_comment_id ON public.chronicles_chain_entry_post_comment_reactions(comment_id);
CREATE INDEX IF NOT EXISTS idx_chain_entry_post_comment_reactions_creator_id ON public.chronicles_chain_entry_post_comment_reactions(creator_id);

-- ============================================================================
-- 4. ADD FOREIGN KEY REFERENCES TO CHAIN ENTRY POSTS TABLE
-- ============================================================================
-- Note: If these columns already exist, this will fail gracefully with IF NOT EXISTS
-- If they don't exist, uncomment to add them:

-- ALTER TABLE public.chronicles_chain_entry_posts
-- ADD COLUMN IF NOT EXISTS likes_table_id uuid,
-- ADD COLUMN IF NOT EXISTS comments_table_id uuid;

-- The likes_count, comments_count, shares_count, and views_count columns
-- already exist in chronicles_chain_entry_posts and will be updated by triggers

-- ============================================================================
-- 5. CREATE TRIGGERS FOR AUTOMATIC COUNT UPDATES (OPTIONAL BUT RECOMMENDED)
-- ============================================================================

-- Trigger to update likes_count when a like is added/removed
CREATE OR REPLACE FUNCTION update_chain_entry_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.chronicles_chain_entry_posts
    SET likes_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_likes
      WHERE chain_entry_post_id = NEW.chain_entry_post_id
    )
    WHERE id = NEW.chain_entry_post_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.chronicles_chain_entry_posts
    SET likes_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_likes
      WHERE chain_entry_post_id = OLD.chain_entry_post_id
    )
    WHERE id = OLD.chain_entry_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chain_entry_post_likes_count ON public.chronicles_chain_entry_post_likes;
CREATE TRIGGER trigger_update_chain_entry_post_likes_count
AFTER INSERT OR DELETE ON public.chronicles_chain_entry_post_likes
FOR EACH ROW
EXECUTE FUNCTION update_chain_entry_post_likes_count();

-- Trigger to update comments_count when a comment is added/removed
CREATE OR REPLACE FUNCTION update_chain_entry_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count top-level comments (where parent_comment_id IS NULL)
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NULL THEN
    UPDATE public.chronicles_chain_entry_posts
    SET comments_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_comments
      WHERE chain_entry_post_id = NEW.chain_entry_post_id AND parent_comment_id IS NULL
    )
    WHERE id = NEW.chain_entry_post_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NULL THEN
    UPDATE public.chronicles_chain_entry_posts
    SET comments_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_comments
      WHERE chain_entry_post_id = OLD.chain_entry_post_id AND parent_comment_id IS NULL
    )
    WHERE id = OLD.chain_entry_post_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chain_entry_post_comments_count ON public.chronicles_chain_entry_post_comments;
CREATE TRIGGER trigger_update_chain_entry_post_comments_count
AFTER INSERT OR DELETE ON public.chronicles_chain_entry_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_chain_entry_post_comments_count();

-- Trigger to update replies_count when a reply is added/removed
CREATE OR REPLACE FUNCTION update_chain_entry_post_reply_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.parent_comment_id IS NOT NULL THEN
    UPDATE public.chronicles_chain_entry_post_comments
    SET replies_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_comments
      WHERE parent_comment_id = NEW.parent_comment_id
    )
    WHERE id = NEW.parent_comment_id;
  ELSIF TG_OP = 'DELETE' AND OLD.parent_comment_id IS NOT NULL THEN
    UPDATE public.chronicles_chain_entry_post_comments
    SET replies_count = (
      SELECT COUNT(*) FROM public.chronicles_chain_entry_post_comments
      WHERE parent_comment_id = OLD.parent_comment_id
    )
    WHERE id = OLD.parent_comment_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chain_entry_post_reply_count ON public.chronicles_chain_entry_post_comments;
CREATE TRIGGER trigger_update_chain_entry_post_reply_count
AFTER INSERT OR DELETE ON public.chronicles_chain_entry_post_comments
FOR EACH ROW
EXECUTE FUNCTION update_chain_entry_post_reply_count();

-- ============================================================================
-- 6. ENABLE ROW LEVEL SECURITY (Optional but Recommended)
-- ============================================================================

-- ALTER TABLE public.chronicles_chain_entry_post_likes ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chronicles_chain_entry_post_comments ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.chronicles_chain_entry_post_comment_reactions ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the schema was created correctly:
/*
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'chronicles_chain_entry%'
ORDER BY table_name;

-- Check for foreign keys
SELECT constraint_name, table_name, column_name, foreign_table_name, foreign_column_name
FROM information_schema.key_column_usage
WHERE table_schema = 'public' 
AND table_name LIKE 'chronicles_chain_entry%'
AND referenced_table_name IS NOT NULL;
*/
