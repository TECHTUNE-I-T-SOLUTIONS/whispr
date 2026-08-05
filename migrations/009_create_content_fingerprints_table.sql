-- Content Fingerprints Table for Copyright Protection
-- This table stores SHA-256 hashes and version history for all published content
-- to provide proof of originality and ownership

CREATE TABLE IF NOT EXISTS public.content_fingerprints (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  article_id uuid NOT NULL,
  article_type text NOT NULL CHECK (article_type IN ('post', 'chronicles_post', 'chronicles_chain_entry')),
  article_version integer NOT NULL DEFAULT 1,
  sha256_hash text NOT NULL UNIQUE,
  content_length integer NOT NULL,
  published_at timestamp with time zone NOT NULL,
  created_by uuid NOT NULL,
  algorithm text NOT NULL DEFAULT 'sha-256',
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT content_fingerprints_pkey PRIMARY KEY (id),
  CONSTRAINT content_fingerprints_sha256_hash_key UNIQUE (sha256_hash)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_article_id ON public.content_fingerprints(article_id);
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_sha256_hash ON public.content_fingerprints(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_published_at ON public.content_fingerprints(published_at);
CREATE INDEX IF NOT EXISTS idx_content_fingerprints_article_type ON public.content_fingerprints(article_type);

-- Add article_id column to posts table if not exists
ALTER TABLE public.posts 
ADD COLUMN IF NOT EXISTS article_id text UNIQUE;

-- Add article_id column to chronicles_posts table if not exists
ALTER TABLE public.chronicles_posts 
ADD COLUMN IF NOT EXISTS article_id text UNIQUE;

-- Add article_id column to chronicles_chain_entry_posts table if not exists
ALTER TABLE public.chronicles_chain_entry_posts 
ADD COLUMN IF NOT EXISTS article_id text UNIQUE;

-- Function to generate unique article ID (WHP-XXXXXXXX format)
CREATE OR REPLACE FUNCTION generate_article_id()
RETURNS text AS $$
DECLARE
  chars text := '0123456789ABCDEF';
  result text := 'WHP-';
  i integer;
BEGIN
  FOR i IN 1..8 LOOP
    result := result || substr(chars, floor(random() * 16 + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically assign article_id on insert
CREATE OR REPLACE FUNCTION assign_article_id()
RETURNS trigger AS $$
BEGIN
  IF NEW.article_id IS NULL THEN
    NEW.article_id := generate_article_id();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for auto-assigning article IDs
DROP TRIGGER IF EXISTS trigger_assign_article_id_posts ON public.posts;
CREATE TRIGGER trigger_assign_article_id_posts
  BEFORE INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION assign_article_id();

DROP TRIGGER IF EXISTS trigger_assign_article_id_chronicles_posts ON public.chronicles_posts;
CREATE TRIGGER trigger_assign_article_id_chronicles_posts
  BEFORE INSERT ON public.chronicles_posts
  FOR EACH ROW
  EXECUTE FUNCTION assign_article_id();

DROP TRIGGER IF EXISTS trigger_assign_article_id_chain_entries ON public.chronicles_chain_entry_posts;
CREATE TRIGGER trigger_assign_article_id_chain_entries
  BEFORE INSERT ON public.chronicles_chain_entry_posts
  FOR EACH ROW
  EXECUTE FUNCTION assign_article_id();

-- Function to create content fingerprint on publish/update
CREATE OR REPLACE FUNCTION create_content_fingerprint()
RETURNS trigger AS $$
DECLARE
  canonical_content text;
  content_hash text;
  new_version integer;
  article_type_val text;
  is_update boolean;
BEGIN
  -- Only create fingerprint for published content
  IF NEW.status != 'published' THEN
    RETURN NEW;
  END IF;

  -- Check if this is an UPDATE operation
  is_update := (TG_OP = 'UPDATE');

  -- For UPDATE, skip if status didn't change to published and content didn't change
  IF is_update AND OLD.status = 'published' AND NEW.content = OLD.content THEN
    RETURN NEW;
  END IF;

  -- Determine article type based on table
  IF TG_TABLE_NAME = 'posts' THEN
    article_type_val := 'post';
    canonical_content := COALESCE(NEW.title, '') || '|' || 
                        COALESCE(NEW.excerpt, '') || '|' || 
                        COALESCE(NEW.content, '') || '|' || 
                        COALESCE(NEW.admin_id::text, '') || '|' || 
                        COALESCE(NEW.created_at::text, '');
  ELSIF TG_TABLE_NAME = 'chronicles_posts' THEN
    article_type_val := 'chronicles_post';
    canonical_content := COALESCE(NEW.title, '') || '|' || 
                        COALESCE(NEW.excerpt, '') || '|' || 
                        COALESCE(NEW.content, '') || '|' || 
                        COALESCE(NEW.creator_id::text, '') || '|' || 
                        COALESCE(NEW.created_at::text, '');
  ELSIF TG_TABLE_NAME = 'chronicles_chain_entry_posts' THEN
    article_type_val := 'chronicles_chain_entry';
    canonical_content := COALESCE(NEW.title, '') || '|' || 
                        COALESCE(NEW.content, '') || '|' || 
                        COALESCE(NEW.creator_id::text, '') || '|' || 
                        COALESCE(NEW.created_at::text, '');
  ELSE
    RETURN NEW;
  END IF;

  -- Generate SHA-256 hash
  content_hash := encode(digest(canonical_content, 'sha256'), 'hex');

  -- Check if hash already exists (duplicate content detection)
  -- Skip duplicate check for updates where content hasn't changed
  IF NOT is_update OR (is_update AND NEW.content != OLD.content) THEN
    IF EXISTS (SELECT 1 FROM public.content_fingerprints WHERE sha256_hash = content_hash) THEN
      RAISE EXCEPTION 'Duplicate content detected. This content already exists.';
    END IF;
  END IF;

  -- Get next version number
  SELECT COALESCE(MAX(article_version), 0) + 1 INTO new_version
  FROM public.content_fingerprints
  WHERE article_id = NEW.id;

  -- Insert new fingerprint
  INSERT INTO public.content_fingerprints (
    article_id,
    article_type,
    article_version,
    sha256_hash,
    content_length,
    published_at,
    created_by,
    algorithm,
    metadata
  ) VALUES (
    NEW.id,
    article_type_val,
    new_version,
    content_hash,
    length(canonical_content),
    COALESCE(NEW.published_at, CURRENT_TIMESTAMP),
    CASE 
      WHEN TG_TABLE_NAME = 'posts' THEN NEW.admin_id
      WHEN TG_TABLE_NAME = 'chronicles_posts' THEN NEW.creator_id
      WHEN TG_TABLE_NAME = 'chronicles_chain_entry_posts' THEN NEW.creator_id
      ELSE NULL
    END,
    'sha-256',
    jsonb_build_object(
      'title', NEW.title,
      'excerpt', CASE WHEN TG_TABLE_NAME = 'chronicles_posts' THEN NEW.excerpt ELSE NULL END,
      'article_id', NEW.article_id,
      'slug', CASE 
        WHEN TG_TABLE_NAME = 'posts' THEN NEW.slug
        WHEN TG_TABLE_NAME = 'chronicles_posts' THEN NEW.slug
        ELSE NULL
      END
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create separate triggers for INSERT and UPDATE to handle OLD values correctly
-- INSERT triggers
DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_posts ON public.posts;
CREATE TRIGGER trigger_create_fingerprint_insert_posts
  AFTER INSERT ON public.posts
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION create_content_fingerprint();

DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_chronicles_posts ON public.chronicles_posts;
CREATE TRIGGER trigger_create_fingerprint_insert_chronicles_posts
  AFTER INSERT ON public.chronicles_posts
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION create_content_fingerprint();

DROP TRIGGER IF EXISTS trigger_create_fingerprint_insert_chain_entries ON public.chronicles_chain_entry_posts;
CREATE TRIGGER trigger_create_fingerprint_insert_chain_entries
  AFTER INSERT ON public.chronicles_chain_entry_posts
  FOR EACH ROW
  WHEN (NEW.status = 'published')
  EXECUTE FUNCTION create_content_fingerprint();

-- UPDATE triggers
DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_posts ON public.posts;
CREATE TRIGGER trigger_create_fingerprint_update_posts
  AFTER UPDATE ON public.posts
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published' OR NEW.content != OLD.content))
  EXECUTE FUNCTION create_content_fingerprint();

DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_chronicles_posts ON public.chronicles_posts;
CREATE TRIGGER trigger_create_fingerprint_update_chronicles_posts
  AFTER UPDATE ON public.chronicles_posts
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published' OR NEW.content != OLD.content))
  EXECUTE FUNCTION create_content_fingerprint();

DROP TRIGGER IF EXISTS trigger_create_fingerprint_update_chain_entries ON public.chronicles_chain_entry_posts;
CREATE TRIGGER trigger_create_fingerprint_update_chain_entries
  AFTER UPDATE ON public.chronicles_chain_entry_posts
  FOR EACH ROW
  WHEN (NEW.status = 'published' AND (OLD.status IS NULL OR OLD.status != 'published' OR NEW.content != OLD.content))
  EXECUTE FUNCTION create_content_fingerprint();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_content_fingerprints ON public.content_fingerprints;
CREATE TRIGGER trigger_update_content_fingerprints
  BEFORE UPDATE ON public.content_fingerprints
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE public.content_fingerprints ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Allow read access to all users" ON public.content_fingerprints
  FOR SELECT USING (true);

CREATE POLICY "Allow insert to authenticated users" ON public.content_fingerprints
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Allow update to authenticated users" ON public.content_fingerprints
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON public.content_fingerprints TO authenticated;
GRANT SELECT ON public.content_fingerprints TO anon;
