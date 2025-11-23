-- Run cleanup job periodically (daily)
SELECT cron.schedule('cleanup-old-notifications', '0 2 * * *', 'SELECT cleanup_old_notifications()');

-- Trigger: Auto-mark posts as published when scheduled_for time arrives
-- This would typically be handled by a background job, not a trigger
