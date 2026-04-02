-- Create chronicles_comment_likes table to track comment likes
CREATE TABLE IF NOT EXISTS public.chronicles_comment_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  comment_id uuid NOT NULL,
  user_id uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT chronicles_comment_likes_pkey PRIMARY KEY (id),
  CONSTRAINT chronicles_comment_likes_comment_id_fkey FOREIGN KEY (comment_id) 
    REFERENCES chronicles_comments (id) ON DELETE CASCADE,
  CONSTRAINT chronicles_comment_likes_user_id_fkey FOREIGN KEY (user_id) 
    REFERENCES auth.users (id) ON DELETE CASCADE,
  CONSTRAINT chronicles_comment_likes_unique UNIQUE (comment_id, user_id)
) TABLESPACE pg_default;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_comment_likes_comment_id ON public.chronicles_comment_likes USING btree (comment_id) TABLESPACE pg_default;
CREATE INDEX IF NOT EXISTS idx_comment_likes_user_id ON public.chronicles_comment_likes USING btree (user_id) TABLESPACE pg_default;

-- Add RLS policies if needed
ALTER TABLE public.chronicles_comment_likes ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see all likes
CREATE POLICY "Allow read comment likes" ON public.chronicles_comment_likes
  FOR SELECT USING (true);

-- Policy to allow users to insert their own likes
CREATE POLICY "Allow insert own comment likes" ON public.chronicles_comment_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own likes
CREATE POLICY "Allow delete own comment likes" ON public.chronicles_comment_likes
  FOR DELETE USING (auth.uid() = user_id);
