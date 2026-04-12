-- =============================================================================
-- TRIGGERS AND FUNCTIONS FOR AUTOMATIC CREATOR STATS UPDATES
-- =============================================================================
-- These triggers automatically update chronicles_creators stats when:
-- - Posts are created, updated, or deleted
-- - Comments are added or removed
-- - Reactions/engagement occurs
-- - Last activity changes

-- =============================================================================
-- 1. FUNCTION: Update creator stats when posts change
-- =============================================================================
CREATE OR REPLACE FUNCTION update_creator_post_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count published posts
  IF NEW.status = 'published' THEN
    UPDATE chronicles_creators
    SET
      total_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published'
      ),
      total_poems = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published' AND post_type = 'poem'
      ),
      total_blog_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published' AND post_type = 'blog'
      ),
      total_shares = (
        SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published'
      ),
      last_post_date = NEW.published_at,
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.creator_id;
  ELSIF TG_OP = 'DELETE' THEN
    -- If deleting a published post, update stats
    UPDATE chronicles_creators
    SET
      total_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = OLD.creator_id AND status = 'published'
      ),
      total_poems = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = OLD.creator_id AND status = 'published' AND post_type = 'poem'
      ),
      total_blog_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = OLD.creator_id AND status = 'published' AND post_type = 'blog'
      ),
      total_shares = (
        SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts 
        WHERE creator_id = OLD.creator_id AND status = 'published'
      ),
      last_post_date = (
        SELECT MAX(published_at) FROM chronicles_posts 
        WHERE creator_id = OLD.creator_id AND status = 'published'
      ),
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = OLD.creator_id;
  ELSIF TG_OP = 'UPDATE' AND OLD.status != 'published' AND NEW.status = 'published' THEN
    -- If publishing a previously unpublished post
    UPDATE chronicles_creators
    SET
      total_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published'
      ),
      total_poems = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published' AND post_type = 'poem'
      ),
      total_blog_posts = (
        SELECT COUNT(*) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published' AND post_type = 'blog'
      ),
      total_shares = (
        SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts 
        WHERE creator_id = NEW.creator_id AND status = 'published'
      ),
      last_post_date = NEW.published_at,
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.creator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for posts
DROP TRIGGER IF EXISTS trg_update_creator_post_stats ON chronicles_posts;
CREATE TRIGGER trg_update_creator_post_stats
AFTER INSERT OR UPDATE OR DELETE ON chronicles_posts
FOR EACH ROW
EXECUTE FUNCTION update_creator_post_stats();

-- =============================================================================
-- 2. FUNCTION: Update creator engagement when comments are added/removed
-- =============================================================================
CREATE OR REPLACE FUNCTION update_creator_engagement_stats()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
BEGIN
  -- Get the post creator_id
  SELECT creator_id INTO v_post_creator_id FROM chronicles_posts WHERE id = NEW.post_id;
  
  IF TG_OP = 'INSERT' THEN
    -- Update engagement count for post creator
    UPDATE chronicles_creators
    SET
      total_engagement = (
        SELECT COALESCE(SUM(likes_count), 0) +
               COALESCE(SUM(comments_count), 0) +
               COALESCE(SUM(shares_count), 0)
        FROM chronicles_posts
        WHERE creator_id = v_post_creator_id
      ),
      last_activity_at = NOW(),
      updated_at = NOW()
    WHERE id = v_post_creator_id;
    
    -- Update engagement for comment creator (if different)
    IF NEW.creator_id != v_post_creator_id THEN
      UPDATE chronicles_creators
      SET
        last_activity_at = NOW(),
        updated_at = NOW()
      WHERE id = NEW.creator_id;
    END IF;
  ELSIF TG_OP = 'DELETE' THEN
    -- Update engagement count for post creator
    UPDATE chronicles_creators
    SET
      total_engagement = (
        SELECT COALESCE(SUM(likes_count), 0) +
               COALESCE(SUM(comments_count), 0) +
               COALESCE(SUM(shares_count), 0)
        FROM chronicles_posts
        WHERE creator_id = v_post_creator_id
      ),
      updated_at = NOW()
    WHERE id = v_post_creator_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comments
DROP TRIGGER IF EXISTS trg_update_creator_engagement_stats ON chronicles_comments;
CREATE TRIGGER trg_update_creator_engagement_stats
AFTER INSERT OR DELETE ON chronicles_comments
FOR EACH ROW
EXECUTE FUNCTION update_creator_engagement_stats();

-- =============================================================================
-- 3. FUNCTION: Update engagement when posts get reactions/likes
-- =============================================================================
CREATE OR REPLACE FUNCTION update_creator_engagement_on_post_reaction()
RETURNS TRIGGER AS $$
DECLARE
  v_post_creator_id uuid;
