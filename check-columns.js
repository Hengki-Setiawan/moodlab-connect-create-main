import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: Env vars missing');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkColumns() {
    console.log('Checking columns...');
    const { data, error } = await supabase
        .from('profiles')
        .select('address, bio, gender')
        .limit(1);

    if (error) {
        console.error('Error selecting columns:', error.message);
        if (error.message.includes('does not exist')) {
            console.log('CONFIRMED: Columns are missing.');
        }
    } else {
        console.log('Success! Columns exist.');
    }
}

checkColumns();
