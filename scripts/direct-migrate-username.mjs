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

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create admin client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

console.log('🚀 Starting direct username login migration...');

async function runDirectMigration() {
  try {
    console.log('📝 Step 1: Checking current profiles table structure...');
    
    // Check if username column exists
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table access failed:', profilesError.message);
      return;
    }
    
    const hasUsername = profiles.length > 0 && 'username' in profiles[0];
    console.log(`📊 Username column exists: ${hasUsername ? '✅' : '❌'}`);
    
    console.log('📝 Step 2: Testing RPC function...');
    
    // Test RPC function
    const { data: rpcTest, error: rpcError } = await supabase.rpc(
      'get_auth_email_by_username', 
      { _username: 'test' }
    );
    
    const rpcExists = !rpcError || !rpcError.message.includes('Could not find the function');
    console.log(`🔧 RPC function exists: ${rpcExists ? '✅' : '❌'}`);
    
    if (hasUsername && rpcExists) {
      console.log('🎉 Username login is already ACTIVE!');
      console.log('✅ All components are in place:');
      console.log('  - profiles.username column: ✅');
      console.log('  - get_auth_email_by_username RPC: ✅');
      console.log('\n🔥 You can now login with username at: http://localhost:1111/');
      return;
    }
    
    console.log('\n⚠️  Migration needed via Supabase Dashboard SQL Editor');
    console.log('🎯 Please run the following SQL in Supabase Dashboard:');
    console.log('');
    console.log('-- 1) Add username column');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS username TEXT;');
    console.log('');
    console.log('-- 2) Create unique index');
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_ci_unique');
    console.log('  ON public.profiles (lower(username))');
    console.log('  WHERE username IS NOT NULL;');
    console.log('');
    console.log('-- 3) Update trigger function');
    console.log(`CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', null),
    COALESCE(new.raw_user_meta_data->>'phone', null),
    COALESCE(new.raw_user_meta_data->>'username', null)
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = excluded.full_name,
    phone = excluded.phone,
    username = excluded.username;
  RETURN new;
END;
$$;`);
    console.log('');
    console.log('-- 4) Recreate trigger');
    console.log('DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;');
    console.log('CREATE TRIGGER on_auth_user_created');
    console.log('  AFTER INSERT ON auth.users');
    console.log('  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();');
    console.log('');
    console.log('-- 5) Create RPC function');
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
$$;`);
    console.log('');
    console.log('-- 6) Grant permissions');
    console.log('GRANT EXECUTE ON FUNCTION public.get_auth_email_by_username(text) TO anon, authenticated;');
    console.log('');
    console.log('🎯 After running the SQL above, username login will be active!');
    console.log('📍 Supabase Dashboard: https://supabase.com/dashboard/project/gowtvvaijekpgozygrzj/sql');
    
  } catch (error) {
    console.error('💥 Migration check failed:', error.message);
  }
}

runDirectMigration();