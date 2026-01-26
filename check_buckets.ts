
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function listBuckets() {
    const { data, error } = await supabaseAdmin.storage.listBuckets();
    if (error) {
        console.error('Error listing buckets:', error);
    } else {
        console.log('Buckets:', JSON.stringify(data, null, 2));
    }
}

listBuckets();
