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

console.log('👥 Populating Usernames for Existing Users...');

async function populateUsernames() {
  try {
    console.log('📊 Step 1: Get all auth users...');
    
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('❌ Cannot get auth users:', authError.message);
      return;
    }
    
    console.log(`👤 Found ${authUsers.users.length} auth users`);
    
    console.log('📊 Step 2: Get all profiles...');
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, username, full_name');
    
    if (profilesError) {
      console.log('❌ Cannot get profiles:', profilesError.message);
      return;
    }
    
    console.log(`📋 Found ${profiles.length} profiles`);
    
    console.log('🔄 Step 3: Update usernames...');
    
    let updated = 0;
    
    for (const authUser of authUsers.users) {
      const profile = profiles.find(p => p.id === authUser.id);
      const authUsername = authUser.user_metadata?.username;
      
      if (profile && authUsername && (!profile.username || profile.username === 'null')) {
        console.log(`📝 Updating user ${authUser.email}: "${authUsername}"`);
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update({ username: authUsername })
          .eq('id', authUser.id);
        
        if (updateError) {
          console.log(`❌ Failed to update ${authUser.email}:`, updateError.message);
        } else {
          console.log(`✅ Updated ${authUser.email} -> username: "${authUsername}"`);
          updated++;
        }
      } else if (profile && !authUsername) {
        console.log(`⚠️  User ${authUser.email} has no username in metadata`);
      } else if (profile && profile.username && profile.username !== 'null') {
        console.log(`✅ User ${authUser.email} already has username: "${profile.username}"`);
      }
    }
    
    console.log(`\n🎯 Summary: Updated ${updated} users with usernames`);
    
    console.log('\n📊 Step 4: Final verification...');
    
    const { data: finalProfiles, error: finalError } = await supabase
      .from('profiles')
      .select('id, username, full_name')
      .order('created_at', { ascending: false });
    
    if (finalError) {
      console.log('❌ Final verification failed:', finalError.message);
    } else {
      console.log('📋 Current profiles with usernames:');
      finalProfiles.forEach((profile, index) => {
        const authUser = authUsers.users.find(u => u.id === profile.id);
        console.log(`${index + 1}. ${authUser?.email || 'unknown'} -> username: "${profile.username || 'null'}"`);
      });
    }
    
    console.log('\n🎉 Username population completed!');
    console.log('🌐 Test login at: http://localhost:1111/');
    console.log('📝 Try logging in with username "admin"');
    
  } catch (error) {
    console.error('💥 Population failed:', error.message);
  }
}

populateUsernames();