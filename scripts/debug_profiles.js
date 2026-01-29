import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function debugProfiles() {
    console.log("Fetching all profiles (Service Role)...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*');

    if (error) {
        console.error("Error fetching profiles:", error);
        return;
    }

    console.log(`Total profiles found: ${profiles.length}`);
    if (profiles.length > 0) {
        console.log("Sample profiles:");
        profiles.slice(0, 5).forEach(p => {
            console.log(`- ID: ${p.id}, Name: ${p.full_name}, Email: ${p.email}, Admin: ${p.is_admin}`);
        });
    } else {
        console.log("No profiles found.");
    }

    // Also check auth users count
    const { data: { users } } = await supabase.auth.admin.listUsers();
    console.log(`Total auth users: ${users.length}`);
}

debugProfiles();
