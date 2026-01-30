-- Add image_url column to services table
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Create storage bucket for service images if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop generic policies if they were accidentally created, or specific ones to allow re-running
DROP POLICY IF EXISTS "Public Access Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Update Service Images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete Service Images" ON storage.objects;

-- Create policies with UNIQUE names to avoid "relation already exists" errors
create policy "Public Access Service Images"
  on storage.objects for select
  using ( bucket_id = 'service-images' );

create policy "Authenticated Uploads Service Images"
  on storage.objects for insert
  with check ( bucket_id = 'service-images' and auth.role() = 'authenticated' );

create policy "Authenticated Update Service Images"
  on storage.objects for update
  using ( bucket_id = 'service-images' and auth.role() = 'authenticated' );

create policy "Authenticated Delete Service Images"
  on storage.objects for delete
  using ( bucket_id = 'service-images' and auth.role() = 'authenticated' );
