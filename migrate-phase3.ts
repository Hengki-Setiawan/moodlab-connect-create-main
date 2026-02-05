
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing Turso credentials");
    process.exit(1);
}

const client = createClient({
    url: url.replace("libsql://", "https://"),
    authToken,
});

async function main() {
    try {
        console.log("Starting Phase 3 Migration...");

        // 1. Create Vouchers table
        await client.execute(`
      CREATE TABLE IF NOT EXISTS vouchers (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        discount_type TEXT NOT NULL,
        amount INTEGER NOT NULL,
        min_spend INTEGER DEFAULT 0,
        max_discount INTEGER,
        expiry_date INTEGER,
        usage_limit INTEGER DEFAULT -1,
        used_count INTEGER DEFAULT 0,
        created_at INTEGER
      );
    `);
        console.log("✅ Table 'vouchers' created.");

        // 2. Add columns to Orders table (if they don't exist)
        try {
            await client.execute("ALTER TABLE orders ADD COLUMN voucher_code TEXT");
            console.log("✅ Column 'voucher_code' added to orders.");
        } catch (e: any) {
            if (e.message.includes("duplicate column")) {
                console.log("ℹ️ Column 'voucher_code' already exists.");
            } else {
                console.error("Error adding voucher_code:", e);
            }
        }

        try {
            await client.execute("ALTER TABLE orders ADD COLUMN discount_amount INTEGER DEFAULT 0");
            console.log("✅ Column 'discount_amount' added to orders.");
        } catch (e: any) {
            if (e.message.includes("duplicate column")) {
                console.log("ℹ️ Column 'discount_amount' already exists.");
            } else {
                console.error("Error adding discount_amount:", e);
            }
        }

        // 3. Ensure Reviews table exists (it was in schema but let's confirm in db)
        await client.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER REFERENCES products(id),
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        reply TEXT,
        created_at INTEGER
      );
    `);
        console.log("✅ Table 'reviews' verified.");

        console.log("Migration Phase 3 Complete!");
    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        client.close();
    }
}

main();
