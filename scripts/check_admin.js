import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function fixAdminAndEmails() {
    console.log("Fetching all users...");
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
        console.error("Error listing users:", error);
        return;
    }

    const targetAdmins = [
        "hengkisetiawan461@gmail.com",
        "hengkishadow@gmail.com"
    ];

    for (const user of users) {
        // 1. Sync Email to Profile
        // Check if profile exists
        const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

        if (profile) {
            const updates = {};
            if (!profile.email && user.email) {
                updates.email = user.email;
                console.log(`Updating email for ${user.email}...`);
            }

            // 2. Promote to Admin if target
            if (targetAdmins.includes(user.email) && !profile.is_admin) {
                updates.is_admin = true;
                console.log(`Promoting ${user.email} to Admin...`);
            }

            if (Object.keys(updates).length > 0) {
                const { error: updateError } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);

                if (updateError) console.error(`Failed to update ${user.email}:`, updateError);
                else console.log(`Updated ${user.email}`);
            }
        }
    }
    console.log("Done!");
}

fixAdminAndEmails();
