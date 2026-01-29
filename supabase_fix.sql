-- 1. Tambah kolom email ke tabel profiles (jika belum ada)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. Update data email yang kosong dengan data dari auth.users
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 3. Hapus policy lama (biar fresh)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner" ON public.profiles;

-- 4. Pasang Policy Baru: Admin bisa lihat SEMUA, User biasa cuma lihat PUNYA SENDIRI
CREATE POLICY "Admins and owners can view profiles"
ON public.profiles FOR SELECT
USING (
  (auth.uid() = id) OR 
  (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true))
);

-- 5. Update Trigger: Agar user yang BARU DAFTAR otomatis masuk ke profiles + ada emailnya
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET 
    email = EXCLUDED.email,
    full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name);
  RETURN NEW;
END;
$$;
