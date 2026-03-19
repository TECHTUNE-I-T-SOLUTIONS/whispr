-- Migration: Fix Writing Chains Schema
-- Description: Separate writing chain entry posts from regular chronicles posts
-- to prevent writing chain entries from appearing in the main chronicles feed
-- and fix the "record 'new' has no field 'creator_id'" error

-- Step 1: Create new table for writing chain entry posts
CREATE TABLE public.chronicles_chain_entry_posts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chain_id uuid NOT NULL,
  creator_id uuid NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  excerpt text,
  cover_image_url text,
  category text,
  tags text[] DEFAULT ARRAY[]::text[],
  status text DEFAULT 'published'::text CHECK (status = ANY (ARRAY['draft'::text, 'published'::text, 'archived'::text])),
  formatting_data jsonb DEFAULT '{}'::jsonb,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  shares_count integer DEFAULT 0,
  views_count integer DEFAULT 0,
  sequence integer NOT NULL,
  added_by uuid,
  published_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chronicles_chain_entry_posts_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_chain_entry_posts_chain_id_fkey FOREIGN KEY (chain_id) REFERENCES public.chronicles_writing_chains(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_chain_entry_posts_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.chronicles_creators(id),
  CONSTRAINT chronicles_chain_entry_posts_added_by_fkey FOREIGN KEY (added_by) REFERENCES public.chronicles_creators(id)
);

-- Step 2: Create index for better query performance
CREATE INDEX idx_chronicles_chain_entry_posts_chain_id ON public.chronicles_chain_entry_posts(chain_id);
CREATE INDEX idx_chronicles_chain_entry_posts_creator_id ON public.chronicles_chain_entry_posts(creator_id);
CREATE INDEX idx_chronicles_chain_entry_posts_status ON public.chronicles_chain_entry_posts(status);

-- Step 3: Drop the old foreign key constraint from chronicles_chain_entries
ALTER TABLE public.chronicles_chain_entries 
DROP CONSTRAINT IF EXISTS chronicles_chain_entries_post_id_fkey;

-- Step 4: Update chronicles_chain_entries table to reference the new table
-- First, add a new column for the chain entry post ID
ALTER TABLE public.chronicles_chain_entries
ADD COLUMN chain_entry_post_id uuid;

-- Step 5: Create the new foreign key to the chain entry posts table
ALTER TABLE public.chronicles_chain_entries
ADD CONSTRAINT chronicles_chain_entries_chain_entry_post_id_fkey 
FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id) ON DELETE CASCADE;

-- Step 6: Make the old post_id nullable for backward compatibility during migration
ALTER TABLE public.chronicles_chain_entries
ALTER COLUMN post_id DROP NOT NULL;

-- Step 7: Create indexes for chain entries
CREATE INDEX idx_chronicles_chain_entries_chain_id ON public.chronicles_chain_entries(chain_id);
CREATE INDEX idx_chronicles_chain_entries_chain_entry_post_id ON public.chronicles_chain_entries(chain_entry_post_id);

-- Step 8: Add a unique constraint to prevent duplicate sequence numbers in the same chain
ALTER TABLE public.chronicles_chain_entries
ADD CONSTRAINT unique_chain_sequence UNIQUE(chain_id, sequence);

-- Summary of changes:
-- 1. Created chronicles_chain_entry_posts table specifically for writing chain entries
-- 2. Updated chronicles_chain_entries to reference the new table
-- 3. Chain entry posts now have all necessary fields including creator_id
-- 4. Regular chronicles posts remain unaffected in their own table
-- 5. Writing chain entries won't appear in the main chronicles feed anymore
