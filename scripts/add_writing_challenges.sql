-- Migration: Add Writing Challenges Feature
-- This migration adds tables and triggers for the writing challenge/prompt feature

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create chronicles_writing_prompts table
CREATE TABLE IF NOT EXISTS public.chronicles_writing_prompts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text NOT NULL,
  prompt_type text NOT NULL CHECK (prompt_type = ANY (ARRAY['blog'::text, 'poem'::text, 'story'::text])),
  content text NOT NULL,
  challenge_type text NOT NULL DEFAULT 'daily'::text CHECK (challenge_type = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  is_ai_generated boolean DEFAULT false,
  ai_generation_model text,
  created_by uuid,
  edited_by uuid,
  status text DEFAULT 'draft'::text CHECK (status = ANY (ARRAY['draft'::text, 'active'::text, 'ended'::text, 'archived'::text])),
  starts_at timestamp with time zone,
  ends_at timestamp with time zone,
  submission_deadline timestamp with time zone,
  max_entries_per_user integer DEFAULT 1,
  evaluation_criteria jsonb DEFAULT '{"integrity": 30, "sincerity": 30, "passion": 20, "engagement": 20}'::jsonb,
  tags text[] DEFAULT ARRAY[]::text[],
  featured_image_url text,
  prize_description text,
  published_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_writing_prompts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id),
  CONSTRAINT chronicles_writing_prompts_edited_by_fkey FOREIGN KEY (edited_by) REFERENCES public.admin(id)
);

-- 2. Create chronicles_prompt_entries table
CREATE TABLE IF NOT EXISTS public.chronicles_prompt_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  post_id uuid,
  chain_entry_post_id uuid,
  admin_post_id uuid,
  entry_type text NOT NULL CHECK (entry_type = ANY (ARRAY['chronicles_post'::text, 'chain_entry_post'::text, 'admin_post'::text])),
  status text DEFAULT 'submitted'::text CHECK (status = ANY (ARRAY['submitted'::text, 'under_review'::text, 'approved'::text, 'rejected'::text, 'flagged'::text])),
  is_ai_generated boolean DEFAULT false,
  ai_confidence_score numeric,
  ai_flagged boolean DEFAULT false,
  ai_flag_reason text,
  submitted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  reviewed_at timestamp with time zone,
  reviewed_by uuid,
  review_notes text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_prompt_entries_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.chronicles_writing_prompts(id),
  CONSTRAINT chronicles_prompt_entries_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_prompt_entries_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id),
  CONSTRAINT chronicles_prompt_entries_chain_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id),
  CONSTRAINT chronicles_prompt_entries_admin_post_id_fkey FOREIGN KEY (admin_post_id) REFERENCES public.posts(id),
  CONSTRAINT chronicles_prompt_entries_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.admin(id)
);

-- 3. Create chronicles_prompt_evaluations table
CREATE TABLE IF NOT EXISTS public.chronicles_prompt_evaluations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id uuid NOT NULL,
  evaluated_by uuid NOT NULL,
  integrity_score integer CHECK (integrity_score >= 0 AND integrity_score <= 100),
  sincerity_score integer CHECK (sincerity_score >= 0 AND sincerity_score <= 100),
  passion_score integer CHECK (passion_score >= 0 AND passion_score <= 100),
  engagement_score integer CHECK (engagement_score >= 0 AND engagement_score <= 100),
  total_score integer,
  comments text,
  recommendation text CHECK (recommendation = ANY (ARRAY['winner'::text, 'runner_up'::text, 'honorable_mention'::text, 'not_selected'::text])),
  is_final boolean DEFAULT false,
  evaluated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_prompt_evaluations_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.chronicles_prompt_entries(id),
  CONSTRAINT chronicles_prompt_evaluations_evaluated_by_fkey FOREIGN KEY (evaluated_by) REFERENCES public.admin(id)
);