BEGIN
  -- Get the post creator_id
  SELECT creator_id INTO v_post_creator_id FROM chronicles_posts WHERE id = NEW.post_id;
  
  -- Update engagement count
  UPDATE chronicles_creators
  SET
    total_engagement = (
      SELECT COALESCE(SUM(likes_count), 0) +
             COALESCE(SUM(comments_count), 0) +
             COALESCE(SUM(shares_count), 0)
      FROM chronicles_posts
      WHERE creator_id = v_post_creator_id
    ),
    updated_at = NOW()
  WHERE id = v_post_creator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post reactions
DROP TRIGGER IF EXISTS trg_update_engagement_on_post_reaction ON chronicles_post_reactions;
CREATE TRIGGER trg_update_engagement_on_post_reaction
AFTER INSERT OR DELETE ON chronicles_post_reactions
FOR EACH ROW
EXECUTE FUNCTION update_creator_engagement_on_post_reaction();

-- =============================================================================
-- 4. FUNCTION: Update total_engagement count (aggregates all metrics)
-- =============================================================================
CREATE OR REPLACE FUNCTION update_creator_total_engagement()
RETURNS TRIGGER AS $$
BEGIN
  -- This function is called whenever shares_count is updated on chronicles_posts
  UPDATE chronicles_creators
  SET
    total_engagement = (
      SELECT COALESCE(SUM(likes_count), 0) +
             COALESCE(SUM(comments_count), 0) +
             COALESCE(SUM(shares_count), 0)
      FROM chronicles_posts
      WHERE creator_id = NEW.creator_id
    ),
    updated_at = NOW()
  WHERE id = NEW.creator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for post updates (when shares_count is incremented)
DROP TRIGGER IF EXISTS trg_update_engagement_on_post_update ON chronicles_posts;
CREATE TRIGGER trg_update_engagement_on_post_update
AFTER UPDATE ON chronicles_posts
FOR EACH ROW
WHEN (OLD.shares_count IS DISTINCT FROM NEW.shares_count)
EXECUTE FUNCTION update_creator_total_engagement();

-- =============================================================================
-- 5. FUNCTION: Update last_activity on any creator engagement
-- =============================================================================
CREATE OR REPLACE FUNCTION update_creator_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chronicles_creators
  SET
    last_activity_at = NOW(),
    updated_at = NOW()
  WHERE id = NEW.creator_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for comment reactions
DROP TRIGGER IF EXISTS trg_update_last_activity_comment_reaction ON chronicles_comment_reactions;
CREATE TRIGGER trg_update_last_activity_comment_reaction
AFTER INSERT OR DELETE ON chronicles_comment_reactions
FOR EACH ROW
EXECUTE FUNCTION update_creator_last_activity();

-- =============================================================================
-- SUCCESS MESSAGE
-- =============================================================================
-- All triggers and functions have been created successfully!
-- Creator stats will now be automatically updated when:
-- - New posts are published or unpublished
-- - Posts are deleted
-- - Comments are added or removed
-- - Posts receive likes/reactions
-- - Posts are shared (via chronicles_post_shares)
-- - Comment reactions occur
-- 
-- Additional Updates:
-- - Leaderboard scores and rankings auto-updated
-- - Creator analytics table updated daily
-- - Platform-wide daily analytics updated

-- =============================================================================
-- 7. FUNCTION: Update leaderboard score when creator stats change
-- =============================================================================
CREATE OR REPLACE FUNCTION update_leaderboard_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update leaderboard entry
  INSERT INTO chronicles_leaderboard (creator_id, score, category, calculation_method, calculated_at, updated_at)
  VALUES (
    NEW.id,
    -- Calculate weighted score based on leaderboard settings
    COALESCE((
      SELECT 
        (COALESCE(NEW.total_posts, 0) * COALESCE(post_weight, 10)) +
        (COALESCE(NEW.total_engagement, 0) * COALESCE(engagement_weight, 2)) +
        (COALESCE(NEW.streak_count, 0) * COALESCE(streak_weight, 5)) +
        (COALESCE(NEW.total_followers, 0) * COALESCE(follow_weight, 1))
      FROM chronicles_leaderboard_settings
      LIMIT 1
    ), NEW.total_posts + NEW.total_engagement),
    'general',
    'weighted',
    NOW(),
    NOW()
  )
  ON CONFLICT (creator_id) DO UPDATE
  SET 
    score = COALESCE((
      SELECT 
        (COALESCE(NEW.total_posts, 0) * COALESCE(post_weight, 10)) +
        (COALESCE(NEW.total_engagement, 0) * COALESCE(engagement_weight, 2)) +
        (COALESCE(NEW.streak_count, 0) * COALESCE(streak_weight, 5)) +
        (COALESCE(NEW.total_followers, 0) * COALESCE(follow_weight, 1))
      FROM chronicles_leaderboard_settings
      LIMIT 1
    ), NEW.total_posts + NEW.total_engagement),
    calculated_at = NOW(),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update leaderboard when creator stats change
