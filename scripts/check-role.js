import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // same key used by frontend
const userId = '8d0c210f-b07e-4b36-83cc-df3fdb2de6f7';

if (!url || !anon) {
  console.error('Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, anon);

async function main() {
  const { data, error } = await supabase.rpc('has_role', { _user_id: userId, _role: 'admin' });
  console.log('RPC has_role result:', { data, error });
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
