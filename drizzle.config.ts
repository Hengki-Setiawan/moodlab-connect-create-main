import "dotenv/config";
import { defineConfig } from "drizzle-kit";

console.log("Drizzle Config - URL:", process.env.VITE_TURSO_DATABASE_URL ? "Found" : "Missing");
console.log("Drizzle Config - Token:", process.env.VITE_TURSO_AUTH_TOKEN ? "Found" : "Missing");

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",

    dbCredentials: {
        url: process.env.VITE_TURSO_DATABASE_URL!,
        authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
    },
});
