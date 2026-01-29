import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function debug() {
    console.log("Attempting to insert dummy order into Supabase...");

    // Need a user ID. Try to sign in or use a dummy one if RLS allows (unlikely).
    // We'll try to sign in with a test account if possible, or just check if we can select.

    // First, check if table exists by selecting
    const { data, error: selectError } = await supabase.from('orders').select('*').limit(1);
    if (selectError) {
        console.error("Select failed (Table might be missing):", selectError);
    } else {
        console.log("Select success. Table exists.");
    }

    // Try insert (might fail due to RLS if not logged in, but error will tell us)
    const { error: insertError } = await supabase.from('orders').insert({
        user_id: 'dummy-user-id',
        total_amount: 1000,
        status: 'pending'
    });

    if (insertError) {
        console.error("Insert failed:", insertError);
    } else {
        console.log("Insert success (unexpected for dummy user)!");
    }
}

debug();
