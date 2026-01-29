import 'dotenv/config';
import { execSync } from 'child_process';

console.log("Pushing schema to Turso...");
console.log("URL present:", !!process.env.VITE_TURSO_DATABASE_URL);
console.log("Token present:", !!process.env.VITE_TURSO_AUTH_TOKEN);

try {
    execSync('npx drizzle-kit push', { stdio: 'inherit', env: process.env });
} catch (error) {
    console.error("Migration failed.");
    process.exit(1);
}
