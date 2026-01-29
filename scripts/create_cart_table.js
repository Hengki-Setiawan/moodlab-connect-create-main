import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.VITE_TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({
    url: url,
    authToken: authToken,
});

async function createCartTable() {
    try {
        console.log("Creating cart_items table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS cart_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        product_id INTEGER,
        quantity INTEGER NOT NULL DEFAULT 1,
        created_at INTEGER,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
        console.log("Table 'cart_items' created successfully!");
    } catch (e) {
        console.error("Failed to create table:", e);
    }
}

createCartTable();
