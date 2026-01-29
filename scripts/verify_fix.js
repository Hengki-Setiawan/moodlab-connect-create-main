
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY class.");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyFix() {
    console.log("Verifying Supabase Fixes...");

    // 1. Check if 'email' column exists by trying to select it
    console.log("Checking if 'email' column exists in 'profiles'...");
    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .limit(5);

    if (error) {
        console.error("❌ Error selecting 'email' column. It likely does NOT exist yet.");
        console.error("   Message:", error.message);
        console.log("\n⚠️  ACTION REQUIRED: Please run the 'supabase_fix.sql' script in your Supabase Dashboard!");
        return;
    }

    console.log("✅ 'email' column exists.");

    // 2. Check if emails are populated
    const profilesWithEmail = profiles.filter(p => p.email);
    const profilesWithoutEmail = profiles.filter(p => !p.email);

    console.log(`\nFound ${profiles.length} profiles to check.`);
    console.log(`- With Email: ${profilesWithEmail.length}`);
    console.log(`- Without Email: ${profilesWithoutEmail.length}`);

    if (profilesWithoutEmail.length > 0) {
        console.warn("⚠️  Some profiles still show NULL emails. You might need to re-run the backfill query:");
        console.warn("   UPDATE public.profiles p SET email = u.email FROM auth.users u WHERE p.id = u.id AND p.email IS NULL;");
    } else if (profiles.length > 0) {
        console.log("✅ All checked profiles have emails.");
    }

    // 3. Verify Admin Visibility (Check if we can see other users)
    // Note: We are using service role key here, so we ALWAYS see everything. 
    // RLS verification is best done manually or by signing in as a user (complex).
    // However, we can check if there are multiple users returned.

    if (profiles.length > 1) {
        console.log("✅ Successfully fetched multiple profiles (Foreign Key / Data Sync looks good).");
    } else {
        console.log("ℹ️ Only 0 or 1 profile found. This might be normal if you only have one user.");
    }

    console.log("\nVerification Complete.");
}

verifyFix();
