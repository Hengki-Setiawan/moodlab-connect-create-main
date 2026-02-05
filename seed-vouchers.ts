
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
        console.log("Seeding Voucher...");

        await client.execute(`
      INSERT INTO vouchers (code, discount_type, amount, min_spend, usage_limit)
      VALUES 
      ('HEMAT10', 'percent', 10, 50000, 100),
      ('POTONG20K', 'fixed', 20000, 100000, 50)
      ON CONFLICT(code) DO NOTHING;
    `);

        console.log("✅ Vouchers seeded: HEMAT10 (10%), POTONG20K (20k off)");

    } catch (error) {
        console.error("Seeding failed:", error);
    } finally {
        client.close();
    }
}

main();