-- 4. Create chronicles_challenge_winners table
CREATE TABLE IF NOT EXISTS public.chronicles_challenge_winners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_id uuid NOT NULL,
  entry_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  rank integer NOT NULL CHECK (rank >= 1 AND rank <= 3),
  prize_awarded text,
  prize_value numeric,
  badge_awarded text,
  announced_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_challenge_winners_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.chronicles_writing_prompts(id),
  CONSTRAINT chronicles_challenge_winners_entry_id_fkey FOREIGN KEY (entry_id) REFERENCES public.chronicles_prompt_entries(id),
  CONSTRAINT chronicles_challenge_winners_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);

-- 5. Create chronicles_leaderboard_winners table
CREATE TABLE IF NOT EXISTS public.chronicles_leaderboard_winners (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id uuid NOT NULL UNIQUE,
  total_wins integer DEFAULT 0,
  first_place_wins integer DEFAULT 0,
  second_place_wins integer DEFAULT 0,
  third_place_wins integer DEFAULT 0,
  total_points_earned integer DEFAULT 0,
  last_win_at timestamp with time zone,
  best_rank_achievement text,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_leaderboard_winners_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id)
);

-- 6. Create chronicles_prompt_settings table
CREATE TABLE IF NOT EXISTS public.chronicles_prompt_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ai_auto_generation_enabled boolean DEFAULT false,
  ai_generation_frequency text DEFAULT 'daily'::text CHECK (ai_generation_frequency = ANY (ARRAY['daily'::text, 'weekly'::text, 'monthly'::text])),
  ai_generation_schedule_time time without time zone DEFAULT '00:00:00'::time without time zone,
  ai_generation_day_of_week integer,
  ai_generation_day_of_month integer,
  last_ai_generation_at timestamp with time zone,
  next_ai_generation_at timestamp with time zone,
  ai_model_preference text DEFAULT 'gemini-3.8-flash'::text,
  allow_admin_edit_ai_prompts boolean DEFAULT true,
  default_challenge_type text DEFAULT 'daily'::text,
  default_evaluation_criteria jsonb DEFAULT '{"integrity": 30, "sincerity": 30, "passion": 20, "engagement": 20}'::jsonb,
  max_active_challenges integer DEFAULT 3,
  auto_end_challenges boolean DEFAULT true,
  auto_announce_winners boolean DEFAULT true,
  winner_announcement_delay_hours integer DEFAULT 24,
  created_by uuid,
  updated_by uuid,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_prompt_settings_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.admin(id),
  CONSTRAINT chronicles_prompt_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES public.admin(id)
);

-- 7. Add columns to existing tables
ALTER TABLE public.chronicles_posts ADD COLUMN IF NOT EXISTS is_challenge_entry boolean DEFAULT false;
ALTER TABLE public.chronicles_posts ADD COLUMN IF NOT EXISTS prompt_entry_id uuid;
ALTER TABLE public.chronicles_posts ADD CONSTRAINT chronicles_posts_prompt_entry_id_fkey FOREIGN KEY (prompt_entry_id) REFERENCES public.chronicles_prompt_entries(id) ON DELETE SET NULL;

ALTER TABLE public.chronicles_chain_entry_posts ADD COLUMN IF NOT EXISTS is_challenge_entry boolean DEFAULT false;
ALTER TABLE public.chronicles_chain_entry_posts ADD COLUMN IF NOT EXISTS prompt_entry_id uuid;
ALTER TABLE public.chronicles_chain_entry_posts ADD CONSTRAINT chronicles_chain_entry_posts_prompt_entry_id_fkey FOREIGN KEY (prompt_entry_id) REFERENCES public.chronicles_prompt_entries(id) ON DELETE SET NULL;

ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_challenge_entry boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS prompt_entry_id uuid;
ALTER TABLE public.posts ADD CONSTRAINT posts_prompt_entry_id_fkey FOREIGN KEY (prompt_entry_id) REFERENCES public.chronicles_prompt_entries(id) ON DELETE SET NULL;

ALTER TABLE public.chronicles_notifications ADD COLUMN IF NOT EXISTS prompt_id uuid;
ALTER TABLE public.chronicles_notifications ADD CONSTRAINT chronicles_notifications_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.chronicles_writing_prompts(id) ON DELETE SET NULL;

