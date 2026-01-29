import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.VITE_TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

const client = createClient({
    url: url,
    authToken: authToken,
});

async function createOrderItemsTable() {
    try {
        console.log("Creating order_items table...");
        await client.execute(`
      CREATE TABLE IF NOT EXISTS order_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        order_id INTEGER,
        product_id INTEGER,
        quantity INTEGER NOT NULL,
        price INTEGER NOT NULL,
        created_at INTEGER,
        FOREIGN KEY (order_id) REFERENCES orders(id),
        FOREIGN KEY (product_id) REFERENCES products(id)
      );
    `);
        console.log("Table 'order_items' created successfully!");
    } catch (e) {
        console.error("Failed to create table:", e);
    }
}

createOrderItemsTable();
