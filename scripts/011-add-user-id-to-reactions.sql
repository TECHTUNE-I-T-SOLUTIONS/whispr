-- Migration to add user_id support to reactions table
-- This allows authenticated users to have reactions tracked by user ID instead of IP

-- Make user_ip nullable for authenticated users
ALTER TABLE reactions ALTER COLUMN user_ip DROP NOT NULL;

-- Add user_id column to reactions table
ALTER TABLE reactions ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index for better performance
CREATE INDEX idx_reactions_user_id ON reactions(user_id);

-- Update the unique constraint to include user_id for authenticated users
-- For authenticated users, we want to ensure one reaction type per user per post
-- For anonymous users (IP-based), we keep the existing constraint

-- First, drop the existing unique constraint
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_post_id_user_ip_reaction_type_key;

-- Add a partial unique index for authenticated users (user_id is not null)
CREATE UNIQUE INDEX idx_reactions_unique_authenticated
ON reactions (post_id, user_id, reaction_type)
WHERE user_id IS NOT NULL;

-- Keep the existing IP-based unique constraint for anonymous users
CREATE UNIQUE INDEX idx_reactions_unique_anonymous
ON reactions (post_id, user_ip, reaction_type)
WHERE user_id IS NULL;