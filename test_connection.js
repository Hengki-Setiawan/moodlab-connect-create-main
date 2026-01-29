import 'dotenv/config';
import { createClient } from '@libsql/client';

const url = process.env.VITE_TURSO_DATABASE_URL?.replace("libsql://", "https://");
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

console.log("URL:", url);
console.log("Token length:", authToken?.length);

const client = createClient({
    url: url,
    authToken: authToken,
});

async function test() {
    try {
        const rs = await client.execute("SELECT 1");
        console.log("Connection successful!", rs);
    } catch (e) {
        console.error("Connection failed:", e);
    }
}

test();
