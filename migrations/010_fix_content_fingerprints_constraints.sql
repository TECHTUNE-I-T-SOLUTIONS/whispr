-- Fix content_fingerprints table constraints to support multiple article types
-- Remove the restrictive foreign key that only references posts table

-- Drop the existing foreign key constraint
ALTER TABLE public.content_fingerprints 
DROP CONSTRAINT IF EXISTS content_fingerprints_article_id_fkey;

-- We rely on application-level validation for referential integrity
-- since the table needs to reference multiple different article tables
-- The article_type field indicates which table the article_id references

COMMENT ON TABLE public.content_fingerprints IS 'Stores content fingerprints for copyright protection across all article types (posts, chronicles_posts, chronicles_chain_entry_posts)';
COMMENT ON COLUMN public.content_fingerprints.article_id IS 'UUID that references the appropriate article table based on article_type';
COMMENT ON COLUMN public.content_fingerprints.article_type IS 'Type of article: post (references posts.id), chronicles_post (references chronicles_posts.id), or chronicles_chain_entry (references chronicles_chain_entry_posts.id)';
