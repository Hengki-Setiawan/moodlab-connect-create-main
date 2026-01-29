
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Error: Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.");
    process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function verifyStorage() {
    console.log("🔍 Verifying Storage Access...");

    // 1. List Buckets (Admin Role)
    console.log("\n1️⃣  Listing Buckets (Service Role)...");
    const { data: buckets, error: bucketError } = await supabaseAdmin.storage.listBuckets();

    if (bucketError) {
        console.error("❌ Error listing buckets:", bucketError.message);
        return;
    }

    console.log(`✅ Found ${buckets.length} buckets:`, buckets.map(b => b.name).join(", "));

    if (buckets.length === 0) {
        console.warn("⚠️  No buckets found! You need to create a bucket (e.g., 'products', 'images') first.");
        return;
    }

    // 2. List Files in each bucket (Admin Role)
    for (const bucket of buckets) {
        console.log(`\n📂 Checking bucket: '${bucket.name}'`);
        const { data: files, error: fileError } = await supabaseAdmin.storage.from(bucket.name).list();

        if (fileError) {
            console.error(`❌ Error listing files in '${bucket.name}':`, fileError.message);
        } else {
            console.log(`   Found ${files.length} items.`);
            files.forEach(f => {
                // Check if it's a folder (often indicated by no metadata or ID if it's just a prefix object)
                console.log(`   - Name: [${f.name}] | ID: ${f.id} | Metadata:`, f.metadata ? Object.keys(f.metadata) : 'null');
            });
        }
    }
}

verifyStorage();
