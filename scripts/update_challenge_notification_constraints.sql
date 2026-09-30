-- Update notification check constraints to include challenge notification types
-- Run this after running add_writing_challenges.sql if you get constraint errors

-- Update chronicles_admin_notifications check constraint (uses notification_type column)
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

-- Update chronicles_notifications check constraint (uses type column)
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
