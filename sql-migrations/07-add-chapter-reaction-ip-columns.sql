-- ============================================================
-- MIGRATION: Add missing columns for chapter anonymous reactions
-- Run this AFTER you've created the main tables from migration 06
-- ============================================================

-- 1. ADD user_ip COLUMN TO EXISTING REACTION TABLES
ALTER TABLE IF EXISTS public.admin_story_chapter_reactions
  ADD COLUMN IF NOT EXISTS user_ip text;

ALTER TABLE IF EXISTS public.chronicles_story_chapter_reactions
  ADD COLUMN IF NOT EXISTS user_ip text;

-- 2. DROP THE OLD UNIQUE CONSTRAINT THAT REQUIRES user_id (anonymous users don't have one)
--    These constraints will fail for anonymous rows. Drop if exists, then we don't replace it.
ALTER TABLE IF EXISTS public.admin_story_chapter_reactions
  DROP CONSTRAINT IF EXISTS admin_story_chapter_reactions_user_chapter_unique;

ALTER TABLE IF EXISTS public.chronicles_story_chapter_reactions
  DROP CONSTRAINT IF EXISTS chronicles_story_chapter_reactions_user_chapter_unique;

-- 3. ADD COMMENTS/REACTIONS COUNT COLUMNS TO CHAPTER TABLES (if not already present)
DO $$
BEGIN
  -- Admin chapters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_story_chapters' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE public.admin_story_chapters ADD COLUMN comments_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_story_chapters' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE public.admin_story_chapters ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_story_chapters' AND column_name = 'dislikes_count'
  ) THEN
    ALTER TABLE public.admin_story_chapters ADD COLUMN dislikes_count integer DEFAULT 0;
  END IF;

  -- Chronicles chapters
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chronicles_story_chapters' AND column_name = 'comments_count'
  ) THEN
    ALTER TABLE public.chronicles_story_chapters ADD COLUMN comments_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chronicles_story_chapters' AND column_name = 'likes_count'
  ) THEN
    ALTER TABLE public.chronicles_story_chapters ADD COLUMN likes_count integer DEFAULT 0;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'chronicles_story_chapters' AND column_name = 'dislikes_count'
  ) THEN
    ALTER TABLE public.chronicles_story_chapters ADD COLUMN dislikes_count integer DEFAULT 0;
  END IF;
END $$;

-- 4. CREATE INDEXES FOR PERFORMANCE (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_admin_chapter_reactions_chapter ON public.admin_story_chapter_reactions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_reactions_story ON public.admin_story_chapter_reactions(story_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_reactions_chapter ON public.chronicles_story_chapter_reactions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_reactions_story ON public.chronicles_story_chapter_reactions(story_id);

-- 5. CREATE INDEXES FOR COMMENT TABLES (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_chapter ON public.admin_story_chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_story ON public.admin_story_chapter_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_parent ON public.admin_story_chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_status ON public.admin_story_chapter_comments(status);

CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_chapter ON public.chronicles_story_chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_story ON public.chronicles_story_chapter_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_parent ON public.chronicles_story_chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_status ON public.chronicles_story_chapter_comments(status);

-- 6. ENABLE ROW LEVEL SECURITY (safe to run even if already enabled)
ALTER TABLE IF EXISTS public.admin_story_chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chronicles_story_chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.admin_story_chapter_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.chronicles_story_chapter_reactions ENABLE ROW LEVEL SECURITY;

-- 7. RLS POLICIES (uses IF NOT EXISTS equivalent via DROP/CREATE pattern)
-- Comments: Anyone can read approved
DROP POLICY IF EXISTS "Anyone can read admin chapter comments" ON public.admin_story_chapter_comments;
CREATE POLICY "Anyone can read admin chapter comments"
  ON public.admin_story_chapter_comments FOR SELECT
  USING (status = 'approved' OR status = 'pending');

DROP POLICY IF EXISTS "Anyone can read chronicles chapter comments" ON public.chronicles_story_chapter_comments;
CREATE POLICY "Anyone can read chronicles chapter comments"
  ON public.chronicles_story_chapter_comments FOR SELECT
  USING (status = 'approved' OR status = 'pending');

-- Comments: Authenticated/anon users can insert
DROP POLICY IF EXISTS "Users can insert admin chapter comments" ON public.admin_story_chapter_comments;
CREATE POLICY "Users can insert admin chapter comments"
  ON public.admin_story_chapter_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

DROP POLICY IF EXISTS "Users can insert chronicles chapter comments" ON public.chronicles_story_chapter_comments;
CREATE POLICY "Users can insert chronicles chapter comments"
  ON public.chronicles_story_chapter_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Reactions: Anyone can read
DROP POLICY IF EXISTS "Anyone can read admin chapter reactions" ON public.admin_story_chapter_reactions;
CREATE POLICY "Anyone can read admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Anyone can read chronicles chapter reactions" ON public.chronicles_story_chapter_reactions;
CREATE POLICY "Anyone can read chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR SELECT
  USING (true);

-- Reactions: Authenticated users can insert/update/delete their own
DROP POLICY IF EXISTS "Users can insert admin chapter reactions" ON public.admin_story_chapter_reactions;
CREATE POLICY "Users can insert admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert chronicles chapter reactions" ON public.chronicles_story_chapter_reactions;
CREATE POLICY "Users can insert chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update admin chapter reactions" ON public.admin_story_chapter_reactions;
CREATE POLICY "Users can update admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update chronicles chapter reactions" ON public.chronicles_story_chapter_reactions;
CREATE POLICY "Users can update chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete admin chapter reactions" ON public.admin_story_chapter_reactions;
CREATE POLICY "Users can delete admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete chronicles chapter reactions" ON public.chronicles_story_chapter_reactions;
CREATE POLICY "Users can delete chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR DELETE
  USING (auth.uid() = user_id);

-- 8. ADD POLICY FOR ANONYMOUS REACTIONS VIA IP (authenticated users manage their own, anons are tracked by IP)
--    For anonymous users, we allow insert without user_id check since the API handles identity via user_ip
DROP POLICY IF EXISTS "Anonymous users can insert admin chapter reactions via IP" ON public.admin_story_chapter_reactions;
CREATE POLICY "Anonymous users can insert admin chapter reactions via IP"
  ON public.admin_story_chapter_reactions FOR INSERT
  WITH CHECK (user_id IS NULL AND user_ip IS NOT NULL);

DROP POLICY IF EXISTS "Anonymous users can insert chronicles chapter reactions via IP" ON public.chronicles_story_chapter_reactions;
CREATE POLICY "Anonymous users can insert chronicles chapter reactions via IP"
  ON public.chronicles_story_chapter_reactions FOR INSERT
  WITH CHECK (user_id IS NULL AND user_ip IS NOT NULL);