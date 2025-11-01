-- Tambah kolom username pada tabel profiles dan dukung login via username
-- Menambahkan index unik case-insensitive dan RPC untuk mendapatkan email dari username

-- Tambah kolom username (nullable untuk kompatibilitas mundur)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS username TEXT;

-- Pastikan username unik secara case-insensitive
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE indexname = 'profiles_username_lower_unique_idx'
  ) THEN
    CREATE UNIQUE INDEX profiles_username_lower_unique_idx ON public.profiles (LOWER(username));
  END IF;
END $$;

-- Perbarui trigger handle_new_user agar menyimpan username dari raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NULLIF(NEW.raw_user_meta_data->>'username', '')
  );
  RETURN NEW;
END;
$$;

-- RPC: Dapatkan email auth dari username (SECURITY DEFINER, bypass RLS)
CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(_username TEXT)
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT u.email
  FROM public.profiles p
  JOIN auth.users u ON u.id = p.id
  WHERE LOWER(p.username) = LOWER(_username)
  LIMIT 1
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_email_by_username(TEXT) TO anon, authenticated;

