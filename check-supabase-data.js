
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Load env manually to ensure we get it from the root
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error('.env file not found at', envPath);
    process.exit(1);
}

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY; // Using publishable key as in client.ts

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY in .env');
    process.exit(1);
}

console.log('Connecting to Supabase:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkData() {
    console.log('\n--- Checking "profiles" table ---');
    const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);

    if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
    } else {
        console.log(`Successfully fetched ${profiles.length} profiles.`);
        if (profiles.length > 0) {
            console.log('Sample profile:', profiles[0]);
        } else {
            console.log('Profiles table is empty.');
        }
    }

    console.log('\n--- Checking "user_roles" table ---');
    const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('*')
        .limit(5);

    if (rolesError) {
        console.error('Error fetching user_roles:', rolesError);
    } else {
        console.log(`Successfully fetched ${roles.length} user_roles.`);
        if (roles.length > 0) {
            console.log('Sample role:', roles[0]);
        } else {
            console.log('User_roles table is empty.');
        }
    }
}

checkData();
