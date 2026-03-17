-- Migration to fix reactions table for user_id support
-- This handles the case where user_id column might already exist

-- Make user_ip nullable for authenticated users (if not already)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reactions' AND column_name = 'user_ip' AND is_nullable = 'NO'
    ) THEN
        ALTER TABLE reactions ALTER COLUMN user_ip DROP NOT NULL;
    END IF;
END $$;

-- Add user_id column only if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'reactions' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE reactions ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create index for user_id if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE tablename = 'reactions' AND indexname = 'idx_reactions_user_id'
    ) THEN
        CREATE INDEX idx_reactions_user_id ON reactions(user_id);
    END IF;
END $$;

-- Drop existing unique constraint if it exists
ALTER TABLE reactions DROP CONSTRAINT IF EXISTS reactions_post_id_user_ip_reaction_type_key;

-- Drop existing partial indexes if they exist
DROP INDEX IF EXISTS idx_reactions_unique_authenticated;
DROP INDEX IF EXISTS idx_reactions_unique_anonymous;

-- Add partial unique index for authenticated users (user_id is not null)
CREATE UNIQUE INDEX idx_reactions_unique_authenticated
ON reactions (post_id, user_id, reaction_type)
WHERE user_id IS NOT NULL;

-- Keep the existing IP-based unique constraint for anonymous users
CREATE UNIQUE INDEX idx_reactions_unique_anonymous
ON reactions (post_id, user_ip, reaction_type)
WHERE user_id IS NULL;