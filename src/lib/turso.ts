import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "@/db/schema";

const url = import.meta.env.VITE_TURSO_DATABASE_URL;
const authToken = import.meta.env.VITE_TURSO_AUTH_TOKEN;

if (!url || !authToken) {
    console.error("Missing Turso credentials in .env");
}

export const tursoClient = createClient({
    url: url || "libsql://placeholder-db.turso.io",
    authToken: authToken || "placeholder-token",
});

// Pass schema for relational queries support
export const db = drizzle(tursoClient, { schema });

