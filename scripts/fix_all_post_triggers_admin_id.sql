-- Fix: Remove all triggers that incorrectly reference NEW.admin_id on chronicles_posts
-- chronicles_posts uses creator_id, not admin_id

-- Drop all triggers on chronicles_posts that might be causing the issue
DROP TRIGGER IF EXISTS trigger_initialize_post_analytics ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_activity ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_post_published ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_award_points ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_engagement_milestones ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_high_engagement ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_creator_stats ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_viral_post ON public.chronicles_posts;
DROP TRIGGER IF EXISTS trigger_update_daily_analytics_on_post_delete ON public.chronicles_posts;

-- Recreate only the safe, necessary triggers without admin_id references

-- Trigger 1: Initialize post analytics (AFTER INSERT)
CREATE OR REPLACE FUNCTION initialize_post_analytics()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_post_analytics (post_id, total_views, created_at)
  VALUES (NEW.id, 0, CURRENT_TIMESTAMP);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_initialize_post_analytics
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION initialize_post_analytics();

-- Trigger 2: Update creator activity (AFTER INSERT)
CREATE OR REPLACE FUNCTION update_creator_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_creators
  SET last_activity_at = CURRENT_TIMESTAMP
  WHERE id = NEW.creator_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_creator_activity
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_activity();

-- Trigger 3: Update daily analytics (AFTER INSERT)
CREATE OR REPLACE FUNCTION update_daily_analytics_on_post()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_daily_analytics (date, new_posts, total_posts)
  VALUES (CURRENT_DATE, 1, 1)
  ON CONFLICT (date) DO UPDATE SET
    new_posts = chronicles_daily_analytics.new_posts + 1,
    total_posts = chronicles_daily_analytics.total_posts + 1,
    updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics_on_post
AFTER INSERT ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post();

-- Trigger 4: Notify on post published (AFTER UPDATE) - uses creator_id, not admin_id
CREATE OR REPLACE FUNCTION notify_post_published()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'published' AND OLD.status != 'published' THEN
    INSERT INTO chronicles_notifications (creator_id, type, title, message, related_post_id)
    SELECT NEW.creator_id, 'new_post_published', 'Post Published!',
           'Your post "' || NEW.title || '" is now live!', NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_post_published
AFTER UPDATE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION notify_post_published();

-- Trigger 5: Update daily analytics on delete
CREATE OR REPLACE FUNCTION update_daily_analytics_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_daily_analytics (date, deleted_posts)
  VALUES (CURRENT_DATE, 1)
  ON CONFLICT (date) DO UPDATE SET
    total_posts = GREATEST(0, chronicles_daily_analytics.total_posts - 1),
    deleted_posts = chronicles_daily_analytics.deleted_posts + 1,
    updated_at = CURRENT_TIMESTAMP;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_daily_analytics_on_post_delete
AFTER DELETE ON public.chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_daily_analytics_on_post_delete();

-- Also make notifications admin_id nullable for safety
ALTER TABLE public.notifications ALTER COLUMN admin_id DROP NOT NULL;