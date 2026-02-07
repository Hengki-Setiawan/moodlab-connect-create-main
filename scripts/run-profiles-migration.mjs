// Script to run additional RLS migrations using Supabase Management API
import 'dotenv/config';

const PROJECT_REF = 'gowtvvaijekpgozygrzj';
const ACCESS_TOKEN = process.env.SUPABASE_ACCESS_TOKEN || 'sbp_4de198c111a9f302d17b0238cef40612b55a1b87';

const profilesMigration = `
-- Fix profiles RLS policy to use user_roles instead of is_admin flag

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- Admins can view all profiles (using user_roles table)
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Admins can update all profiles (using user_roles table)
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );
`;

async function runMigration() {
    console.log('🚀 Running Profiles RLS Migration...');

    try {
        const response = await fetch(`https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${ACCESS_TOKEN}`
            },
            body: JSON.stringify({ query: profilesMigration })
        });

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Profiles RLS Migration completed!');
            console.log('Result:', JSON.stringify(result, null, 2));
        } else {
            const errorText = await response.text();
            console.log('Status:', response.status);
            console.log('Response:', errorText);
        }
    } catch (error) {
        console.error('Error:', error.message);
    }
}

runMigration();
