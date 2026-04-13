-- Populate Analytics Tables with Existing Content Data
-- This script aggregates real data from existing posts and relationships
-- Run this once to initialize analytics, then triggers/cron jobs will keep it updated

BEGIN;

-- ===== 1. POPULATE POST ANALYTICS =====
-- Create analytics entries for all published posts
INSERT INTO public.chronicles_post_analytics (
  post_id,
  total_views,
  total_likes,
  total_comments,
  total_shares,
  total_reposts,
  engagement_rate,
  first_like_at,
  first_comment_at,
  unique_viewers,
  virality_score,
  created_at,
  updated_at
)
SELECT
  p.id,
  COALESCE(p.views_count, 0) as total_views,
  COALESCE(p.likes_count, 0) as total_likes,
  COALESCE(p.comments_count, 0) as total_comments,
  COALESCE(p.shares_count, 0) as total_shares,
  0 as total_reposts, -- Will be updated via reposts tracking
  CASE 
    WHEN COALESCE(p.views_count, 0) > 0 THEN
      ROUND(((COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0) + COALESCE(p.shares_count, 0))::numeric / p.views_count::numeric * 100), 2)
    ELSE 0
  END as engagement_rate,
  (SELECT MIN(created_at) FROM public.chronicles_post_reactions WHERE post_id = p.id AND reaction_type = 'like') as first_like_at,
  (SELECT MIN(created_at) FROM public.chronicles_comments WHERE post_id = p.id) as first_comment_at,
  COALESCE(p.views_count, 0) as unique_viewers, -- Conservative estimate; views_count as base
  CASE 
    WHEN COALESCE(p.views_count, 0) > 100 AND COALESCE(p.likes_count, 0) > 50 THEN
      ROUND(((COALESCE(p.shares_count, 0) + COALESCE(p.likes_count, 0))::numeric / p.views_count::numeric), 3)
    ELSE 0
  END as virality_score,
  NOW() as created_at,
  NOW() as updated_at
FROM public.chronicles_posts p
WHERE p.status = 'published'
  AND p.published_at IS NOT NULL
ON CONFLICT (post_id) DO UPDATE SET
  total_views = EXCLUDED.total_views,
  total_likes = EXCLUDED.total_likes,
  total_comments = EXCLUDED.total_comments,
  total_shares = EXCLUDED.total_shares,
  engagement_rate = EXCLUDED.engagement_rate,
  unique_viewers = EXCLUDED.unique_viewers,
  virality_score = EXCLUDED.virality_score,
  updated_at = NOW();

-- ===== 2. POPULATE CREATOR ANALYTICS =====
-- Create daily analytics snapshot for each creator
INSERT INTO public.chronicles_creator_analytics (
  creator_id,
  date,
  posts_created,
  total_views,
  total_likes,
  total_comments,
  total_shares,
  total_reposts,
  avg_engagement_rate,
  new_followers,
  total_followers,
  follow_growth_rate,
  earnings,
  ad_impressions,
  ad_clicks,
  created_at,
  updated_at
)
SELECT
  c.id as creator_id,
  CURRENT_DATE as date,
  COALESCE(COUNT(DISTINCT p.id) FILTER (WHERE p.status = 'published'), 0) as posts_created,
  COALESCE(SUM(p.views_count), 0) as total_views,
  COALESCE(SUM(p.likes_count), 0) as total_likes,
  COALESCE(SUM(p.comments_count), 0) as total_comments,
  COALESCE(SUM(p.shares_count), 0) as total_shares,
  0 as total_reposts,
  ROUND(
    CASE 
      WHEN COALESCE(SUM(p.views_count), 0) > 0 THEN
        (COALESCE(SUM(p.likes_count + p.comments_count + p.shares_count), 0)::numeric / COALESCE(SUM(p.views_count), 0)::numeric * 100)
      ELSE 0
    END, 2
  ) as avg_engagement_rate,
  0 as new_followers,
  COALESCE(c.total_followers, 0) as total_followers,
  0 as follow_growth_rate,
  0 as earnings,
  0 as ad_impressions,
  0 as ad_clicks,
  NOW() as created_at,
  NOW() as updated_at
FROM public.chronicles_creators c
LEFT JOIN public.chronicles_posts p ON c.id = p.creator_id
WHERE c.status = 'active'
GROUP BY c.id, CURRENT_DATE
ON CONFLICT (creator_id) DO UPDATE SET
  posts_created = EXCLUDED.posts_created,
  total_views = EXCLUDED.total_views,
  total_likes = EXCLUDED.total_likes,
  total_comments = EXCLUDED.total_comments,
  total_shares = EXCLUDED.total_shares,
  avg_engagement_rate = EXCLUDED.avg_engagement_rate,
  total_followers = EXCLUDED.total_followers,
  updated_at = NOW();

