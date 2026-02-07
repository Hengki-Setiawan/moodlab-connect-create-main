-- Migration: Add RLS policies for user_roles table to allow admin management
-- Fix: "new row violates row-level security policy for table 'user_roles'"

-- Drop existing policies if any (to avoid conflicts)
DROP POLICY IF EXISTS "Admin can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can insert roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can update roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admin can delete roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view their own role" ON public.user_roles;

-- Policy: Everyone authenticated can view all roles (needed for admin checks)
CREATE POLICY "Anyone authenticated can view roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (true);

-- Policy: Admin can insert new roles
CREATE POLICY "Admin can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Admin can update any role
CREATE POLICY "Admin can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Admin can delete roles (except their own admin role for safety)
CREATE POLICY "Admin can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid()
        AND role = 'admin'
    )
    -- Prevent admin from deleting their own admin role
    AND NOT (user_id = auth.uid() AND role = 'admin')
);
