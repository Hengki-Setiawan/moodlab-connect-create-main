// Verifikasi alur baca/tulis konten halaman menggunakan Supabase
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const SERVICE_ROLE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !ANON_KEY) {
  console.error('Missing env: VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY/VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}
if (!SERVICE_ROLE_KEY) {
  console.error('Missing env: VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, ANON_KEY);
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function readPageContents() {
  const { data, error } = await supabase
    .from('page_contents')
    .select('page, content')
    .in('page', ['home', 'about']);
  if (error) throw error;
  const map = {};
  (data || []).forEach((row) => { map[row.page] = row.content; });
  return map;
}

async function upsertSameContents(contents) {
  // Upsert ulang dengan nilai yang sama agar tidak mengubah tampilan,
  // tetapi memastikan izin tulis berfungsi.
  for (const page of ['home', 'about']) {
    const payload = { page, content: contents[page] || {} };
    const { error } = await supabaseAdmin
      .from('page_contents')
      .upsert(payload);
    if (error) throw error;
    console.log(`[OK] Upsert "${page}" berhasil.`);
  }
}

async function main() {
  try {
    console.log('> Membaca konten halaman (anon client) ...');
    const contents = await readPageContents();
    console.log('Konten saat ini:', JSON.stringify(contents, null, 2));

    console.log('> Menguji izin tulis dengan upsert (service role) ...');
    await upsertSameContents(contents);

    console.log('Verifikasi selesai: baca & tulis konten halaman berfungsi.');
    process.exit(0);
  } catch (err) {
    console.error('Verifikasi gagal:', err);
    process.exit(1);
  }
}

main();
