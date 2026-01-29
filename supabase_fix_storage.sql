-- FIX: Memberikan Akses Full Storage ke Admin

-- 1. Helper: Pastikan function is_admin ada (jika belum dijalankan sebelumnya)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$;

-- 2. Policy untuk Storage Buckets (Admin bisa lihat semua bucket)
-- (Drop dulu jika ada policy lama yang conflict)
DROP POLICY IF EXISTS "Admins can do everything on buckets" ON storage.buckets;

CREATE POLICY "Admins can do everything on buckets"
ON storage.buckets
FOR ALL
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 3. Policy untuk Storage Objects (Admin bisa lihat/upload/hapus semua file)
DROP POLICY IF EXISTS "Admins can do everything on objects" ON storage.objects;

CREATE POLICY "Admins can do everything on objects"
ON storage.objects
FOR ALL
USING ( public.is_admin() )
WITH CHECK ( public.is_admin() );

-- 4. Pastikan Public Access untuk 'read' tetap ada (biasanya untuk gambar produk)
--    Cek bucket 'Gambar' dan 'Produk Digital' (kalau 'Produk Digital' private, jangan di set public)
--    Policy default biasanya 'Give users access to own folder', tapi admin butuh akses semua.

-- (Optional) Policy agar user biasa bisa LIHAT gambar (tapi gak bisa hapus)
DROP POLICY IF EXISTS "Public can view images" ON storage.objects;
CREATE POLICY "Public can view images"
ON storage.objects FOR SELECT
USING ( bucket_id = 'Gambar' ); -- Ganti 'Gambar' sesuai nama bucket ID kamu
