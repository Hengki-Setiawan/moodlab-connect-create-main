-- Migration: Add admin RLS policy for profiles table & add email column
-- This allows admin users (is_admin = true) to view all profiles
-- Also adds email column to profiles table for easier access
-- Date: 2026-01-29

-- First, add email column to profiles if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles' 
        AND column_name = 'email'
    ) THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
        RAISE NOTICE 'Added email column to profiles table';
    END IF;
END $$;

-- Update existing profiles to copy email from auth.users
UPDATE public.profiles p
SET email = (SELECT email FROM auth.users u WHERE u.id = p.id)
WHERE p.email IS NULL;

-- Drop and recreate the trigger function to include email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email;
  RETURN NEW;
END;
$$;

-- Add policy for admins to view all profiles
DO $$
BEGIN
    -- Drop existing policy if it exists (safe to re-run)
    DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
    
    -- Create new policy for admin access
    CREATE POLICY "Admins can view all profiles"
      ON public.profiles FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.is_admin = true
        )
      );
      
    -- Also add policy for admins to update profiles
    DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
    
    CREATE POLICY "Admins can update all profiles"
      ON public.profiles FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM public.profiles p
          WHERE p.id = auth.uid() AND p.is_admin = true
        )
      );
      
    RAISE NOTICE 'Admin RLS policies added successfully';
END $$;
