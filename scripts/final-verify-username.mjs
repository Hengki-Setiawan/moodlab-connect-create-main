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

console.log('🔍 Final Username Login Verification...');

async function finalVerification() {
  try {
    console.log('📊 Step 1: Checking profiles table structure...');
    
    // Try to select with username column
    const { data: profilesWithUsername, error: usernameError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .limit(1);
    
    const hasUsernameColumn = !usernameError || !usernameError.message.includes('column "username" does not exist');
    
    console.log(`📋 Username column exists: ${hasUsernameColumn ? '✅' : '❌'}`);
    
    if (hasUsernameColumn && profilesWithUsername) {
      console.log(`📈 Profiles found: ${profilesWithUsername.length}`);
      if (profilesWithUsername.length > 0) {
        console.log('📝 Sample profile:', {
          id: profilesWithUsername[0].id?.substring(0, 8) + '...',
          username: profilesWithUsername[0].username || 'null',
          full_name: profilesWithUsername[0].full_name || 'null'
        });
      }
    }
    
    console.log('🔧 Step 2: Testing RPC function...');
    
    const { data: rpcTest, error: rpcError } = await supabase.rpc(
      'get_auth_email_by_username', 
      { _username: 'admin' }
    );
    
    const rpcExists = !rpcError || !rpcError.message.includes('Could not find the function');
    console.log(`🎯 RPC function exists: ${rpcExists ? '✅' : '❌'}`);
    
    if (rpcError) {
      console.log(`🔍 RPC Error: ${rpcError.message}`);
    }
    
    console.log('👥 Step 3: Checking auth users...');
    
    const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.log('❌ Cannot list users:', usersError.message);
    } else {
      console.log(`👤 Total users: ${users.users.length}`);
      if (users.users.length > 0) {
        const firstUser = users.users[0];
        console.log('📝 First user metadata:', {
          email: firstUser.email,
          username: firstUser.user_metadata?.username || 'not set',
          full_name: firstUser.user_metadata?.full_name || 'not set'
        });
      }
    }
    
    console.log('\n🎯 Status Summary:');
    console.log(`- Profiles table accessible: ${!usernameError ? '✅' : '❌'}`);
    console.log(`- Username column exists: ${hasUsernameColumn ? '✅' : '❌'}`);
    console.log(`- RPC function exists: ${rpcExists ? '✅' : '❌'}`);
    console.log(`- Auth admin access: ${!usersError ? '✅' : '❌'}`);
    
    if (hasUsernameColumn && rpcExists) {
      console.log('\n🎉 USERNAME LOGIN IS FULLY ACTIVE!');
      console.log('🌐 Test now at: http://localhost:1111/');
      console.log('📝 Try logging in with username instead of email');
    } else if (hasUsernameColumn && !rpcExists) {
      console.log('\n⚠️  Username column exists but RPC function missing');
      console.log('📋 Run this SQL in Supabase Dashboard to complete setup:');
      console.log('');
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
      console.log('');
      console.log('🌐 Dashboard: https://supabase.com/dashboard/project/gowtvvaijekpgozygrzj/sql');
    } else {
      console.log('\n❌ Full migration needed');
      console.log('📋 Run the complete SQL from run-username-login.sql in Supabase Dashboard');
      console.log('🌐 Dashboard: https://supabase.com/dashboard/project/gowtvvaijekpgozygrzj/sql');
    }
    
  } catch (error) {
    console.error('💥 Verification failed:', error.message);
  }
}

finalVerification();