-- ===== 3. POPULATE DAILY ANALYTICS =====
-- Create overall platform daily analytics
INSERT INTO public.chronicles_daily_analytics (
  date,
  total_creators,
  new_creators,
  active_creators,
  total_posts,
  new_posts,
  total_likes,
  total_comments,
  total_shares,
  total_reactions,
  total_follows,
  avg_engagement_per_post,
  total_ad_revenue,
  created_at,
  updated_at
)
SELECT
  CURRENT_DATE as date,
  COALESCE(COUNT(DISTINCT c.id), 0) as total_creators,
  COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE DATE(c.created_at) = CURRENT_DATE), 0) as new_creators,
  COALESCE(COUNT(DISTINCT c.id) FILTER (WHERE c.status = 'active'), 0) as active_creators,
  COALESCE(COUNT(DISTINCT p.id), 0) as total_posts,
  COALESCE(COUNT(DISTINCT p.id) FILTER (WHERE DATE(p.published_at) = CURRENT_DATE), 0) as new_posts,
  COALESCE(SUM(p.likes_count), 0) as total_likes,
  COALESCE(SUM(p.comments_count), 0) as total_comments,
  COALESCE(SUM(p.shares_count), 0) as total_shares,
  COALESCE(COUNT(DISTINCT pr.id), 0) as total_reactions,
  COALESCE(COUNT(DISTINCT f.id), 0) as total_follows,
  ROUND(
    CASE 
      WHEN COALESCE(COUNT(DISTINCT p.id), 0) > 0 THEN
        (COALESCE(SUM(p.likes_count + p.comments_count + p.shares_count), 0)::numeric / COUNT(DISTINCT p.id)::numeric)
      ELSE 0
    END, 2
  ) as avg_engagement_per_post,
  0 as total_ad_revenue,
  NOW() as created_at,
  NOW() as updated_at
FROM public.chronicles_creators c
LEFT JOIN public.chronicles_posts p ON c.id = p.creator_id AND p.status = 'published'
LEFT JOIN public.chronicles_post_reactions pr ON p.id = pr.post_id
LEFT JOIN public.chronicles_followers f ON f.follows_id = c.id
WHERE c.status = 'active'
ON CONFLICT (date) DO UPDATE SET
  total_creators = EXCLUDED.total_creators,
  new_creators = EXCLUDED.new_creators,
  active_creators = EXCLUDED.active_creators,
  total_posts = EXCLUDED.total_posts,
  new_posts = EXCLUDED.new_posts,
  total_likes = EXCLUDED.total_likes,
  total_comments = EXCLUDED.total_comments,
  total_shares = EXCLUDED.total_shares,
  total_reactions = EXCLUDED.total_reactions,
  total_follows = EXCLUDED.total_follows,
  avg_engagement_per_post = EXCLUDED.avg_engagement_per_post,
  updated_at = NOW();

-- ===== 4. POPULATE ENGAGEMENT REPORT DATA (for existing reports) =====
-- Link engagement data to any existing generated reports
INSERT INTO public.chronicles_engagement_report_data (
  report_id,
  report_date,
  likes,
  comments,
  shares,
  reposts,
  follows,
  engagement_score,
  created_at
)
SELECT
  gr.id as report_id,
  CURRENT_DATE as report_date,
  COALESCE(SUM(p.likes_count), 0) as likes,
  COALESCE(SUM(p.comments_count), 0) as comments,
  COALESCE(SUM(p.shares_count), 0) as shares,
  0 as reposts,
  0 as follows,
  ROUND(
    (COALESCE(SUM(p.likes_count + p.comments_count + p.shares_count), 0)::numeric / 
     NULLIF(COALESCE(SUM(p.views_count), 0), 0)::numeric * 100), 2
  ) as engagement_score,
  NOW() as created_at
FROM public.chronicles_generated_reports gr
LEFT JOIN public.chronicles_posts p ON gr.creator_id = p.creator_id 
  AND p.published_at >= gr.period_start AND p.published_at <= gr.period_end
WHERE gr.status = 'generated'
GROUP BY gr.id
ON CONFLICT DO NOTHING;

-- ===== 5. POPULATE CREATOR REPORT DATA (for existing reports) =====
-- Link creator metrics to existing generated reports
INSERT INTO public.chronicles_creator_report_data (
  report_id,
  creator_id,
  follower_growth,
  engagement_growth,
  post_frequency,
  avg_engagement_per_post,
  total_engagement,
  total_views,
  created_at
)
SELECT
  gr.id as report_id,
  c.id as creator_id,
  0 as follower_growth,
  0 as engagement_growth,
  COALESCE(COUNT(DISTINCT p.id), 0)::integer as post_frequency,
  ROUND(
    CASE 
      WHEN COALESCE(COUNT(DISTINCT p.id), 0) > 0 THEN
        (COALESCE(SUM(p.likes_count + p.comments_count + p.shares_count), 0)::numeric / COUNT(DISTINCT p.id)::numeric)
      ELSE 0
    END, 2
  ) as avg_engagement_per_post,
  COALESCE(SUM(p.likes_count + p.comments_count + p.shares_count), 0) as total_engagement,
  COALESCE(SUM(p.views_count), 0) as total_views,
  NOW() as created_at
