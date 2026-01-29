import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.VITE_TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({
    url: url,
    authToken: authToken,
});

async function createTable() {
    try {
        console.log("Creating reviews table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS reviews (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        product_id INTEGER,
        user_name TEXT NOT NULL,
        rating INTEGER NOT NULL,
        comment TEXT NOT NULL,
        reply TEXT,
        created_at INTEGER,
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
        console.log("Table 'reviews' created successfully!");
    } catch (e) {
        console.error("Failed to create table:", e);
    }
}

createTable();
