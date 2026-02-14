-- Add base_event_banner column to events table
ALTER TABLE events ADD COLUMN base_event_banner TEXT;

-- Create storage bucket for event banners if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('eventBanner', 'eventBanner', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS for storage (allow public read, authenticated upload)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'eventBanner' );

CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'eventBanner' );

-- Allow authenticated users to update/delete their own uploads (optional, but good for management)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'eventBanner' );

CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'eventBanner' );