FROM public.chronicles_generated_reports gr
LEFT JOIN public.chronicles_creators c ON gr.creator_id = c.id
LEFT JOIN public.chronicles_posts p ON c.id = p.creator_id 
  AND p.published_at >= gr.period_start AND p.published_at <= gr.period_end
WHERE gr.status = 'generated'
GROUP BY gr.id, c.id
ON CONFLICT DO NOTHING;

-- ===== 6. POPULATE CONTENT REPORT DATA (for existing reports) =====
-- Link content metrics to existing generated reports
INSERT INTO public.chronicles_content_report_data (
  report_id,
  post_id,
  creator_id,
  views,
  likes,
  comments,
  shares,
  engagement_rate,
  category,
  post_type,
  publish_date,
  created_at
)
SELECT
  gr.id as report_id,
  p.id as post_id,
  p.creator_id,
  COALESCE(p.views_count, 0) as views,
  COALESCE(p.likes_count, 0) as likes,
  COALESCE(p.comments_count, 0) as comments,
  COALESCE(p.shares_count, 0) as shares,
  ROUND(
    CASE 
      WHEN COALESCE(p.views_count, 0) > 0 THEN
        ((COALESCE(p.likes_count, 0) + COALESCE(p.comments_count, 0) + COALESCE(p.shares_count, 0))::numeric / p.views_count::numeric * 100)
      ELSE 0
    END, 2
  ) as engagement_rate,
  p.category,
  p.post_type,
  DATE(p.published_at) as publish_date,
  NOW() as created_at
FROM public.chronicles_generated_reports gr
LEFT JOIN public.chronicles_posts p ON gr.creator_id = p.creator_id 
  AND p.published_at >= gr.period_start AND p.published_at <= gr.period_end
  AND p.status = 'published'
WHERE gr.status = 'generated'
ON CONFLICT DO NOTHING;

-- ===== 7. POPULATE AD ANALYTICS (for existing ad placements) =====
-- Create analytics for ad impressions/clicks
INSERT INTO public.chronicles_ad_analytics (
  placement_id,
  creator_id,
  impressions,
  clicks,
  revenue,
  recorded_date,
  created_at
)
SELECT
  cap.id as placement_id,
  c.id as creator_id,
  0 as impressions,
  0 as clicks,
  0 as revenue,
  CURRENT_DATE as recorded_date,
  NOW() as created_at
FROM public.chronicles_ad_placements cap
CROSS JOIN public.chronicles_creators c
WHERE cap.enabled = true AND c.status = 'active'
ON CONFLICT DO NOTHING;

-- ===== 8. POPULATE AUDIENCE DEMOGRAPHICS (for active creators) =====
-- Initialize demographic data for creators
INSERT INTO public.chronicles_audience_demographics (
  creator_id,
  age_13_17,
  age_18_24,
  age_25_34,
  age_35_44,
  age_45_54,
  age_55_plus,
  gender_male,
  gender_female,
  gender_other,
  device_mobile,
  device_desktop,
  device_tablet,
  updated_at
)
SELECT
  c.id as creator_id,
  0, 0, 0, 0, 0, 0,
  0, 0, 0,
  0, 0, 0,
  NOW() as updated_at
FROM public.chronicles_creators c
WHERE c.status = 'active'
ON CONFLICT (creator_id) DO UPDATE SET
  updated_at = NOW();

COMMIT;

-- ===== NOTES =====
-- This script populates analytics tables with real data aggregated from existing posts and relationships.
-- 
-- To keep analytics updated automatically:
-- 1. Run this script once to initialize
-- 2. Consider creating triggers on:
--    - chronicles_posts: update post_analytics when views/likes/comments/shares change
--    - chronicles_post_reactions: update post_analytics when reactions are added
--    - chronicles_comments: update post_analytics comments_count
--    - chronicles_followers: update creator_analytics follower counts
--
-- 3. Create a scheduled job (via pg_cron or application cron) to run daily:
--    - Refresh chronicles_creator_analytics for the previous day
--    - Refresh chronicles_daily_analytics for the previous day
--
-- Example scheduled job (add to Supabase cron):
--    SELECT cron.schedule('refresh-daily-analytics', '0 1 * * *', 'SELECT refresh_daily_analytics()');
