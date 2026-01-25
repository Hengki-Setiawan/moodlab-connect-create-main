import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🔍 Checking Real Table Structure...');

async function checkTableStructure() {
  try {
    console.log('📊 Method 1: Try selecting all columns from profiles...');
    
    const { data: allProfiles, error: allError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (allError) {
      console.log('❌ Error selecting all:', allError.message);
    } else {
      console.log('✅ All columns selection successful');
      if (allProfiles && allProfiles.length > 0) {
        console.log('📋 Available columns:', Object.keys(allProfiles[0]));
        console.log('📝 Sample data:', allProfiles[0]);
      }
    }
    
    console.log('\n📊 Method 2: Try selecting specific columns...');
    
    // Test individual columns
    const columns = ['id', 'username', 'full_name', 'avatar_url', 'updated_at', 'created_at'];
    
    for (const col of columns) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select(col)
          .limit(1);
        
        if (error) {
          console.log(`❌ Column '${col}': ${error.message}`);
        } else {
          console.log(`✅ Column '${col}': exists`);
        }
      } catch (err) {
        console.log(`💥 Column '${col}': ${err.message}`);
      }
    }
    
    console.log('\n📊 Method 3: Check if profiles table exists...');
    
    try {
      const { data: tableCheck, error: tableError } = await supabase
        .from('profiles')
        .select('count', { count: 'exact' });
      
      if (tableError) {
        console.log('❌ Table check error:', tableError.message);
      } else {
        console.log('✅ Profiles table exists with', tableCheck, 'records');
      }
    } catch (err) {
      console.log('💥 Table check failed:', err.message);
    }
    
    console.log('\n🎯 Conclusion:');
    if (allProfiles && allProfiles.length > 0) {
      const hasUsername = 'username' in allProfiles[0];
      console.log(`- Username column actually exists: ${hasUsername ? '✅' : '❌'}`);
      
      if (!hasUsername) {
        console.log('\n🔧 SOLUTION: Need to add username column first!');
        console.log('📋 Run this SQL in Supabase Dashboard:');
        console.log('');
        console.log('-- Add username column to profiles table');
        console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username text;');
        console.log('');
        console.log('-- Create unique index for username (case insensitive)');
        console.log('CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_idx ON public.profiles (lower(username));');
        console.log('');
        console.log('-- Update trigger to handle username from auth metadata');
        console.log(`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;`);
        console.log('');
        console.log('-- Then create the RPC function');
        console.log(`CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(_username text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.email
  FROM auth.users u
  JOIN public.profiles p ON p.id = u.id
  WHERE lower(p.username) = lower(_username)
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_auth_email_by_username(text) TO anon, authenticated;`);
      }
    }
    
  } catch (error) {
    console.error('💥 Check failed:', error.message);
  }
}

checkTableStructure();