CREATE TYPE public.video_status AS ENUM ('pending', 'approved', 'rejected');

ALTER TABLE public.properties
  ADD COLUMN video_url TEXT,
  ADD COLUMN video_status public.video_status NOT NULL DEFAULT 'pending',
  ADD COLUMN locality TEXT,
  ADD COLUMN landmark TEXT,
  ADD COLUMN metro_station TEXT,
  ADD COLUMN it_park TEXT,
  ADD COLUMN college TEXT,
  ADD COLUMN hospital TEXT;

-- Create property_videos bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('property_videos', 'property_videos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS Policies for property_videos

-- Allow public read access to property_videos
CREATE POLICY "Public Access" ON storage.objects
  FOR SELECT USING (bucket_id = 'property_videos');

-- Allow authenticated users to upload to property_videos
CREATE POLICY "Authenticated users can upload videos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'property_videos' AND
    auth.role() = 'authenticated'
  );

-- Allow authenticated users to update their own videos (optional, using owner)
CREATE POLICY "Users can update their own videos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'property_videos' AND
    auth.uid() = owner
  );

-- Allow authenticated users to delete their own videos
CREATE POLICY "Users can delete their own videos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'property_videos' AND
    auth.uid() = owner
  );

