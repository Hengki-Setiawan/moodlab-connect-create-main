import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY

async function main() {
  console.log('--- Supabase Admin Verification ---')
  if (!url || !serviceKey) {
    console.error('ENV missing: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })

  try {
    // 0) Admin check: list users
    console.log('Listing users (admin) ...')
    const { data: userList, error: listError } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1 })
    if (listError) {
      console.warn('[ADMIN LIST USERS] Error:', listError.message)
    } else {
      console.log('[ADMIN LIST USERS] Users length:', userList?.users?.length ?? 0)
    }

    // 1) Cek RPC get_auth_email_by_username
    console.log('Checking RPC: get_auth_email_by_username("admin") ...')
    const { data: rpcData, error: rpcError } = await supabaseAdmin.rpc(
      'get_auth_email_by_username',
      { _username: 'admin' }
    )
    if (rpcError) {
      console.warn('[RPC] Error:', rpcError.message)
    } else {
      console.log('[RPC] Result:', rpcData)
    }

    // 2) Read test: page_contents top 1
    console.log('Reading table: page_contents (top 1) ...')
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from('page_contents')
      .select('*')
      .limit(1)
    if (pagesError) {
      console.warn('[READ] Error:', pagesError.message)
    } else {
      console.log('[READ] Rows:', pages?.length ?? 0)
    }

    // 3) Write test: upsert then delete a healthcheck row (idempotent)
    console.log('Write test: upsert healthcheck then delete ...')
    const slug = 'healthcheck-username-rpc'
    const { error: upsertError } = await supabaseAdmin
      .from('page_contents')
      .upsert({
        slug,
        title: 'Healthcheck',
        content: 'ok',
        updated_at: new Date().toISOString()
      }, { onConflict: 'slug' })
    if (upsertError) {
      console.warn('[UPSERT] Error:', upsertError.message)
    } else {
      console.log('[UPSERT] Success')
    }

    const { error: deleteError } = await supabaseAdmin
      .from('page_contents')
      .delete()
      .eq('slug', slug)
    if (deleteError) {
      console.warn('[DELETE] Error:', deleteError.message)
    } else {
      console.log('[DELETE] Success')
    }

    console.log('--- Verification finished ---')
  } catch (err) {
    console.error('Unexpected error:', err?.message ?? err)
    process.exit(2)
  }
}

main()
