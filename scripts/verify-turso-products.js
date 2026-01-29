// Script to verify and sync Turso database products
// Run with: node scripts/verify-turso-products.js

import { createClient } from "@libsql/client";

const url = process.env.VITE_TURSO_DATABASE_URL || "";
const authToken = process.env.VITE_TURSO_AUTH_TOKEN || "";

if (!url || !authToken) {
    console.error("Missing VITE_TURSO_DATABASE_URL or VITE_TURSO_AUTH_TOKEN in .env");
    process.exit(1);
}

const client = createClient({
    url: url.replace("libsql://", "https://"),
    authToken: authToken,
});

async function verifyProducts() {
    try {
        console.log("🔍 Checking products table...");

        // Check if products table exists
        const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table' AND name='products'");

        if (tables.rows.length === 0) {
            console.log("❌ Products table does not exist. Creating...");
            await client.execute(`
                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL,
                    description TEXT,
                    price INTEGER NOT NULL,
                    type TEXT DEFAULT 'template',
                    category TEXT DEFAULT 'general',
                    image_url TEXT,
                    file_url TEXT,
                    stock INTEGER DEFAULT 0,
                    benefits TEXT,
                    meta_title TEXT,
                    meta_description TEXT,
                    keywords TEXT,
                    created_at INTEGER
                )
            `);
            console.log("✅ Products table created");
        } else {
            console.log("✅ Products table exists");
        }

        // Count products
        const count = await client.execute("SELECT COUNT(*) as count FROM products");
        console.log(`📦 Total products in database: ${count.rows[0].count}`);

        // List all products
        const products = await client.execute("SELECT id, name, price, type, category FROM products ORDER BY id");

        if (products.rows.length === 0) {
            console.log("⚠️  No products found. You may need to add products via admin dashboard.");
        } else {
            console.log("\n📋 Products list:");
            products.rows.forEach((p, i) => {
                console.log(`   ${p.id}. ${p.name} - Rp ${p.price} [${p.type}/${p.category}]`);
            });
        }

        // Verify specific product ID (e.g., id=3 from screenshot)
        const product3 = await client.execute("SELECT * FROM products WHERE id = 3");
        if (product3.rows.length === 0) {
            console.log("\n⚠️  Product with ID 3 does not exist (this matches the 'Produk tidak ditemukan' error)");
        } else {
            console.log(`\n✅ Product ID 3 exists: ${product3.rows[0].name}`);
        }

        console.log("\n✨ Verification complete!");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        client.close();
    }
}

verifyProducts();
