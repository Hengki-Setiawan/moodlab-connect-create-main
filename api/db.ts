import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "../src/db/schema.js";

const url = process.env.VITE_TURSO_DATABASE_URL;
const authToken = process.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    throw new Error("Missing Turso credentials in .env");
}

export const tursoClient = createClient({
    url: url.replace("libsql://", "https://"),
    authToken: authToken,
});

export const db = drizzle(tursoClient, { schema });
