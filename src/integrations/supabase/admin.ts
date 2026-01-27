// This file previously exported a supabaseAdmin client with service role key.
// It has been removed for security reasons as it was exposing the key to the client.
// DO NOT use service role keys in the frontend.
// If you need admin functionality, use Supabase Edge Functions or RLS policies.

export const supabaseAdmin = {
  from: () => { throw new Error("supabaseAdmin is disabled for security. Use supabase client + RLS."); },
  auth: {
    admin: {
      listUsers: () => { throw new Error("supabaseAdmin is disabled for security."); },
      deleteUser: () => { throw new Error("supabaseAdmin is disabled for security."); },
      generateLink: () => { throw new Error("supabaseAdmin is disabled for security."); },
    }
  },
  storage: {
    from: () => { throw new Error("supabaseAdmin is disabled for security. Use supabase client + RLS."); },
    listBuckets: () => { throw new Error("supabaseAdmin is disabled for security."); }
  }
};