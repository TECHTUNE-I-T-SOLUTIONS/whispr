-- 🔹 MEDIA TABLE TO TRACK FILES
CREATE TABLE IF NOT EXISTS media (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  original_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  bucket_name TEXT NOT NULL DEFAULT 'media',
  uploaded_by UUID REFERENCES admin (id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 🔹 INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_media_uploaded_by ON media(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_media_file_type ON media(file_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at ON media(created_at);

-- 🔹 TRIGGER TO AUTO-UPDATE `updated_at`
CREATE OR REPLACE FUNCTION update_media_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_media_updated_at
BEFORE UPDATE ON media
FOR EACH ROW
EXECUTE FUNCTION update_media_updated_at();

-- 🔹 CREATE STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
-- Media bucket (50MB limit)
(
  'media',
  'media',
  TRUE,
  52428800, -- 50MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
    'video/mp4', 'video/webm', 'video/quicktime',
    'audio/mpeg', 'audio/wav', 'audio/ogg',
    'application/pdf'
  ]
),
-- Avatars bucket (5MB limit)
(
  'avatars',
  'avatars',
  TRUE,
  5242880, -- 5MB
  ARRAY[
    'image/jpeg', 'image/png', 'image/gif', 'image/webp'
  ]
);

-- 🔹 DISABLE RLS COMPLETELY FOR PUBLIC ACCESS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 🔹 OPTIONAL: If RLS must remain enabled, allow full access manually:
-- (Uncomment below ONLY if RLS is required later)
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow All Read" ON storage.objects FOR SELECT USING (true);
-- CREATE POLICY "Allow All Insert" ON storage.objects FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Allow All Update" ON storage.objects FOR UPDATE USING (true);
-- CREATE POLICY "Allow All Delete" ON storage.objects FOR DELETE USING (true);
