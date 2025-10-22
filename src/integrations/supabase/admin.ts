// This file provides admin access to Supabase with service role permissions
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

// Import the admin client like this:
// import { supabaseAdmin } from "@/integrations/supabase/admin";
// WARNING: Only use this client on the server or in protected admin routes
// Never expose this client to regular users

export const supabaseAdmin = createClient<Database>(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Example admin operations:

// Create a new record with admin privileges
export async function adminCreateRecord(table: string, data: any) {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .insert(data)
    .select();
  
  if (error) {
    console.error(`Error creating record in ${table}:`, error);
    throw error;
  }
  
  return result;
}

// Update a record with admin privileges (bypassing RLS)
export async function adminUpdateRecord(table: string, id: string, data: any) {
  const { data: result, error } = await supabaseAdmin
    .from(table)
    .update(data)
    .eq('id', id)
    .select();
  
  if (error) {
    console.error(`Error updating record in ${table}:`, error);
    throw error;
  }
  
  return result;
}

// Delete a record with admin privileges
export async function adminDeleteRecord(table: string, id: string) {
  const { error } = await supabaseAdmin
    .from(table)
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error(`Error deleting record from ${table}:`, error);
    throw error;
  }
  
  return true;
}

// Get all records from a table (bypassing RLS)
export async function adminGetAllRecords(table: string) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select('*');
  
  if (error) {
    console.error(`Error fetching records from ${table}:`, error);
    throw error;
  }
  
  return data;
}