-- Add optional benefits array column to products
-- Run this migration in your Supabase project
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS benefits TEXT[];

-- Optional: set default NULL explicitly
ALTER TABLE public.products ALTER COLUMN benefits DROP DEFAULT;

