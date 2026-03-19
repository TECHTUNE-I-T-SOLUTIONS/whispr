-- Rollback: Fix Writing Chains Schema
-- Only use if you need to revert the changes

-- Drop indexes
DROP INDEX IF EXISTS idx_chronicles_chain_entry_posts_chain_id;
DROP INDEX IF EXISTS idx_chronicles_chain_entry_posts_creator_id;
DROP INDEX IF EXISTS idx_chronicles_chain_entry_posts_status;
DROP INDEX IF EXISTS idx_chronicles_chain_entries_chain_id;
DROP INDEX IF EXISTS idx_chronicles_chain_entries_chain_entry_post_id;

-- Drop the new constraint
ALTER TABLE public.chronicles_chain_entries
DROP CONSTRAINT IF EXISTS chronicles_chain_entries_chain_entry_post_id_fkey;

-- Drop the new column
ALTER TABLE public.chronicles_chain_entries
DROP COLUMN IF EXISTS chain_entry_post_id;

-- Restore the old foreign key (if post_id data exists)
ALTER TABLE public.chronicles_chain_entries
ALTER COLUMN post_id SET NOT NULL;

ALTER TABLE public.chronicles_chain_entries
ADD CONSTRAINT chronicles_chain_entries_post_id_fkey 
FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id);

-- Drop the new table
DROP TABLE IF EXISTS public.chronicles_chain_entry_posts;

-- Drop unique constraint if it exists
ALTER TABLE public.chronicles_chain_entries
DROP CONSTRAINT IF EXISTS unique_chain_sequence;
