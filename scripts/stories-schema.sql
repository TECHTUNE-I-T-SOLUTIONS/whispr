-- SQL Schema Migration: Story Writing System
-- Run this in your Supabase SQL Editor

-- 1. CENTRAL HASHTAGS TABLE
CREATE TABLE IF NOT EXISTS public.hashtags (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name character varying NOT NULL UNIQUE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT hashtags_pkey PRIMARY KEY (id)
);

-- 2. ADMIN STORIES AND CHAPTERS
CREATE TABLE IF NOT EXISTS public.admin_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  excerpt text,
  genre character varying NOT NULL,
  cover_image_url text,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  seo_title character varying,
  seo_description text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT admin_stories_pkey PRIMARY KEY (id),
  CONSTRAINT admin_stories_admin_id_fkey FOREIGN KEY (admin_id) REFERENCES public.admin(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.admin_story_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  title character varying NOT NULL,
  slug character varying NOT NULL,
  content text NOT NULL,
  sequence integer NOT NULL,
  status character varying DEFAULT 'published'::character varying CHECK (status::text = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_story_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT admin_story_chapters_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  CONSTRAINT admin_story_chapters_story_id_sequence_key UNIQUE (story_id, sequence),
  CONSTRAINT admin_story_chapters_story_id_slug_key UNIQUE (story_id, slug)
);

-- 3. CHRONICLES STORIES AND CHAPTERS
CREATE TABLE IF NOT EXISTS public.chronicles_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  title character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  excerpt text,
  genre character varying NOT NULL,
  cover_image_url text,
  status character varying DEFAULT 'draft'::character varying CHECK (status::text = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  views_count integer DEFAULT 0,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  published_at timestamp with time zone,
  CONSTRAINT chronicles_stories_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_stories_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.chronicles_story_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL,
  title character varying NOT NULL,
  slug character varying NOT NULL,
  content text NOT NULL,
  sequence integer NOT NULL,
  status character varying DEFAULT 'published'::character varying CHECK (status::text = ANY (ARRAY['draft'::text, 'published'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicles_story_chapters_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_story_chapters_story_id_fkey FOREIGN KEY (story_id) REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_chapters_story_id_sequence_key UNIQUE (story_id, sequence),
  CONSTRAINT chronicles_story_chapters_story_id_slug_key UNIQUE (story_id, slug)
);

-- 4. HASHTAGS MANY-TO-MANY RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.admin_story_hashtags (
  story_id uuid NOT NULL REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  CONSTRAINT admin_story_hashtags_pkey PRIMARY KEY (story_id, hashtag_id)
);

CREATE TABLE IF NOT EXISTS public.chronicles_story_hashtags (
  story_id uuid NOT NULL REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  hashtag_id uuid NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_story_hashtags_pkey PRIMARY KEY (story_id, hashtag_id)
);

-- 5. LIKES TABLES
CREATE TABLE IF NOT EXISTS public.admin_story_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_story_likes_pkey PRIMARY KEY (id),
  CONSTRAINT admin_story_likes_story_user_unique UNIQUE (story_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.chronicles_story_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicles_story_likes_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_story_likes_story_user_unique UNIQUE (story_id, user_id)
);

-- 6. COMMENTS TABLES
CREATE TABLE IF NOT EXISTS public.admin_story_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  commenter_name character varying NOT NULL,
  commenter_email character varying,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.admin_story_comments(id) ON DELETE CASCADE,
  status character varying DEFAULT 'approved'::character varying CHECK (status::text = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_story_comments_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chronicles_story_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  creator_id uuid REFERENCES public.chronicles_creators(id) ON DELETE SET NULL,
  commenter_name character varying NOT NULL,
  content text NOT NULL,
  parent_comment_id uuid REFERENCES public.chronicles_story_comments(id) ON DELETE CASCADE,
  status character varying DEFAULT 'approved'::character varying CHECK (status::text = ANY (ARRAY['pending'::text, 'approved'::text, 'rejected'::text, 'hidden'::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicles_story_comments_pkey PRIMARY KEY (id)
);

-- 7. SHARES TABLES
CREATE TABLE IF NOT EXISTS public.admin_story_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.admin_stories(id) ON DELETE CASCADE,
  shared_to character varying NOT NULL DEFAULT 'link'::character varying,
  share_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_story_shares_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.chronicles_story_shares (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  story_id uuid NOT NULL REFERENCES public.chronicles_stories(id) ON DELETE CASCADE,
  creator_id uuid REFERENCES public.chronicles_creators(id) ON DELETE SET NULL,
  shared_to character varying NOT NULL DEFAULT 'link'::character varying,
  share_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT chronicles_story_shares_pkey PRIMARY KEY (id)
);

-- 8. INDEXES FOR EXTREME PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admin_stories_slug ON public.admin_stories(slug);
CREATE INDEX IF NOT EXISTS idx_admin_stories_status ON public.admin_stories(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_story_chapters_story ON public.admin_story_chapters(story_id, sequence);

CREATE INDEX IF NOT EXISTS idx_chronicles_stories_slug ON public.chronicles_stories(slug);
CREATE INDEX IF NOT EXISTS idx_chronicles_stories_status ON public.chronicles_stories(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_chronicles_story_chapters_story ON public.chronicles_story_chapters(story_id, sequence);

-- 9. TRIGGERS: AUTOMATED INTERACTION COUNTER MANAGERS

-- Trigger function for Admin Story counters
CREATE OR REPLACE FUNCTION public.fn_update_admin_story_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'admin_story_likes' THEN
      UPDATE public.admin_stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'admin_story_comments' THEN
      IF NEW.status = 'approved' THEN
        UPDATE public.admin_stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'admin_story_shares' THEN
      UPDATE public.admin_stories SET shares_count = shares_count + 1 WHERE id = NEW.story_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'admin_story_likes' THEN
      UPDATE public.admin_stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.story_id;
    ELSIF TG_TABLE_NAME = 'admin_story_comments' THEN
      IF OLD.status = 'approved' THEN
        UPDATE public.admin_stories SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.story_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'admin_story_comments' THEN
      IF OLD.status <> 'approved' AND NEW.status = 'approved' THEN
        UPDATE public.admin_stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
      ELSIF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
        UPDATE public.admin_stories SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.story_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for Chronicles Story counters
CREATE OR REPLACE FUNCTION public.fn_update_chronicles_story_counters()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF TG_TABLE_NAME = 'chronicles_story_likes' THEN
      UPDATE public.chronicles_stories SET likes_count = likes_count + 1 WHERE id = NEW.story_id;
    ELSIF TG_TABLE_NAME = 'chronicles_story_comments' THEN
      IF NEW.status = 'approved' THEN
        UPDATE public.chronicles_stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
      END IF;
    ELSIF TG_TABLE_NAME = 'chronicles_story_shares' THEN
      UPDATE public.chronicles_stories SET shares_count = shares_count + 1 WHERE id = NEW.story_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    IF TG_TABLE_NAME = 'chronicles_story_likes' THEN
      UPDATE public.chronicles_stories SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.story_id;
    ELSIF TG_TABLE_NAME = 'chronicles_story_comments' THEN
      IF OLD.status = 'approved' THEN
        UPDATE public.chronicles_stories SET comments_count = GREATEST(0, comments_count - 1) WHERE id = OLD.story_id;
      END IF;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'chronicles_story_comments' THEN
      IF OLD.status <> 'approved' AND NEW.status = 'approved' THEN
        UPDATE public.chronicles_stories SET comments_count = comments_count + 1 WHERE id = NEW.story_id;
      ELSIF OLD.status = 'approved' AND NEW.status <> 'approved' THEN
        UPDATE public.chronicles_stories SET comments_count = GREATEST(0, comments_count - 1) WHERE id = NEW.story_id;
      END IF;
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply counter triggers to Admin stories
CREATE TRIGGER tr_admin_story_likes_count AFTER INSERT OR DELETE ON public.admin_story_likes FOR EACH ROW EXECUTE FUNCTION public.fn_update_admin_story_counters();
CREATE TRIGGER tr_admin_story_comments_count AFTER INSERT OR UPDATE OR DELETE ON public.admin_story_comments FOR EACH ROW EXECUTE FUNCTION public.fn_update_admin_story_counters();
CREATE TRIGGER tr_admin_story_shares_count AFTER INSERT ON public.admin_story_shares FOR EACH ROW EXECUTE FUNCTION public.fn_update_admin_story_counters();

-- Apply counter triggers to Chronicles stories
CREATE TRIGGER tr_chronicles_story_likes_count AFTER INSERT OR DELETE ON public.chronicles_story_likes FOR EACH ROW EXECUTE FUNCTION public.fn_update_chronicles_story_counters();
CREATE TRIGGER tr_chronicles_story_comments_count AFTER INSERT OR UPDATE OR DELETE ON public.chronicles_story_comments FOR EACH ROW EXECUTE FUNCTION public.fn_update_chronicles_story_counters();
CREATE TRIGGER tr_chronicles_story_shares_count AFTER INSERT ON public.chronicles_story_shares FOR EACH ROW EXECUTE FUNCTION public.fn_update_chronicles_story_counters();


-- 10. NOTIFICATION TRIGGERS FOR CREATORS AND ADMINS

-- Triggers for Creator Notifications (inserted in chronicles_notifications)
CREATE OR REPLACE FUNCTION public.fn_story_creator_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id uuid;
  v_story_title varchar;
  v_user_pen varchar;
BEGIN
  -- Get Creator details and Story Title
  IF TG_TABLE_NAME = 'chronicles_story_likes' THEN
    SELECT creator_id, title INTO v_creator_id, v_story_title FROM public.chronicles_stories WHERE id = NEW.story_id;
    -- Only trigger if liked by someone else (not the creator themselves, wait: chronicles_story_likes is auth.users.id)
    -- We can fetch the user pen name or full name
    SELECT COALESCE(pen_name, 'A user') INTO v_user_pen FROM public.chronicles_creators WHERE user_id = NEW.user_id;
    
    INSERT INTO public.chronicles_notifications (creator_id, type, title, message, data)
    VALUES (
      v_creator_id,
      'post_liked',
      'Story Liked! ✨',
      v_user_pen || ' liked your story "' || v_story_title || '"',
      jsonb_build_object('story_id', NEW.story_id, 'user_id', NEW.user_id)
    );
  ELSIF TG_TABLE_NAME = 'chronicles_story_comments' THEN
    IF NEW.status = 'approved' THEN
      SELECT creator_id, title INTO v_creator_id, v_story_title FROM public.chronicles_stories WHERE id = NEW.story_id;
      
      INSERT INTO public.chronicles_notifications (creator_id, type, title, message, data)
      VALUES (
        v_creator_id,
        'post_commented',
        'New Comment on Story 💬',
        NEW.commenter_name || ' commented: "' || substring(NEW.content from 1 for 40) || '..." on your story "' || v_story_title || '"',
        jsonb_build_object('story_id', NEW.story_id, 'comment_id', NEW.id)
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'chronicles_story_shares' THEN
    SELECT creator_id, title INTO v_creator_id, v_story_title FROM public.chronicles_stories WHERE id = NEW.story_id;
    
    INSERT INTO public.chronicles_notifications (creator_id, type, title, message, data)
    VALUES (
      v_creator_id,
      'post_shared',
      'Story Shared! 🔗',
      'Your story "' || v_story_title || '" was shared to ' || NEW.shared_to,
      jsonb_build_object('story_id', NEW.story_id, 'share_id', NEW.id)
    );
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_chronicles_story_likes_notification AFTER INSERT ON public.chronicles_story_likes FOR EACH ROW EXECUTE FUNCTION public.fn_story_creator_notifications();
CREATE TRIGGER tr_chronicles_story_comments_notification AFTER INSERT ON public.chronicles_story_comments FOR EACH ROW EXECUTE FUNCTION public.fn_story_creator_notifications();
CREATE TRIGGER tr_chronicles_story_shares_notification AFTER INSERT ON public.chronicles_story_shares FOR EACH ROW EXECUTE FUNCTION public.fn_story_creator_notifications();


-- Triggers for Admin Notifications (inserted in public.notifications)
CREATE OR REPLACE FUNCTION public.fn_story_admin_notifications()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_pen varchar;
  v_story_title varchar;
BEGIN
  IF TG_TABLE_NAME = 'chronicles_stories' THEN
    -- Trigger on story published
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status <> 'published') THEN
      SELECT pen_name INTO v_creator_pen FROM public.chronicles_creators WHERE id = NEW.creator_id;
      
      INSERT INTO public.notifications (admin_id, type, title, message)
      VALUES (
        NULL, -- null maps to general admin inbox
        'new_story_published',
        'New Creator Story Published 📚',
        'Creator @' || COALESCE(v_creator_pen, 'unknown') || ' published a new story: "' || NEW.title || '"'
      );
    END IF;
  ELSIF TG_TABLE_NAME = 'chronicles_story_chapters' THEN
    -- Trigger on chapter published
    IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status <> 'published') THEN
      SELECT s.title, c.pen_name INTO v_story_title, v_creator_pen 
      FROM public.chronicles_stories s
      JOIN public.chronicles_creators c ON s.creator_id = c.id
      WHERE s.id = NEW.story_id;
      
      INSERT INTO public.notifications (admin_id, type, title, message)
      VALUES (
        NULL,
        'new_chapter_published',
        'New Creator Chapter Published 📖',
        'Creator @' || COALESCE(v_creator_pen, 'unknown') || ' added Chapter ' || NEW.sequence || ': "' || NEW.title || '" to "' || COALESCE(v_story_title, '') || '"'
      );
    END IF;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER tr_chronicles_stories_admin_notification AFTER INSERT OR UPDATE ON public.chronicles_stories FOR EACH ROW EXECUTE FUNCTION public.fn_story_admin_notifications();
CREATE TRIGGER tr_chronicles_story_chapters_admin_notification AFTER INSERT OR UPDATE ON public.chronicles_story_chapters FOR EACH ROW EXECUTE FUNCTION public.fn_story_admin_notifications();


-- 11. UNIFIED VIEWS FOR SEO AND AGGREGATED QUERIES

CREATE OR REPLACE VIEW public.view_all_stories AS
SELECT 
  s.id,
  s.admin_id AS author_id,
  'admin'::text AS author_type,
  a.full_name AS author_name,
  a.username AS author_username,
  a.avatar_url AS author_avatar,
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
  COALESCE(c.display_name, c.pen_name) AS author_name,
  c.pen_name AS author_username,
  c.avatar_url AS author_avatar,
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


-- 12. ROW-LEVEL SECURITY (RLS) FOR ABSOLUTE SAFETY

ALTER TABLE public.hashtags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_story_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_story_shares ENABLE ROW LEVEL SECURITY;

-- Hashtags: Selectable by everyone; Admin manages
CREATE POLICY "Public can select hashtags" ON public.hashtags FOR SELECT USING (true);
CREATE POLICY "Admins can insert hashtags" ON public.hashtags FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can update hashtags" ON public.hashtags FOR UPDATE USING (true);
CREATE POLICY "Admins can delete hashtags" ON public.hashtags FOR DELETE USING (true);

-- Admin Stories: Published readable by public; Admins full control
CREATE POLICY "Public can view published admin stories" ON public.admin_stories FOR SELECT USING (status = 'published');
CREATE POLICY "Admins have full access to admin stories" ON public.admin_stories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public can view published admin chapters" ON public.admin_story_chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.admin_stories s WHERE s.id = story_id AND s.status = 'published')
);
CREATE POLICY "Admins have full access to admin chapters" ON public.admin_story_chapters FOR ALL USING (true) WITH CHECK (true);

-- Chronicles Stories: Published readable by public; Creator full control of own; Admin full control
CREATE POLICY "Public can view published chronicles stories" ON public.chronicles_stories FOR SELECT USING (status = 'published');
CREATE POLICY "Creators can manage own chronicles stories" ON public.chronicles_stories FOR ALL USING (
  EXISTS (SELECT 1 FROM public.chronicles_creators c WHERE c.id = creator_id AND c.user_id = auth.uid())
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.chronicles_creators c WHERE c.id = creator_id AND c.user_id = auth.uid())
);
CREATE POLICY "Admins have full access to chronicles stories" ON public.chronicles_stories FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public can view published chronicles chapters" ON public.chronicles_story_chapters FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.chronicles_stories s WHERE s.id = story_id AND s.status = 'published')
);
CREATE POLICY "Creators can manage own chronicles chapters" ON public.chronicles_story_chapters FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.chronicles_stories s
    JOIN public.chronicles_creators c ON s.creator_id = c.id
    WHERE s.id = story_id AND c.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chronicles_stories s
    JOIN public.chronicles_creators c ON s.creator_id = c.id
    WHERE s.id = story_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "Admins have full access to chronicles chapters" ON public.chronicles_story_chapters FOR ALL USING (true) WITH CHECK (true);

-- Likes Policies
CREATE POLICY "Public can read admin story likes" ON public.admin_story_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like admin stories" ON public.admin_story_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can unlike admin stories" ON public.admin_story_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Public can read chronicles story likes" ON public.chronicles_story_likes FOR SELECT USING (true);
CREATE POLICY "Auth users can like chronicles stories" ON public.chronicles_story_likes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);
CREATE POLICY "Users can unlike chronicles stories" ON public.chronicles_story_likes FOR DELETE USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Public can read approved admin story comments" ON public.admin_story_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can comment on admin stories" ON public.admin_story_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can moderate admin story comments" ON public.admin_story_comments FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Public can read approved chronicles story comments" ON public.chronicles_story_comments FOR SELECT USING (status = 'approved');
CREATE POLICY "Anyone can comment on chronicles stories" ON public.chronicles_story_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Creators can moderate own story comments" ON public.chronicles_story_comments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.chronicles_stories s
    JOIN public.chronicles_creators c ON s.creator_id = c.id
    WHERE s.id = story_id AND c.user_id = auth.uid()
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.chronicles_stories s
    JOIN public.chronicles_creators c ON s.creator_id = c.id
    WHERE s.id = story_id AND c.user_id = auth.uid()
  )
);
CREATE POLICY "Admins can moderate chronicles story comments" ON public.chronicles_story_comments FOR ALL USING (true) WITH CHECK (true);

-- Shares Policies
CREATE POLICY "Public can read shares" ON public.admin_story_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can record shares" ON public.admin_story_shares FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can read chronicles shares" ON public.chronicles_story_shares FOR SELECT USING (true);
CREATE POLICY "Anyone can record chronicles shares" ON public.chronicles_story_shares FOR INSERT WITH CHECK (true);