DROP TRIGGER IF EXISTS trg_update_leaderboard_on_creator_change ON chronicles_creators;
CREATE TRIGGER trg_update_leaderboard_on_creator_change
AFTER UPDATE ON chronicles_creators
FOR EACH ROW
WHEN (
  OLD.total_posts IS DISTINCT FROM NEW.total_posts OR
  OLD.total_engagement IS DISTINCT FROM NEW.total_engagement OR
  OLD.streak_count IS DISTINCT FROM NEW.streak_count OR
  OLD.total_followers IS DISTINCT FROM NEW.total_followers
)
EXECUTE FUNCTION update_leaderboard_score();

-- =============================================================================
-- 8. FUNCTION: Update daily creator analytics
-- =============================================================================
CREATE OR REPLACE FUNCTION update_daily_creator_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update daily analytics for the creator
  INSERT INTO chronicles_creator_analytics (
    creator_id,
    date,
    posts_created,
    total_followers,
    total_likes,
    total_comments,
    total_shares,
    avg_engagement_rate,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    CURRENT_DATE,
    COALESCE(NEW.total_posts, 0),
    COALESCE(NEW.total_followers, 0),
    (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    CASE 
      WHEN COALESCE(NEW.total_posts, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(NEW.total_engagement, 0)::numeric / COALESCE(NEW.total_posts, 1)) * 100, 2)
    END,
    NOW(),
    NOW()
  )
  ON CONFLICT (creator_id, date) DO UPDATE
  SET
    posts_created = COALESCE(NEW.total_posts, 0),
    total_followers = COALESCE(NEW.total_followers, 0),
    total_likes = (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    total_comments = (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    total_shares = (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE creator_id = NEW.id),
    avg_engagement_rate = CASE 
      WHEN COALESCE(NEW.total_posts, 0) = 0 THEN 0
      ELSE ROUND((COALESCE(NEW.total_engagement, 0)::numeric / COALESCE(NEW.total_posts, 1)) * 100, 2)
    END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update daily analytics when creator stats change
DROP TRIGGER IF EXISTS trg_update_daily_analytics_on_change ON chronicles_creators;
CREATE TRIGGER trg_update_daily_analytics_on_change
AFTER UPDATE ON chronicles_creators
FOR EACH ROW
WHEN (
  OLD.total_posts IS DISTINCT FROM NEW.total_posts OR
  OLD.total_engagement IS DISTINCT FROM NEW.total_engagement OR
  OLD.total_followers IS DISTINCT FROM NEW.total_followers
)
EXECUTE FUNCTION update_daily_creator_analytics();

-- =============================================================================
-- 9. FUNCTION: Update platform-wide daily analytics
-- =============================================================================
CREATE OR REPLACE FUNCTION update_platform_daily_analytics()
RETURNS TRIGGER AS $$
BEGIN
  -- Update or insert platform daily analytics
  INSERT INTO chronicles_daily_analytics (
    date,
    total_creators,
    active_creators,
    total_posts,
    total_likes,
    total_comments,
    total_shares,
    avg_engagement_per_post,
    total_follows
  )
  VALUES (
    CURRENT_DATE,
    (SELECT COUNT(*) FROM chronicles_creators WHERE status = 'active'),
    (SELECT COUNT(*) FROM chronicles_creators WHERE last_activity_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'),
    (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE status = 'published'),
    (SELECT ROUND(COALESCE(AVG(likes_count + comments_count + shares_count), 0), 2) FROM chronicles_posts WHERE status = 'published'),
    (SELECT COUNT(*) FROM chronicles_creator_followers WHERE created_at >= CURRENT_DATE)
  )
  ON CONFLICT (date) DO UPDATE
  SET
    total_creators = (SELECT COUNT(*) FROM chronicles_creators WHERE status = 'active'),
    active_creators = (SELECT COUNT(*) FROM chronicles_creators WHERE last_activity_at >= CURRENT_DATE - INTERVAL '7 days' AND status = 'active'),
    total_posts = (SELECT COUNT(*) FROM chronicles_posts WHERE status = 'published'),
    total_likes = (SELECT COALESCE(SUM(likes_count), 0) FROM chronicles_posts WHERE status = 'published'),
    total_comments = (SELECT COALESCE(SUM(comments_count), 0) FROM chronicles_posts WHERE status = 'published'),
    total_shares = (SELECT COALESCE(SUM(shares_count), 0) FROM chronicles_posts WHERE status = 'published'),
    avg_engagement_per_post = (SELECT ROUND(COALESCE(AVG(likes_count + comments_count + shares_count), 0), 2) FROM chronicles_posts WHERE status = 'published'),
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update platform analytics on each creator change
DROP TRIGGER IF EXISTS trg_update_platform_daily_analytics ON chronicles_creators;
CREATE TRIGGER trg_update_platform_daily_analytics
AFTER UPDATE ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION update_platform_daily_analytics();
