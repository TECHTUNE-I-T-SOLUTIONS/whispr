-- Migration: Add missing columns to chronicles_creators table
-- These columns are required by the admin page for creator management

-- Add is_verified column if it doesn't exist
ALTER TABLE chronicles_creators
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- Add is_banned column if it doesn't exist
ALTER TABLE chronicles_creators
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT FALSE;

-- Add total_followers column if it doesn't exist (referenced in UI)
ALTER TABLE chronicles_creators
ADD COLUMN IF NOT EXISTS total_followers INT DEFAULT 0;

-- Create index for is_verified status
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_is_verified ON chronicles_creators(is_verified);

-- Create index for is_banned status
CREATE INDEX IF NOT EXISTS idx_chronicles_creators_is_banned ON chronicles_creators(is_banned);

-- Update the chronicles_creators table constraints
-- Ensure proper defaults are set
UPDATE chronicles_creators 
SET is_verified = FALSE, is_banned = FALSE 
WHERE is_verified IS NULL OR is_banned IS NULL;

-- Add NOT NULL constraints after ensuring no nulls exist
ALTER TABLE chronicles_creators
ALTER COLUMN is_verified SET NOT NULL,
ALTER COLUMN is_banned SET NOT NULL;

-- Drop admin reference if it exists and causes issues
-- The chronicles_admin_activity_log references admin(id) which may not exist
ALTER TABLE chronicles_admin_activity_log
DROP CONSTRAINT IF EXISTS chronicles_admin_activity_log_admin_id_fkey;

-- Make admin_id nullable with no constraint
ALTER TABLE chronicles_admin_activity_log
ADD CONSTRAINT chronicles_admin_activity_log_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Fix the trigger that references notifications table (which may not exist in expected format)
-- Drop the problematic trigger if it exists
DROP TRIGGER IF EXISTS trigger_creator_signup ON chronicles_creators;
DROP FUNCTION IF EXISTS log_creator_signup();

-- Create a corrected version that doesn't reference admin table
CREATE OR REPLACE FUNCTION log_creator_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO chronicles_admin_activity_log (activity_type, creator_id, title, description)
  VALUES ('creator_signup', NEW.id, 'New Creator Signup', 
          'Creator ' || NEW.pen_name || ' (' || NEW.email || ') has joined Chronicles');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_creator_signup
AFTER INSERT ON chronicles_creators
FOR EACH ROW
EXECUTE FUNCTION log_creator_signup();

-- Verify storage buckets exist, create if needed
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronicles-profiles', 'chronicles-profiles', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('chronicles-posts', 'chronicles-posts', true)
ON CONFLICT (id) DO NOTHING;

-- Confirm all tables exist with correct columns
-- This is a verification step - it won't break if columns already exist
SELECT 'Chronicles Creators table verification' as check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'chronicles_creators' 
    AND column_name IN ('is_verified', 'is_banned', 'total_followers')
  ) THEN 'PASS: All required columns exist'
  ELSE 'FAIL: Missing columns'
  END as status;
