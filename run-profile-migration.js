import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Error: VITE_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
    try {
        const sqlPath = path.join(path.dirname(fileURLToPath(import.meta.url)), 'add-profile-fields.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        console.log('Running migration...');

        // Split by semicolon to handle multiple statements if needed, though here it's one
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        // If exec_sql RPC doesn't exist (it's not standard), we might fail here.
        // Alternative: usually migrations are run via CLI or dashboard.
        // Since we don't have direct SQL access via client unless an RPC is set up, 
        // we will try to use the 'postgres' connection if available or just warn the user.

        // However, for this environment, let's assume we might not have the RPC.
        // Let's try a direct query if possible or just print instructions.

        if (error) {
            // Fallback: Try to use a standard query if the user has permissions, 
            // but usually client libraries don't support raw SQL execution without RPC.
            console.error('Migration failed (RPC exec_sql might be missing):', error);
            console.log('\nIMPORTANT: Please run the following SQL in your Supabase SQL Editor:\n');
            console.log(sql);
        } else {
            console.log('Migration executed successfully via RPC!');
        }

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Since we can't easily run SQL from client without specific setup, 
// I'll create a simple "dummy" check to see if I can insert/update to test if columns exist,
// but actually the best way is to ask the user or just try to use them in the app.
// For now, I will just log the SQL for the user to run if the RPC fails.

runMigration();
