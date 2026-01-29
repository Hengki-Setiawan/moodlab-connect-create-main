-- FIX: Mengatasi Error Infinite Recursion pada RLS Profiles

-- 1. Hapus policy yang bermasalah
DROP POLICY IF EXISTS "Admins and owners can view profiles" ON public.profiles;

-- 2. Buat Function Helper 'is_admin()' yang SECURITY DEFINER
-- Function ini akan berjalan dengan hak akses admin (bypass RLS)
-- untuk mengecek apakah user yang sedang login adalah admin.
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

-- 3. Pasang Ulang Policy dengan Function Baru
-- Sekarang policy tidak akan looping cek table sendiri secara langsung
CREATE POLICY "Admins and owners can view profiles_v2"
ON public.profiles FOR SELECT
USING (
  (auth.uid() = id) OR 
  public.is_admin()
);

-- Note: Pastikan user bisa update profile sendiri (optional, untuk jaga-jaga)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);
