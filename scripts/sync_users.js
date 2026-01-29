import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function syncUsers() {
    console.log("Fetching all users from auth.users...");

    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    console.log(`Found ${users.length} users.`);

    for (const user of users) {
        // Check if profile exists
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', user.id)
            .single();

        if (!profile) {
            console.log(`Creating profile for user: ${user.email} (${user.id})`);

            const { error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
                    created_at: user.created_at,
                    updated_at: user.updated_at
                });

            if (insertError) {
                console.error(`Failed to create profile for ${user.email}:`, insertError);
            } else {
                console.log(`Profile created for ${user.email}`);
            }
        } else {
            // console.log(`Profile exists for ${user.email}`);
        }
    }

    console.log("Sync complete!");
}

syncUsers();
