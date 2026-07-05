-- ============================================================
-- MIGRATION: Story Chapter Comments & Reactions
-- Creates tables for chapter-level comments (with guest support)
-- and reactions (like/dislike) for both admin and chronicles stories
-- ============================================================

-- 1. ADMIN STORY CHAPTER COMMENTS
CREATE TABLE IF NOT EXISTS public.admin_story_chapter_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  story_id uuid NOT NULL,
  user_id uuid, -- nullable for guest commenters
  commenter_name text NOT NULL,
  commenter_email text, -- nullable, cached for guest return visitors
  content text NOT NULL,
  parent_comment_id uuid,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_story_chapter_comments_pkey PRIMARY KEY (id),
  CONSTRAINT admin_story_chapter_comments_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.admin_story_chapters(id) ON DELETE CASCADE,
  CONSTRAINT admin_story_chapter_comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  CONSTRAINT admin_story_chapter_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.admin_story_chapter_comments(id) ON DELETE CASCADE
);

-- 2. CHRONICLES STORY CHAPTER COMMENTS
CREATE TABLE IF NOT EXISTS public.chronicles_story_chapter_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  story_id uuid NOT NULL,
  user_id uuid, -- nullable for guest commenters
  creator_id uuid, -- if the commenter is a chronicles creator
  commenter_name text NOT NULL,
  commenter_email text, -- nullable, cached for guest return visitors
  content text NOT NULL,
  parent_comment_id uuid,
  likes_count integer DEFAULT 0,
  replies_count integer DEFAULT 0,
  status text DEFAULT 'approved'::text CHECK (status = ANY (ARRAY['approved'::text, 'pending'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_story_chapter_comments_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_story_chapter_comments_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chronicles_story_chapters(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapter_comments_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapter_comments_parent_comment_id_fkey FOREIGN KEY (parent_comment_id) REFERENCES public.chronicles_story_chapter_comments(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapter_comments_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE SET NULL
);

-- 3. ADMIN STORY CHAPTER REACTIONS (like/dislike)
-- Supports both authenticated (user_id) and anonymous (user_ip) reactors
CREATE TABLE IF NOT EXISTS public.admin_story_chapter_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  story_id uuid NOT NULL,
  user_id uuid, -- nullable for guest reactions via IP
  user_ip text, -- nullable for authenticated users
  reaction_type text NOT NULL DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'dislike'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT admin_story_chapter_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT admin_story_chapter_reactions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.admin_story_chapters(id) ON DELETE CASCADE,
  CONSTRAINT admin_story_chapter_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.admin_stories(id) ON DELETE CASCADE
);

-- 4. CHRONICLES STORY CHAPTER REACTIONS (like/dislike)
-- Supports both authenticated (user_id/creator_id) and anonymous (user_ip) reactors
CREATE TABLE IF NOT EXISTS public.chronicles_story_chapter_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chapter_id uuid NOT NULL,
  story_id uuid NOT NULL,
  user_id uuid, -- nullable for guest reactions
  user_ip text, -- nullable for authenticated users
  creator_id uuid, -- if the reactor is a chronicles creator
  reaction_type text NOT NULL DEFAULT 'like'::text CHECK (reaction_type = ANY (ARRAY['like'::text, 'dislike'::text])),
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_story_chapter_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_story_chapter_reactions_chapter_id_fkey FOREIGN KEY (chapter_id) REFERENCES public.chronicles_story_chapters(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapter_reactions_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapter_reactions_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE SET NULL
);

-- 5. ADD CHAPTER COMMENTS COUNT AND REACTIONS COUNT COLUMNS TO CHAPTER TABLES
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

-- 6. CREATE INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_chapter ON public.admin_story_chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_story ON public.admin_story_chapter_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_parent ON public.admin_story_chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_comments_status ON public.admin_story_chapter_comments(status);

CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_chapter ON public.chronicles_story_chapter_comments(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_story ON public.chronicles_story_chapter_comments(story_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_parent ON public.chronicles_story_chapter_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_comments_status ON public.chronicles_story_chapter_comments(status);

CREATE INDEX IF NOT EXISTS idx_admin_chapter_reactions_chapter ON public.admin_story_chapter_reactions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_admin_chapter_reactions_story ON public.admin_story_chapter_reactions(story_id);

CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_reactions_chapter ON public.chronicles_story_chapter_reactions(chapter_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_chapter_reactions_story ON public.chronicles_story_chapter_reactions(story_id);

-- 7. ENABLE ROW LEVEL SECURITY
ALTER TABLE public.admin_story_chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_chapter_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_story_chapter_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_chapter_reactions ENABLE ROW LEVEL SECURITY;

-- 8. RLS POLICIES - Comments are readable by everyone
CREATE POLICY "Anyone can read admin chapter comments"
  ON public.admin_story_chapter_comments FOR SELECT
  USING (status = 'approved' OR status = 'pending');

CREATE POLICY "Anyone can read chronicles chapter comments"
  ON public.chronicles_story_chapter_comments FOR SELECT
  USING (status = 'approved' OR status = 'pending');

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert admin chapter comments"
  ON public.admin_story_chapter_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

CREATE POLICY "Authenticated users can insert chronicles chapter comments"
  ON public.chronicles_story_chapter_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');

-- Reactions readable by everyone
CREATE POLICY "Anyone can read admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can read chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR SELECT
  USING (true);

-- Authenticated users can insert/update their own reactions
CREATE POLICY "Users can manage their own admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage their own chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own admin chapter reactions"
  ON public.admin_story_chapter_reactions FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chronicles chapter reactions"
  ON public.chronicles_story_chapter_reactions FOR DELETE
  USING (auth.uid() = user_id);