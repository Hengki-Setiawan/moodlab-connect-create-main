
import "dotenv/config";
import { createClient } from "@libsql/client";

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

console.log("Migrating database at:", url);

const client = createClient({
    url: url!,
    authToken: authToken!,
});

async function migrate() {
    try {
        console.log("Adding content column to pages table...");
        try {
            await client.execute("ALTER TABLE pages ADD COLUMN content TEXT");
            console.log("Successfully added 'content' column to pages!");
        } catch (e) {
            console.log("Page column might already exist or error:", e);
        }

        console.log("Adding midtrans columns to orders table...");
        try {
            await client.execute("ALTER TABLE orders ADD COLUMN midtrans_transaction_id TEXT");
            console.log("Successfully added 'midtrans_transaction_id' column!");
        } catch (e) {
            console.log("midtrans_transaction_id might already exist");
        }

        try {
            await client.execute("ALTER TABLE orders ADD COLUMN payment_type TEXT");
            console.log("Successfully added 'payment_type' column!");
        } catch (e) {
            console.log("payment_type might already exist");
        }

    } catch (e: any) {
        console.error("Migration error:", e);
    }
}

migrate();
