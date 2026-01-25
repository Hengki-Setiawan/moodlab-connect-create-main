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

console.log('🔧 Completing RPC Migration for Username Login...');

// SQL untuk membuat RPC function
const RPC_SQL = `
-- Create the RPC function for username login
CREATE OR REPLACE FUNCTION public.get_auth_email_by_username(_username text)
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_auth_email_by_username(text) TO anon, authenticated;
`;

async function completeRPCMigration() {
  try {
    console.log('📋 SQL to execute:');
    console.log('─'.repeat(50));
    console.log(RPC_SQL);
    console.log('─'.repeat(50));
    
    console.log('\n🌐 Please run the above SQL in Supabase Dashboard:');
    console.log('🔗 https://supabase.com/dashboard/project/gowtvvaijekpgozygrzj/sql');
    
    console.log('\n📝 Steps:');
    console.log('1. Open the Supabase Dashboard link above');
    console.log('2. Go to SQL Editor');
    console.log('3. Copy and paste the SQL above');
    console.log('4. Click "Run" to execute');
    console.log('5. Come back here and press Enter to verify');
    
    // Wait for user input
    console.log('\n⏳ Press Enter after running the SQL in Dashboard...');
    
    // Simple way to wait for Enter key
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', async (key) => {
      if (key[0] === 13) { // Enter key
        process.stdin.setRawMode(false);
        process.stdin.pause();
        
        console.log('\n🔍 Verifying RPC function...');
        
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
          auth: { autoRefreshToken: false, persistSession: false }
        });
        
        try {
          const { data: rpcTest, error: rpcError } = await supabase.rpc(
            'get_auth_email_by_username', 
            { _username: 'admin' }
          );
          
          if (rpcError) {
            console.log('❌ RPC still not working:', rpcError.message);
            console.log('🔄 Please try running the SQL again in Dashboard');
          } else {
            console.log('✅ RPC function is working!');
            console.log('📧 Test result for "admin":', rpcTest || 'null');
            console.log('\n🎉 USERNAME LOGIN IS NOW FULLY ACTIVE!');
            console.log('🌐 Test at: http://localhost:1111/');
            console.log('📝 You can now login with username instead of email');
          }
        } catch (error) {
          console.log('❌ Verification error:', error.message);
        }
        
        process.exit(0);
      }
    });
    
  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

completeRPCMigration();