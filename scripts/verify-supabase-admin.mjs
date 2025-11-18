import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const url = process.env.VITE_SUPABASE_URL
const serviceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
const anon = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY

async function main() {
  console.log('--- Supabase Admin Verification ---')
  if (!url || !serviceKey) {
    console.error('ENV missing: VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const supabaseAdmin = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
  const supabase = createClient(url, anon, {
    auth: { autoRefreshToken: true, persistSession: false }
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

    // 0b) Generate magic link for first user to validate impersonation
    const firstEmail = userList?.users?.[0]?.email
    if (firstEmail) {
      console.log('Generating magic link for:', firstEmail)
      const redirectTo = process.env.VITE_SITE_URL || 'http://localhost:1111'
      const res = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: firstEmail,
        options: { redirectTo }
      })
      if (res.error) {
        console.warn('[GENERATE LINK] Error:', res.error.message)
      } else {
        console.log('[GENERATE LINK] Raw data keys:', Object.keys(res.data || {}))
        console.log('[GENERATE LINK] properties:', res.data?.properties)
        console.log('[GENERATE LINK] action_link:', res.data?.properties?.action_link || res.data?.action_link)
        if (res.data?.properties?.hashed_token) {
          console.log('Verifying OTP with token_hash ...')
          const { data: vData, error: vErr } = await supabase.auth.verifyOtp({ type: 'magiclink', token_hash: res.data.properties.hashed_token })
          console.log('[VERIFY OTP] data:', vData, 'error:', vErr?.message)
        }
      }
    } else {
      console.log('No users found to test generateLink')
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
