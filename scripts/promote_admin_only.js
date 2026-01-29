import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing credentials");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function promoteAdminOnly() {
    console.log("Fetching users to promote...");
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
        if (targetAdmins.includes(user.email)) {
            console.log(`Promoting ${user.email} to Admin (is_admin = true)...`);

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ is_admin: true })
                .eq('id', user.id);

            if (updateError) {
                console.error(`Failed to promote ${user.email}:`, updateError);
            } else {
                console.log(`Successfully promoted ${user.email}`);
            }
        }
    }
    console.log("Promotion complete.");
}

promoteAdminOnly();
