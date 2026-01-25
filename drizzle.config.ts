import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
    schema: "./src/db/schema.ts",
    out: "./drizzle",
    dialect: "sqlite",

    dbCredentials: {
        url: process.env.VITE_TURSO_DATABASE_URL!.replace("libsql://", "https://"),
        authToken: process.env.VITE_TURSO_AUTH_TOKEN!,
    },
});
