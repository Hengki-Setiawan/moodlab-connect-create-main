import 'dotenv/config';

console.log("VITE_TURSO_DATABASE_URL exists:", !!process.env.VITE_TURSO_DATABASE_URL);
console.log("VITE_TURSO_AUTH_TOKEN exists:", !!process.env.VITE_TURSO_AUTH_TOKEN);
console.log("VITE_SUPABASE_URL exists:", !!process.env.VITE_SUPABASE_URL);
console.log("VITE_SUPABASE_ANON_KEY exists:", !!process.env.VITE_SUPABASE_ANON_KEY);
