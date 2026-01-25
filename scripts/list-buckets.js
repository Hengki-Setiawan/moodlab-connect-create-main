import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.VITE_SUPABASE_URL;
const service = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!url || !service) {
  console.error('Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(url, service);

async function main() {
  const { data, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', { data, error });
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
