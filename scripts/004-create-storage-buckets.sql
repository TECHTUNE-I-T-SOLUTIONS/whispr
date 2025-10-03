-- Create storage buckets for media files and avatars
-- Note: These commands should be run in the Supabase SQL Editor

-- Create media bucket for posts (images, videos, audio)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'media',
  'media',
  true,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'audio/mpeg',
    'audio/wav',
    'audio/ogg',
    'application/pdf'
  ]
);

-- Create avatars bucket for profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880, -- 5MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
  ]
);

-- Create RLS policies for media bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'media');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'media');
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'media');
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'media');

-- Create RLS policies for avatars bucket
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Admin Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars');
CREATE POLICY "Admin Update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars');
CREATE POLICY "Admin Delete" ON storage.objects FOR DELETE USING (bucket_id = 'avatars');