ALTER TABLE public.chronicles_admin_notifications ADD COLUMN IF NOT EXISTS prompt_id uuid;
ALTER TABLE public.chronicles_admin_notifications ADD CONSTRAINT chronicles_admin_notifications_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.chronicles_writing_prompts(id) ON DELETE SET NULL;

-- Add prompt_id to regular notifications and admin notifications tables as well
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS prompt_id uuid;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.chronicles_writing_prompts(id) ON DELETE SET NULL;

-- Add data column to notifications table for consistency with other notification tables
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS data jsonb DEFAULT '{}'::jsonb;

-- Update check constraints to include challenge notification types
ALTER TABLE public.chronicles_admin_notifications
DROP CONSTRAINT IF EXISTS chronicles_admin_notifications_notification_type_check;

ALTER TABLE public.chronicles_admin_notifications
ADD CONSTRAINT chronicles_admin_notifications_notification_type_check
CHECK (notification_type IN (
  'creator_signup',
  'creator_milestone',
  'post_viral',
  'post_reported',
  'post_flagged',
  'comment_flagged',
  'high_engagement',
  'low_quality_post',
  'creator_banned',
  'revenue_milestone',
  'subscriber_milestone',
  'admin_action_needed',
  'system_alert',
  'challenge_created',
  'challenge_ended',
  'challenge_entry_submitted',
  'challenge_ai_generated',
  'challenge_winner_announced'
));

ALTER TABLE public.chronicles_notifications
DROP CONSTRAINT IF EXISTS chronicles_notifications_type_check;

