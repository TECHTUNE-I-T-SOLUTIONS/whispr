-- Migration: Create Chronicles Flagged Reviews Table
-- Purpose: Track flagged posts/entries for review and handle status changes
-- Created: 2026-04-13

-- Drop existing table if it exists (for clean recreation)
DROP TABLE IF EXISTS public.chronicles_flagged_reviews CASCADE;

-- Create the flagged reviews table
CREATE TABLE public.chronicles_flagged_reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  
  -- Post/Entry Reference (support both regular posts and chain entry posts)
  post_id uuid,
  chain_entry_post_id uuid,
  
  -- Admin who flagged
  flagged_by uuid NOT NULL,
  
  -- Flag details
  reason text NOT NULL CHECK (reason IN ('inappropriate_content', 'spam', 'copyright_violation', 'misinformation', 'hate_speech', 'explicit_content', 'harassment', 'other')),
  description text,
  
  -- Status tracking
  status text DEFAULT 'pending'::text CHECK (status IN ('pending', 'under_review', 'resolved', 'dismissed')),
  resolution text,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  
  -- Tracking
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  -- Constraints
  CONSTRAINT chronicles_flagged_reviews_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_flagged_reviews_post_id_fkey FOREIGN KEY (post_id) REFERENCES public.chronicles_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_flagged_reviews_chain_entry_post_id_fkey FOREIGN KEY (chain_entry_post_id) REFERENCES public.chronicles_chain_entry_posts(id) ON DELETE CASCADE,
  CONSTRAINT chronicles_flagged_reviews_flagged_by_fkey FOREIGN KEY (flagged_by) REFERENCES auth.users(id),
  CONSTRAINT chronicles_flagged_reviews_resolved_by_fkey FOREIGN KEY (resolved_by) REFERENCES auth.users(id),
  CONSTRAINT chronicles_flagged_reviews_post_xor_chain CHECK (
    (post_id IS NOT NULL AND chain_entry_post_id IS NULL) OR 
    (post_id IS NULL AND chain_entry_post_id IS NOT NULL)
  )
);

-- Create indexes for better query performance
CREATE INDEX idx_chronicles_flagged_reviews_post_id ON public.chronicles_flagged_reviews(post_id);
CREATE INDEX idx_chronicles_flagged_reviews_chain_entry_post_id ON public.chronicles_flagged_reviews(chain_entry_post_id);
CREATE INDEX idx_chronicles_flagged_reviews_flagged_by ON public.chronicles_flagged_reviews(flagged_by);
CREATE INDEX idx_chronicles_flagged_reviews_status ON public.chronicles_flagged_reviews(status);
CREATE INDEX idx_chronicles_flagged_reviews_created_at ON public.chronicles_flagged_reviews(created_at);
