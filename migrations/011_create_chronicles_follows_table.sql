-- Chronicles Follows Table
-- This table enables creators to follow each other

CREATE TABLE IF NOT EXISTS chronicles_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES chronicles_creators(id) ON DELETE CASCADE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id) -- Prevent self-follows
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chronicles_follows_follower ON chronicles_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_follows_following ON chronicles_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_follows_created ON chronicles_follows(created_at DESC);

-- Enable RLS
ALTER TABLE chronicles_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Allow creators to see who they follow
CREATE POLICY "Creators can view their own follows"
  ON chronicles_follows FOR SELECT
  USING (
    follower_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- Allow creators to see their followers
CREATE POLICY "Creators can view their followers"
  ON chronicles_follows FOR SELECT
  USING (
    following_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- Allow creators to follow others
CREATE POLICY "Creators can follow others"
  ON chronicles_follows FOR INSERT
  WITH CHECK (
    follower_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- Allow creators to unfollow
CREATE POLICY "Creators can unfollow"
  ON chronicles_follows FOR DELETE
  USING (
    follower_id IN (
      SELECT id FROM chronicles_creators WHERE user_id = auth.uid()
    )
  );

-- RPC function to increment followers count
CREATE OR REPLACE FUNCTION increment_followers_count(creator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chronicles_creators
  SET total_followers = COALESCE(total_followers, 0) + 1
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RPC function to decrement followers count
CREATE OR REPLACE FUNCTION decrement_followers_count(creator_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE chronicles_creators
  SET total_followers = GREATEST(COALESCE(total_followers, 0) - 1, 0)
  WHERE id = creator_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions on RPC functions
GRANT EXECUTE ON FUNCTION increment_followers_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_followers_count(UUID) TO authenticated;

-- =====================================================
-- AUTOMATIC FOLLOWER COUNT TRIGGERS
-- =====================================================

-- Trigger: Auto-increment followers count on follow
CREATE OR REPLACE FUNCTION auto_increment_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_creators
  SET total_followers = COALESCE(total_followers, 0) + 1
  WHERE id = NEW.following_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_increment_followers
AFTER INSERT ON chronicles_follows
FOR EACH ROW
EXECUTE FUNCTION auto_increment_followers();

-- Trigger: Auto-decrement followers count on unfollow
CREATE OR REPLACE FUNCTION auto_decrement_followers()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_creators
  SET total_followers = GREATEST(COALESCE(total_followers, 0) - 1, 0)
  WHERE id = OLD.following_id;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_auto_decrement_followers
AFTER DELETE ON chronicles_follows
FOR EACH ROW
EXECUTE FUNCTION auto_decrement_followers();

-- =====================================================
-- NOTIFICATION TRIGGERS FOR FOLLOWER ACTIVITIES
-- =====================================================

-- Trigger: Notify creator when someone follows them
CREATE OR REPLACE FUNCTION notify_on_new_follower()
RETURNS TRIGGER AS $$
DECLARE
  follower_name TEXT;
  following_name TEXT;
  is_mutual BOOLEAN;
BEGIN
  -- Get follower's pen_name
  SELECT pen_name INTO follower_name
  FROM chronicles_creators
  WHERE id = NEW.follower_id;
  
  -- Insert notification for the creator being followed
  INSERT INTO chronicles_notifications (
    creator_id,
    type,
    title,
    message,
    related_creator_id,
    data
  )
  VALUES (
    NEW.following_id,
    'follower_joined',
    'New Follower!',
    follower_name || ' started following you',
    NEW.follower_id,
    jsonb_build_object(
      'follower_id', NEW.follower_id,
      'follower_name', follower_name,
      'followed_at', NEW.created_at
    )
  );
  
  -- Check if this is a mutual follow (creator was already following the new follower)
  SELECT EXISTS(
    SELECT 1 FROM chronicles_follows
    WHERE follower_id = NEW.following_id
    AND following_id = NEW.follower_id
  ) INTO is_mutual;
  
  IF is_mutual THEN
    -- Get the name of the creator being followed
    SELECT pen_name INTO following_name
    FROM chronicles_creators
    WHERE id = NEW.following_id;
    
    -- Notify the follower that they now have a mutual follow
    INSERT INTO chronicles_notifications (
      creator_id,
      type,
      title,
      message,
      related_creator_id,
      data
    )
    VALUES (
      NEW.follower_id,
      'follower_joined',
      'Mutual Follow!',
      following_name || ' follows you back!',
      NEW.following_id,
      jsonb_build_object(
        'following_id', NEW.following_id,
        'following_name', following_name,
        'is_mutual', true
      )
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_new_follower_notification
AFTER INSERT ON chronicles_follows
FOR EACH ROW
EXECUTE FUNCTION notify_on_new_follower();

-- Trigger: Notify when someone unfollows (optional - can be disabled if too noisy)
CREATE OR REPLACE FUNCTION notify_on_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  -- This is optional - uncomment if you want unfollow notifications
  -- INSERT INTO chronicles_notifications (
  --   creator_id,
  --   type,
  --   title,
  --   message,
  --   related_creator_id,
  --   data
  -- )
  -- VALUES (
  --   OLD.following_id,
  --   'follower_left',
  --   'Follower Left',
  --   'Someone stopped following you',
  --   OLD.follower_id,
  --   jsonb_build_object('follower_id', OLD.follower_id, 'unfollowed_at', NOW())
  -- );
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Uncomment this trigger if you want unfollow notifications
-- CREATE TRIGGER trigger_unfollow_notification
-- AFTER DELETE ON chronicles_follows
-- FOR EACH ROW
-- EXECUTE FUNCTION notify_on_unfollow();

-- =====================================================
-- UPDATE CHRONICLES_NOTIFICATIONS TYPE CHECK
-- =====================================================

-- Add new notification types to the check constraint if they don't exist
-- First, we need to drop and recreate the constraint with the new types
DO $$
BEGIN
  -- Check if the constraint exists
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'chronicles_notifications_type_check'
  ) THEN
    -- Drop the existing constraint
    ALTER TABLE chronicles_notifications 
    DROP CONSTRAINT chronicles_notifications_type_check;
    
    -- Recreate with updated types including 'follower_left'
    ALTER TABLE chronicles_notifications 
    ADD CONSTRAINT chronicles_notifications_type_check 
    CHECK (
      type = ANY (
        array[
          'new_post_published'::text,
          'post_liked'::text,
          'post_commented'::text,
          'post_shared'::text,
          'follower_joined'::text,
          'follower_left'::text,
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
        ]
      )
    );
  END IF;
END $$;

-- Add missing columns to chronicles_creators if they don't exist
DO $$
BEGIN
  -- Add location column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name = 'location'
  ) THEN
    ALTER TABLE chronicles_creators ADD COLUMN location TEXT;
  END IF;

  -- Add current_streak column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name = 'current_streak'
  ) THEN
    ALTER TABLE chronicles_creators ADD COLUMN current_streak INT DEFAULT 0;
  END IF;

  -- Add total_points column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name = 'total_points'
  ) THEN
    ALTER TABLE chronicles_creators ADD COLUMN total_points INT DEFAULT 0;
  END IF;

  -- Rename categories to preferred_categories if needed, or add categories
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name = 'categories'
  ) THEN
    ALTER TABLE chronicles_creators ADD COLUMN categories TEXT[] DEFAULT ARRAY[]::TEXT[];
  END IF;

  -- Ensure total_followers exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name = 'total_followers'
  ) THEN
    ALTER TABLE chronicles_creators ADD COLUMN total_followers INT DEFAULT 0;
  END IF;
END $$;
