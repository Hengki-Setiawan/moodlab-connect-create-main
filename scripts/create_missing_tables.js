import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.VITE_TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({
    url: url,
    authToken: authToken,
});

async function createTables() {
    try {
        console.log("Creating orders table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS orders (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        total_amount INTEGER NOT NULL,
        created_at INTEGER
      );
    `);
        console.log("Table 'orders' created successfully!");

        console.log("Creating consultations table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS consultations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT NOT NULL,
        phone TEXT NOT NULL,
        service_type TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        created_at INTEGER
      );
    `);
        console.log("Table 'consultations' created successfully!");

        console.log("Creating pages table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS pages (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        path TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        description TEXT,
        updated_at INTEGER
      );
    `);
        console.log("Table 'pages' created successfully!");

    } catch (e) {
        console.error("Failed to create tables:", e);
    }
}

createTables();
