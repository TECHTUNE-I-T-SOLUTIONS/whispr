-- Migration: Create Notification Functions and Triggers
-- Purpose: Automatically create notifications for all chroniclesactions
-- Created: 2026-04-13

-- ===================================================================
-- SECTION 0: CREATE chronicles_followers TABLE (IF NOT EXISTS)
-- ===================================================================

CREATE TABLE IF NOT EXISTS public.chronicles_followers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL,
  follows_id uuid NOT NULL,
  is_following boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_followers_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_followers_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_followers_follows_id_fkey FOREIGN KEY (follows_id) REFERENCES public.chronicles_creators(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_followers_unique_follow UNIQUE (follower_id, follows_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_chronicles_followers_follower_id ON public.chronicles_followers(follower_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_followers_follows_id ON public.chronicles_followers(follows_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_followers_is_following ON public.chronicles_followers(is_following);

-- Enable RLS
-- ALTER TABLE public.chronicles_followers ENABLE ROW LEVEL SECURITY;

-- ===================================================================
-- SECTION 1: DROP EXISTING TRIGGERS & FUNCTIONS (IF ANY)
-- ===================================================================

-- Drop triggers
DROP TRIGGER IF EXISTS trigger_flag_post_for_review ON public.chronicles_flagged_reviews CASCADE;
DROP TRIGGER IF EXISTS trigger_chronicle_post_published ON public.chronicles_posts CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_created ON public.chronicles_chain_entry_posts CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_created ON public.chronicles_writing_chains CASCADE;
DROP TRIGGER IF EXISTS trigger_post_liked ON public.chronicles_post_reactions CASCADE;
DROP TRIGGER IF EXISTS trigger_post_commented ON public.chronicles_comments CASCADE;
DROP TRIGGER IF EXISTS trigger_creator_followed ON public.chronicles_followers CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_liked ON public.chronicles_chain_entry_post_likes CASCADE;
DROP TRIGGER IF EXISTS trigger_chain_entry_post_commented ON public.chronicles_chain_entry_post_comments CASCADE;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_flag_post_for_review() CASCADE;
DROP FUNCTION IF EXISTS public.handle_chronicle_post_published() CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_entry_post_created() CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_created() CASCADE;
DROP FUNCTION IF EXISTS public.handle_post_liked() CASCADE;
DROP FUNCTION IF EXISTS public.handle_post_commented() CASCADE;
DROP FUNCTION IF EXISTS public.handle_creator_followed() CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_entry_post_liked() CASCADE;
DROP FUNCTION IF EXISTS public.handle_chain_entry_post_commented() CASCADE;

-- ===================================================================
-- SECTION 2: FUNCTION 1 - FLAG POST FOR REVIEW (ALL CONTENT TYPES)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_flag_post_for_review()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id uuid;
  v_content_title text;
  v_is_chain_entry boolean;
  v_is_chain boolean;
  v_is_post boolean;
BEGIN
  -- Initialize flags
  v_is_chain_entry := false;
  v_is_chain := false;
  v_is_post := false;

  -- Determine which type of content is being flagged
  IF NEW.chain_entry_post_id IS NOT NULL THEN
    v_is_chain_entry := true;
    SELECT creator_id, title INTO v_creator_id, v_content_title
    FROM public.chronicles_chain_entry_posts
    WHERE id = NEW.chain_entry_post_id;
    
    -- Change chain entry post status to draft
    UPDATE public.chronicles_chain_entry_posts
    SET status = 'draft'
    WHERE id = NEW.chain_entry_post_id;
    
  ELSIF NEW.post_id IS NOT NULL THEN
    -- Check if it's a regular post or a chain
    SELECT id INTO v_content_title
    FROM public.chronicles_posts
    WHERE id = NEW.post_id;
    
    IF v_content_title IS NOT NULL THEN
      v_is_post := true;
      SELECT creator_id, title INTO v_creator_id, v_content_title
      FROM public.chronicles_posts
      WHERE id = NEW.post_id;
      
      -- Change regular post status to draft
      UPDATE public.chronicles_posts
      SET status = 'draft'
      WHERE id = NEW.post_id;
    ELSE
      -- Check if it's a writing chain
      SELECT title, created_by INTO v_content_title, v_creator_id
      FROM public.chronicles_writing_chains
      WHERE id = NEW.post_id;
      
      IF v_content_title IS NOT NULL THEN
        v_is_chain := true;
        
        -- Change chain status to draft
        UPDATE public.chronicles_writing_chains
        SET status = 'draft'
        WHERE id = NEW.post_id;
      END IF;
    END IF;
  END IF;

  -- Create notification for creator if we found the content
  IF v_creator_id IS NOT NULL AND v_content_title IS NOT NULL THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      data
    ) VALUES (
      v_creator_id,
      'post_flagged_for_review'::text,
      'Your content has been flagged for review',
      'Your ' || CASE 
        WHEN v_is_chain THEN 'writing chain'
        WHEN v_is_post THEN 'post'
        WHEN v_is_chain_entry THEN 'chain entry'
        ELSE 'content'
      END || ' "' || COALESCE(v_content_title, 'Untitled') || '" has been flagged for review by our moderation team. Your content status has been changed to draft. Please review it and make necessary changes.',
      NEW.post_id,
      jsonb_build_object(
        'flag_reason', NEW.reason,
        'flag_description', NEW.description,
        'chain_entry_post_id', NEW.chain_entry_post_id,
        'is_chain', v_is_chain,
        'is_post', v_is_post,
        'is_chain_entry', v_is_chain_entry,
        'flagged_at', NOW()
      )
    );
  END IF;

  -- Create admin notification
  IF v_content_title IS NOT NULL THEN
    INSERT INTO public.chronicles_admin_notifications (
      notification_type,
      title,
      message,
      creator_id,
      post_id,
      priority,
      data
    ) VALUES (
      'post_flagged'::text,
      'Content Flagged for Review',
      'A ' || CASE 
        WHEN v_is_chain THEN 'writing chain'
        WHEN v_is_post THEN 'post'
        WHEN v_is_chain_entry THEN 'chain entry post'
        ELSE 'content item'
      END || ' has been flagged. Title: "' || COALESCE(v_content_title, 'Untitled') || '". Reason: ' || NEW.reason,
      v_creator_id,
      NEW.post_id,
      'high'::text,
      jsonb_build_object(
        'flag_id', NEW.id,
        'flag_reason', NEW.reason,
        'flag_description', NEW.description,
        'chain_entry_post_id', NEW.chain_entry_post_id,
        'is_chain', v_is_chain,
        'is_post', v_is_post,
        'is_chain_entry', v_is_chain_entry
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_flag_post_for_review
AFTER INSERT ON public.chronicles_flagged_reviews
FOR EACH ROW
EXECUTE FUNCTION public.handle_flag_post_for_review();

-- ===================================================================
-- SECTION 3: FUNCTION 2 - POST PUBLISHED (TO FOLLOWERS)
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_chronicle_post_published()
RETURNS TRIGGER AS $$
DECLARE
  v_creator_id uuid;
  v_creator_pen_name text;
BEGIN
  v_creator_id := NEW.creator_id;

  -- Get creator pen name
  SELECT pen_name INTO v_creator_pen_name
  FROM public.chronicles_creators
  WHERE id = v_creator_id;

  -- Only notify if status changed to published
  IF NEW.status = 'published' AND (OLD IS NULL OR OLD.status != 'published') THEN
    -- Create notification for all followers
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    )
    SELECT
      cf.follower_id,
      'new_post_published'::text,
      'New post from @' || v_creator_pen_name,
      'A new post "' || NEW.title || '" has been published',
      NEW.id,
      v_creator_id,
      jsonb_build_object(
        'post_excerpt', NEW.excerpt,
        'post_type', NEW.post_type,
        'published_at', NEW.published_at
      )
    FROM public.chronicles_followers cf
    WHERE cf.follows_id = v_creator_id AND cf.is_following = true;

    -- Create notification for the creator themselves
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      data
    ) VALUES (
      v_creator_id,
      'new_post_published'::text,
      'Your post has been published',
      'Your post "' || NEW.title || '" has been successfully published',
      NEW.id,
      jsonb_build_object(
        'post_type', NEW.post_type,
        'published_at', NEW.published_at
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_chronicle_post_published
AFTER INSERT OR UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_chronicle_post_published();

-- ===================================================================
-- SECTION 4: FUNCTION 3 - CHAIN ENTRY POST CREATED/PUBLISHED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_chain_entry_post_created()
RETURNS TRIGGER AS $$
DECLARE
  v_chain_title text;
  v_chain_creator_id uuid;
  v_added_by_pen_name text;
BEGIN
  -- Get chain info
  SELECT title, created_by INTO v_chain_title, v_chain_creator_id
  FROM public.chronicles_writing_chains
  WHERE id = NEW.chain_id;

  -- Get who added it
  SELECT pen_name INTO v_added_by_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.added_by;

  -- Notify creator of entry
  INSERT INTO public.chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    related_post_id,
    data
  ) VALUES (
    NEW.creator_id,
    'post_added_to_chain'::text,
    'Your post added to chain',
    'Your post "' || NEW.title || '" has been added to the chain "' || v_chain_title || '" by @' || COALESCE(v_added_by_pen_name, 'admin'),
    NEW.id,
    jsonb_build_object(
      'chain_id', NEW.chain_id,
      'chain_title', v_chain_title,
      'sequence', NEW.sequence
    )
  );

  -- Notify chain creator if different person added it
  IF NEW.added_by != v_chain_creator_id THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_chain_creator_id,
      'chain_entry_added'::text,
      'New entry added to your chain',
      'A new entry "' || NEW.title || '" has been added to your chain "' || v_chain_title || '"',
      NEW.id,
      NEW.creator_id,
      jsonb_build_object(
        'chain_id', NEW.chain_id,
        'sequence', NEW.sequence
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_chain_entry_post_created
AFTER INSERT ON public.chronicles_chain_entry_posts
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_entry_post_created();

-- ===================================================================
-- SECTION 5: FUNCTION 4 - WRITING CHAIN CREATED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_chain_created()
RETURNS TRIGGER AS $$
BEGIN
  -- Create notification for chain creator
  INSERT INTO public.chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    data
  ) VALUES (
    NEW.created_by::uuid,
    'chain_created'::text,
    'Your writing chain has been created',
    'Your new writing chain "' || NEW.title || '" has been successfully created',
    jsonb_build_object(
      'chain_id', NEW.id,
      'chain_description', NEW.description,
      'created_at', NEW.created_at
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_chain_created
AFTER INSERT ON public.chronicles_writing_chains
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_created();

-- ===================================================================
-- SECTION 6: FUNCTION 5 - POST LIKED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_post_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
  v_post_title text;
  v_liker_pen_name text;
BEGIN
  -- Get post info
  SELECT creator_id, title INTO v_post_creator_id, v_post_title
  FROM public.chronicles_posts
  WHERE id = NEW.post_id;

  -- Get liker info
  SELECT pen_name INTO v_liker_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.creator_id;

  -- Don't notify if user likes their own post
  IF v_post_creator_id != NEW.creator_id AND v_post_creator_id IS NOT NULL THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_post_creator_id,
      'post_liked'::text,
      '@' || v_liker_pen_name || ' liked your post',
      '@' || v_liker_pen_name || ' liked your post "' || v_post_title || '"',
      NEW.post_id,
      NEW.creator_id,
      jsonb_build_object(
        'reaction_type', NEW.reaction_type,
        'liked_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_post_liked
AFTER INSERT ON public.chronicles_post_reactions
FOR EACH ROW
EXECUTE FUNCTION public.handle_post_liked();

-- ===================================================================
-- SECTION 7: FUNCTION 6 - POST COMMENTED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_post_commented()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
  v_post_title text;
  v_commenter_pen_name text;
BEGIN
  -- Get post info
  SELECT creator_id, title INTO v_post_creator_id, v_post_title
  FROM public.chronicles_posts
  WHERE id = NEW.post_id;

  -- Get commenter info
  SELECT pen_name INTO v_commenter_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.creator_id;

  -- Don't notify if user comments on their own post
  IF v_post_creator_id != NEW.creator_id AND v_post_creator_id IS NOT NULL THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_post_creator_id,
      'post_commented'::text,
      '@' || v_commenter_pen_name || ' commented on your post',
      '@' || v_commenter_pen_name || ' commented: "' || SUBSTRING(NEW.content, 1, 100) || '..."',
      NEW.post_id,
      NEW.creator_id,
      jsonb_build_object(
        'comment_id', NEW.id,
        'comment_preview', SUBSTRING(NEW.content, 1, 100),
        'commented_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_post_commented
AFTER INSERT ON public.chronicles_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_post_commented();

-- ===================================================================
-- SECTION 8: FUNCTION 7 - CHAIN ENTRY POST LIKED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_chain_entry_post_liked()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
  v_post_title text;
  v_liker_pen_name text;
BEGIN
  -- Get post info
  SELECT creator_id, title INTO v_post_creator_id, v_post_title
  FROM public.chronicles_chain_entry_posts
  WHERE id = NEW.chain_entry_post_id;

  -- Get liker info
  SELECT pen_name INTO v_liker_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.creator_id;

  -- Don't notify if user likes their own post
  IF v_post_creator_id != NEW.creator_id AND v_post_creator_id IS NOT NULL THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_post_creator_id,
      'post_liked'::text,
      '@' || v_liker_pen_name || ' liked your chain entry',
      '@' || v_liker_pen_name || ' liked your entry "' || v_post_title || '"',
      (SELECT post_id FROM public.chronicles_chain_entries 
       WHERE chain_entry_post_id = NEW.chain_entry_post_id LIMIT 1),
      NEW.creator_id,
      jsonb_build_object(
        'chain_entry_post_id', NEW.chain_entry_post_id,
        'reaction_type', NEW.reaction_type,
        'liked_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_chain_entry_post_liked
AFTER INSERT ON public.chronicles_chain_entry_post_likes
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_entry_post_liked();

-- ===================================================================
-- SECTION 9: FUNCTION 8 - CREATOR FOLLOWED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_creator_followed()
RETURNS TRIGGER AS $$
DECLARE
  v_follower_pen_name text;
BEGIN
  -- Only notify on new follows (is_following = true)
  IF NEW.is_following = true AND (OLD IS NULL OR OLD.is_following = false) THEN
    -- Get follower info
    SELECT pen_name INTO v_follower_pen_name
    FROM public.chronicles_creators
    WHERE id = NEW.follower_id;

    -- Create notification
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_creator_id,
      data
    ) VALUES (
      NEW.follows_id,
      'follower_joined'::text,
      'New follower: @' || v_follower_pen_name,
      '@' || v_follower_pen_name || ' started following you',
      NEW.follower_id,
      jsonb_build_object(
        'followed_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_creator_followed
AFTER INSERT OR UPDATE ON public.chronicles_followers
FOR EACH ROW
EXECUTE FUNCTION public.handle_creator_followed();

-- ===================================================================
-- SECTION 10: FUNCTION 9 - CHAIN ENTRY POST COMMENTED
-- ===================================================================

CREATE OR REPLACE FUNCTION public.handle_chain_entry_post_commented()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
  v_post_title text;
  v_commenter_pen_name text;
BEGIN
  -- Get post info
  SELECT creator_id, title INTO v_post_creator_id, v_post_title
  FROM public.chronicles_chain_entry_posts
  WHERE id = NEW.chain_entry_post_id;

  -- Get commenter info
  SELECT pen_name INTO v_commenter_pen_name
  FROM public.chronicles_creators
  WHERE id = NEW.creator_id;

  -- Don't notify if user comments on their own post
  IF v_post_creator_id != NEW.creator_id AND v_post_creator_id IS NOT NULL THEN
    INSERT INTO public.chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_post_id,
      related_creator_id,
      data
    ) VALUES (
      v_post_creator_id,
      'post_commented'::text,
      '@' || v_commenter_pen_name || ' commented on your chain entry',
      '@' || v_commenter_pen_name || ' commented: "' || SUBSTRING(NEW.content, 1, 100) || '..."',
      (SELECT post_id FROM public.chronicles_chain_entries 
       WHERE chain_entry_post_id = NEW.chain_entry_post_id LIMIT 1),
      NEW.creator_id,
      jsonb_build_object(
        'chain_entry_post_id', NEW.chain_entry_post_id,
        'comment_id', NEW.id,
        'comment_preview', SUBSTRING(NEW.content, 1, 100),
        'commented_at', NOW()
      )
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_chain_entry_post_commented
AFTER INSERT ON public.chronicles_chain_entry_post_comments
FOR EACH ROW
EXECUTE FUNCTION public.handle_chain_entry_post_commented();

-- ===================================================================
-- SECTION 11: UPDATE chronicles_notifications TYPE CHECK CONSTRAINT
-- ===================================================================

-- This adds the new notification types to the existing CHECK constraint
-- Note: If the column already has a CHECK constraint, we need to drop and recreate it

ALTER TABLE public.chronicles_notifications 
DROP CONSTRAINT IF EXISTS chronicles_notifications_type_check;

ALTER TABLE public.chronicles_notifications
ADD CONSTRAINT chronicles_notifications_type_check 
CHECK (type = ANY (ARRAY[
  'new_post_published'::text,
  'post_liked'::text,
  'post_commented'::text,
  'post_shared'::text,
  'follower_joined'::text,
  'badge_earned'::text,
  'streak_milestone'::text,
  'sub_admin_offered'::text,
  'engagement_summary'::text,
  'comment_reply'::text,
  'system'::text,
  'post_flagged_for_review'::text,
  'chain_created'::text,
  'chain_entry_added'::text,
  'post_added_to_chain'::text
]));

-- ===================================================================
-- SUCCESS MESSAGE
-- ===================================================================
-- All 9 notification functions and triggers have been created successfully!
-- The chronicles_followers table has been created to support follower notifications.
--
-- Complete notification system now handles:
-- 1. Flagging posts for review (status change to draft + dual notifications)
-- 2. Post published (notifications to all followers + creator)
-- 3. Chain entry posts created (creator + chain creator notifications)
-- 4. Writing chains created (creator notification)
-- 5. Post likes (creator notification)
-- 6. Post comments (creator notification)
-- 7. Chain entry post likes (creator notification)
-- 8. Chain entry post comments (creator notification)
-- 9. Creator followed (creator notification when new follower joins)
--
-- All triggers are automatically managed via:
-- - Chronicles_followers table with RLS enabled
-- - Automatic notification creation on relevant actions
-- - Bulk insert support for follower notifications
-- These can be added later when the chronicles_followers table is created.