ALTER TABLE public.chronicles_notifications
ADD CONSTRAINT chronicles_notifications_type_check
CHECK (type IN (
  'new_post_published',
  'post_liked',
  'post_commented',
  'post_shared',
  'follower_joined',
  'follower_left',
  'badge_earned',
  'streak_milestone',
  'sub_admin_offered',
  'engagement_summary',
  'comment_reply',
  'system',
  'post_flagged_for_review',
  'chain_created',
  'chain_entry_added',
  'post_added_to_chain',
  'new_challenge_available',
  'challenge_won',
  'challenge_entry_approved',
  'challenge_winner_announced'
));

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chronicles_writing_prompts_status ON public.chronicles_writing_prompts(status);
CREATE INDEX IF NOT EXISTS idx_chronicles_writing_prompts_challenge_type ON public.chronicles_writing_prompts(challenge_type);
CREATE INDEX IF NOT EXISTS idx_chronicles_writing_prompts_starts_at ON public.chronicles_writing_prompts(starts_at);
CREATE INDEX IF NOT EXISTS idx_chronicles_prompt_entries_prompt_id ON public.chronicles_prompt_entries(prompt_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_prompt_entries_creator_id ON public.chronicles_prompt_entries(creator_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_prompt_entries_status ON public.chronicles_prompt_entries(status);
CREATE INDEX IF NOT EXISTS idx_chronicles_prompt_entries_post_id ON public.chronicles_prompt_entries(post_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_challenge_winners_prompt_id ON public.chronicles_challenge_winners(prompt_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_challenge_winners_creator_id ON public.chronicles_challenge_winners(creator_id);
CREATE INDEX IF NOT EXISTS idx_chronicles_leaderboard_winners_total_wins ON public.chronicles_leaderboard_winners(total_wins DESC);

-- 9. Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Add updated_at triggers
DROP TRIGGER IF EXISTS update_chronicles_writing_prompts_updated_at ON public.chronicles_writing_prompts;
CREATE TRIGGER update_chronicles_writing_prompts_updated_at BEFORE UPDATE ON public.chronicles_writing_prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chronicles_prompt_entries_updated_at ON public.chronicles_prompt_entries;
CREATE TRIGGER update_chronicles_prompt_entries_updated_at BEFORE UPDATE ON public.chronicles_prompt_entries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chronicles_prompt_evaluations_updated_at ON public.chronicles_prompt_evaluations;
CREATE TRIGGER update_chronicles_prompt_evaluations_updated_at BEFORE UPDATE ON public.chronicles_prompt_evaluations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chronicles_prompt_settings_updated_at ON public.chronicles_prompt_settings;
CREATE TRIGGER update_chronicles_prompt_settings_updated_at BEFORE UPDATE ON public.chronicles_prompt_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_chronicles_leaderboard_winners_updated_at ON public.chronicles_leaderboard_winners;
CREATE TRIGGER update_chronicles_leaderboard_winners_updated_at BEFORE UPDATE ON public.chronicles_leaderboard_winners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 11. Notification triggers for writing challenges

-- Function to auto-calculate end date based on challenge type
DROP FUNCTION IF EXISTS calculate_challenge_end_date() CASCADE;
CREATE OR REPLACE FUNCTION calculate_challenge_end_date()
RETURNS TRIGGER AS $$
BEGIN
  -- If ends_at is not set but starts_at is set, calculate based on challenge_type
  IF NEW.ends_at IS NULL AND NEW.starts_at IS NOT NULL THEN
    CASE NEW.challenge_type
      WHEN 'daily' THEN
        NEW.ends_at := (NEW.starts_at::date + INTERVAL '1 day')::timestamp with time zone - INTERVAL '1 second';
        NEW.submission_deadline := NEW.ends_at;
      WHEN 'weekly' THEN
        NEW.ends_at := (NEW.starts_at::date + INTERVAL '1 week')::timestamp with time zone - INTERVAL '1 second';
        NEW.submission_deadline := NEW.ends_at;
      WHEN 'monthly' THEN
        NEW.ends_at := (date_trunc('month', NEW.starts_at::date) + INTERVAL '1 month - 1 day')::timestamp with time zone + INTERVAL '23:59:59';
        NEW.submission_deadline := NEW.ends_at;
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_calculate_challenge_end_date ON public.chronicles_writing_prompts;
CREATE TRIGGER trigger_calculate_challenge_end_date
  BEFORE INSERT OR UPDATE ON public.chronicles_writing_prompts
  FOR EACH ROW EXECUTE FUNCTION calculate_challenge_end_date();

-- Trigger: When a new writing prompt is created/activated
DROP FUNCTION IF EXISTS notify_new_challenge() CASCADE;
CREATE OR REPLACE FUNCTION notify_new_challenge()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'active' AND (OLD.status IS NULL OR OLD.status != 'active') THEN
    -- Notify all creators
    INSERT INTO public.chronicles_notifications (creator_id, type, title, message, prompt_id, data)
    SELECT
      id,
      'new_challenge_available',
      'New Writing Challenge Available!',
      'A new ' || NEW.challenge_type || ' writing challenge is now available. Check it out!',
      NEW.id,
      jsonb_build_object(
        'prompt_type', NEW.prompt_type,
        'challenge_type', NEW.challenge_type,
        'title', NEW.title,
        'starts_at', NEW.starts_at,
        'submission_deadline', NEW.submission_deadline
      )
    FROM public.chronicles_creators
    WHERE status = 'active';

    -- Notify admins in chronicles_admin_notifications
    INSERT INTO public.chronicles_admin_notifications (notification_type, title, message, prompt_id, priority, data)
    VALUES (
      'challenge_created',
      'New Challenge Created',
      'A new writing challenge "' || NEW.title || '" has been created and activated.',
      NEW.id,
      'normal',
      jsonb_build_object(
        'prompt_type', NEW.prompt_type,
        'challenge_type', NEW.challenge_type,
        'created_by', NEW.created_by,
        'is_ai_generated', NEW.is_ai_generated
      )
    );

    -- Also notify in regular admin notifications table
    INSERT INTO public.notifications (admin_id, type, title, message, data)
    SELECT
      id,
      'challenge_created',
      'New Challenge Created',
      'A new writing challenge "' || NEW.title || '" has been created and activated.',
      jsonb_build_object(
        'prompt_id', NEW.id::text,
        'prompt_type', NEW.prompt_type,
        'challenge_type', NEW.challenge_type,
        'created_by', NEW.created_by::text,
        'is_ai_generated', NEW.is_ai_generated
      )
    FROM public.admin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_new_challenge ON public.chronicles_writing_prompts;
CREATE TRIGGER trigger_notify_new_challenge
  AFTER INSERT OR UPDATE ON public.chronicles_writing_prompts
  FOR EACH ROW EXECUTE FUNCTION notify_new_challenge();

-- Trigger: When a prompt entry is submitted
DROP FUNCTION IF EXISTS notify_challenge_entry_submitted() CASCADE;
CREATE OR REPLACE FUNCTION notify_challenge_entry_submitted()
RETURNS TRIGGER AS $$
DECLARE
  prompt_info RECORD;
BEGIN
  IF NEW.status = 'submitted' AND (OLD.status IS NULL OR OLD.status != 'submitted') THEN
    SELECT * INTO prompt_info FROM public.chronicles_writing_prompts WHERE id = NEW.prompt_id;

    -- Notify admins in chronicles_admin_notifications
    INSERT INTO public.chronicles_admin_notifications (notification_type, title, message, prompt_id, creator_id, priority, data)
    VALUES (
      'challenge_entry_submitted',
      'New Challenge Entry Submitted',
      'A new entry has been submitted for the challenge "' || prompt_info.title || '"',
      NEW.prompt_id,
      NEW.creator_id,
      'normal',
      jsonb_build_object(
        'entry_id', NEW.id,
        'entry_type', NEW.entry_type,
        'creator_id', NEW.creator_id,
        'is_ai_generated', NEW.is_ai_generated
      )
    );

    -- Also notify in regular admin notifications table
    INSERT INTO public.notifications (admin_id, type, title, message, data)
    SELECT
      id,
      'challenge_entry_submitted',
      'New Challenge Entry Submitted',
      'A new entry has been submitted for the challenge "' || prompt_info.title || '"',
      jsonb_build_object(
        'prompt_id', NEW.prompt_id::text,
        'entry_id', NEW.id::text,
        'entry_type', NEW.entry_type,
        'creator_id', NEW.creator_id::text,
        'is_ai_generated', NEW.is_ai_generated
      )
    FROM public.admin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_challenge_entry_submitted ON public.chronicles_prompt_entries;
CREATE TRIGGER trigger_notify_challenge_entry_submitted
  AFTER INSERT OR UPDATE ON public.chronicles_prompt_entries
  FOR EACH ROW EXECUTE FUNCTION notify_challenge_entry_submitted();

-- Trigger: When a prompt entry is approved
DROP FUNCTION IF EXISTS notify_challenge_entry_approved() CASCADE;
CREATE OR REPLACE FUNCTION notify_challenge_entry_approved()
RETURNS TRIGGER AS $$
DECLARE
  prompt_info RECORD;
  creator_info RECORD;
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    SELECT * INTO prompt_info FROM public.chronicles_writing_prompts WHERE id = NEW.prompt_id;
    SELECT * INTO creator_info FROM public.chronicles_creators WHERE id = NEW.creator_id;
    
    -- Notify the creator
    INSERT INTO public.chronicles_notifications (creator_id, type, title, message, prompt_id, data)
    VALUES (
      NEW.creator_id,
      'challenge_entry_approved',
      'Your Challenge Entry Approved!',
      'Your entry for "' || prompt_info.title || '" has been approved. Great work!',
      NEW.prompt_id,
      jsonb_build_object(
        'entry_id', NEW.id,
        'prompt_title', prompt_info.title
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_challenge_entry_approved ON public.chronicles_prompt_entries;
CREATE TRIGGER trigger_notify_challenge_entry_approved
  AFTER UPDATE ON public.chronicles_prompt_entries
  FOR EACH ROW EXECUTE FUNCTION notify_challenge_entry_approved();

-- Trigger: When a challenge winner is announced
DROP FUNCTION IF EXISTS notify_challenge_winner_announced() CASCADE;
CREATE OR REPLACE FUNCTION notify_challenge_winner_announced()
RETURNS TRIGGER AS $$
DECLARE
  prompt_info RECORD;
BEGIN
  SELECT * INTO prompt_info FROM public.chronicles_writing_prompts WHERE id = NEW.prompt_id;

  -- Notify the winner
  INSERT INTO public.chronicles_notifications (creator_id, type, title, message, prompt_id, data)
  VALUES (
    NEW.creator_id,
    'challenge_won',
    'Congratulations! You Won!',
    'You placed ' || NEW.rank || CASE NEW.rank
      WHEN 1 THEN 'st'
      WHEN 2 THEN 'nd'
      WHEN 3 THEN 'rd'
    END || ' in the challenge "' || prompt_info.title || '"!',
    NEW.prompt_id,
    jsonb_build_object(
      'rank', NEW.rank,
      'prize_awarded', NEW.prize_awarded,
      'badge_awarded', NEW.badge_awarded
    )
  );

  -- Notify all creators about the winner
  INSERT INTO public.chronicles_notifications (creator_id, type, title, message, prompt_id, data)
  SELECT
    id,
    'challenge_winner_announced',
    'Challenge Winner Announced',
    'The winner for "' || prompt_info.title || '" has been announced. Check the leaderboard!',
    NEW.prompt_id,
    jsonb_build_object(
      'winner_id', NEW.creator_id,
      'rank', NEW.rank
    )
  FROM public.chronicles_creators
  WHERE status = 'active' AND id != NEW.creator_id;

  -- Notify admins in chronicles_admin_notifications
  INSERT INTO public.chronicles_admin_notifications (notification_type, title, message, prompt_id, creator_id, priority, data)
  VALUES (
    'challenge_winner_announced',
    'Challenge Winner Announced',
    'The winner for "' || prompt_info.title || '" has been announced.',
    NEW.prompt_id,
    NEW.creator_id,
    'normal',
    jsonb_build_object(
      'rank', NEW.rank,
      'prize_awarded', NEW.prize_awarded
    )
  );

  -- Also notify in regular admin notifications table
  INSERT INTO public.notifications (admin_id, type, title, message, data)
  SELECT
    id,
    'challenge_winner_announced',
    'Challenge Winner Announced',
    'The winner for "' || prompt_info.title || '" has been announced.',
    jsonb_build_object(
      'prompt_id', NEW.prompt_id::text,
      'creator_id', NEW.creator_id::text,
      'rank', NEW.rank,
      'prize_awarded', NEW.prize_awarded
    )
  FROM public.admin;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_challenge_winner_announced ON public.chronicles_challenge_winners;
CREATE TRIGGER trigger_notify_challenge_winner_announced
  AFTER INSERT ON public.chronicles_challenge_winners
  FOR EACH ROW EXECUTE FUNCTION notify_challenge_winner_announced();

-- Trigger: When a challenge ends
DROP FUNCTION IF EXISTS notify_challenge_ended() CASCADE;
CREATE OR REPLACE FUNCTION notify_challenge_ended()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'ended' AND (OLD.status IS NULL OR OLD.status != 'ended') THEN
    -- Notify admins in chronicles_admin_notifications
    INSERT INTO public.chronicles_admin_notifications (notification_type, title, message, prompt_id, priority, data)
    VALUES (
      'challenge_ended',
      'Challenge Ended',
      'The challenge "' || NEW.title || '" has ended. Time to evaluate entries!',
      NEW.id,
      'high',
      jsonb_build_object(
        'ends_at', NEW.ends_at,
        'total_entries', (SELECT COUNT(*) FROM public.chronicles_prompt_entries WHERE prompt_id = NEW.id)
      )
    );

    -- Also notify in regular admin notifications table
    INSERT INTO public.notifications (admin_id, type, title, message, data)
    SELECT
      id,
      'challenge_ended',
      'Challenge Ended',
      'The challenge "' || NEW.title || '" has ended. Time to evaluate entries!',
      jsonb_build_object(
        'prompt_id', NEW.id::text,
        'ends_at', NEW.ends_at,
        'total_entries', (SELECT COUNT(*) FROM public.chronicles_prompt_entries WHERE prompt_id = NEW.id)
      )
    FROM public.admin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: When an AI-generated prompt is created
DROP FUNCTION IF EXISTS notify_ai_prompt_generated() CASCADE;
CREATE OR REPLACE FUNCTION notify_ai_prompt_generated()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_ai_generated = true AND (OLD.is_ai_generated IS NULL OR OLD.is_ai_generated = false) THEN
    -- Notify admins in chronicles_admin_notifications
    INSERT INTO public.chronicles_admin_notifications (notification_type, title, message, prompt_id, priority, data)
    VALUES (
      'challenge_ai_generated',
      'AI Prompt Generated',
      'An AI-generated writing challenge "' || NEW.title || '" has been created.',
      NEW.id,
      'normal',
      jsonb_build_object(
        'prompt_type', NEW.prompt_type,
        'challenge_type', NEW.challenge_type,
        'ai_generation_model', NEW.ai_generation_model
      )
    );

    -- Also notify in regular admin notifications table
    INSERT INTO public.notifications (admin_id, type, title, message, data)
    SELECT
      id,
      'challenge_ai_generated',
      'AI Prompt Generated',
      'An AI-generated writing challenge "' || NEW.title || '" has been created.',
      jsonb_build_object(
        'prompt_id', NEW.id::text,
        'prompt_type', NEW.prompt_type,
        'challenge_type', NEW.challenge_type,
        'ai_generation_model', NEW.ai_generation_model
      )
    FROM public.admin;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_notify_ai_prompt_generated ON public.chronicles_writing_prompts;
CREATE TRIGGER trigger_notify_ai_prompt_generated
  AFTER INSERT OR UPDATE ON public.chronicles_writing_prompts
  FOR EACH ROW EXECUTE FUNCTION notify_ai_prompt_generated();

-- Trigger: Update leaderboard winners when a new winner is added
DROP FUNCTION IF EXISTS update_leaderboard_winners() CASCADE;
CREATE OR REPLACE FUNCTION update_leaderboard_winners()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.chronicles_leaderboard_winners (creator_id, total_wins, first_place_wins, second_place_wins, third_place_wins, last_win_at, best_rank_achievement)
  VALUES (
    NEW.creator_id,
    1,
    CASE WHEN NEW.rank = 1 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rank = 2 THEN 1 ELSE 0 END,
    CASE WHEN NEW.rank = 3 THEN 1 ELSE 0 END,
    NEW.announced_at,
    CASE NEW.rank
      WHEN 1 THEN '1st Place'
      WHEN 2 THEN '2nd Place'
      WHEN 3 THEN '3rd Place'
    END
  )
  ON CONFLICT (creator_id) DO UPDATE SET
    total_wins = chronicles_leaderboard_winners.total_wins + 1,
    first_place_wins = chronicles_leaderboard_winners.first_place_wins + CASE WHEN NEW.rank = 1 THEN 1 ELSE 0 END,
    second_place_wins = chronicles_leaderboard_winners.second_place_wins + CASE WHEN NEW.rank = 2 THEN 1 ELSE 0 END,
    third_place_wins = chronicles_leaderboard_winners.third_place_wins + CASE WHEN NEW.rank = 3 THEN 1 ELSE 0 END,
    last_win_at = NEW.announced_at,
    best_rank_achievement = CASE 
      WHEN NEW.rank = 1 THEN '1st Place'
      WHEN chronicles_leaderboard_winners.best_rank_achievement = '1st Place' THEN '1st Place'
      WHEN NEW.rank = 2 AND chronicles_leaderboard_winners.best_rank_achievement != '1st Place' THEN '2nd Place'
      ELSE chronicles_leaderboard_winners.best_rank_achievement
    END,
    updated_at = CURRENT_TIMESTAMP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_leaderboard_winners ON public.chronicles_challenge_winners;
CREATE TRIGGER trigger_update_leaderboard_winners
  AFTER INSERT ON public.chronicles_challenge_winners
  FOR EACH ROW EXECUTE FUNCTION update_leaderboard_winners();

-- 12. Enable Row Level Security (RLS)
ALTER TABLE public.chronicles_writing_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_prompt_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_prompt_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_challenge_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_leaderboard_winners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chronicles_prompt_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (adjust based on your auth requirements)
-- These are basic policies - you may need to adjust based on your specific requirements

-- Writing prompts policies
DROP POLICY IF EXISTS "Anyone can view active writing prompts" ON public.chronicles_writing_prompts;
CREATE POLICY "Anyone can view active writing prompts" ON public.chronicles_writing_prompts
  FOR SELECT USING (status = 'active');

DROP POLICY IF EXISTS "Admins can manage writing prompts" ON public.chronicles_writing_prompts;
CREATE POLICY "Admins can manage writing prompts" ON public.chronicles_writing_prompts
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

-- Prompt entries policies
DROP POLICY IF EXISTS "Creators can view their own entries" ON public.chronicles_prompt_entries;
CREATE POLICY "Creators can view their own entries" ON public.chronicles_prompt_entries
  FOR SELECT USING (
    creator_id IN (SELECT id FROM public.chronicles_creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can view all entries" ON public.chronicles_prompt_entries;
CREATE POLICY "Admins can view all entries" ON public.chronicles_prompt_entries
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

DROP POLICY IF EXISTS "Creators can create entries" ON public.chronicles_prompt_entries;
CREATE POLICY "Creators can create entries" ON public.chronicles_prompt_entries
  FOR INSERT WITH CHECK (
    creator_id IN (SELECT id FROM public.chronicles_creators WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Admins can update entries" ON public.chronicles_prompt_entries;
CREATE POLICY "Admins can update entries" ON public.chronicles_prompt_entries
  FOR UPDATE USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

-- Prompt evaluations policies
DROP POLICY IF EXISTS "Admins can manage evaluations" ON public.chronicles_prompt_evaluations;
CREATE POLICY "Admins can manage evaluations" ON public.chronicles_prompt_evaluations
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

-- Challenge winners policies
DROP POLICY IF EXISTS "Anyone can view challenge winners" ON public.chronicles_challenge_winners;
CREATE POLICY "Anyone can view challenge winners" ON public.chronicles_challenge_winners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admins can manage winners" ON public.chronicles_challenge_winners;
CREATE POLICY "Admins can manage winners" ON public.chronicles_challenge_winners
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

-- Leaderboard winners policies
DROP POLICY IF EXISTS "Anyone can view leaderboard" ON public.chronicles_leaderboard_winners;
CREATE POLICY "Anyone can view leaderboard" ON public.chronicles_leaderboard_winners
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "System can update leaderboard" ON public.chronicles_leaderboard_winners;
CREATE POLICY "System can update leaderboard" ON public.chronicles_leaderboard_winners
  FOR UPDATE USING (true);

-- Prompt settings policies
DROP POLICY IF EXISTS "Admins can manage prompt settings" ON public.chronicles_prompt_settings;
CREATE POLICY "Admins can manage prompt settings" ON public.chronicles_prompt_settings
  FOR ALL USING (
    auth.uid() IN (SELECT id FROM public.admin)
  );

-- 13. Insert default prompt settings
INSERT INTO public.chronicles_prompt_settings (
  ai_auto_generation_enabled,
  ai_generation_frequency,
  ai_generation_schedule_time,
  ai_model_preference,
  allow_admin_edit_ai_prompts,
  default_challenge_type,
  default_evaluation_criteria,
  max_active_challenges,
  auto_end_challenges,
  auto_announce_winners,
  winner_announcement_delay_hours
)
VALUES (
  false,
  'daily',
  '00:00:00',
  'gemini-3.5-pro',
  true,
  'daily',
  '{"integrity": 30, "sincerity": 30, "passion": 20, "engagement": 20}',
  3,
  true,
  true,
  24
)
ON CONFLICT DO NOTHING;

-- Migration complete
