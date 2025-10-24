import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load env from .env
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

// Create admin client using service role (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

// User ID to be granted admin role (from your screenshot)
const USER_ID = '8d0c210f-b07e-4b36-83cc-df3fdb2de6f7';

async function makeAdmin() {
  try {
    console.log('Ensuring admin role exists for user:', USER_ID);

    // Upsert admin role for the given user (idempotent)
    const { data, error } = await supabase
      .from('user_roles')
      .upsert({ user_id: USER_ID, role: 'admin' }, { onConflict: 'user_id,role' })
      .select();

    if (error) {
      console.error('Failed to upsert admin role:', error);
      process.exit(1);
    }

    console.log('Admin role upserted:', data);

    // Verify the role exists
    const { data: check, error: checkError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', USER_ID)
      .eq('role', 'admin')
      .limit(1);

    if (checkError) {
      console.error('Failed to verify admin role:', checkError);
      process.exit(1);
    }

    if (!check || check.length === 0) {
      console.error('Verification failed: admin role row not found');
      process.exit(1);
    }

    console.log('Verified: user has admin role.');
  } catch (err) {
    console.error('Unexpected error:', err);
    process.exit(1);
  }
}

makeAdmin();
