import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Supabase URL atau Key tidak ditemukan di environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Email pengguna yang akan dijadikan admin
const adminEmail = 'admin@example.com';

async function addAdminRole() {
  try {
    // Cek apakah tabel user_roles sudah ada
    const { error: tableCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .limit(1);

    // Jika tabel belum ada, buat tabel baru
    if (tableCheckError && tableCheckError.code === '42P01') {
      console.log('Tabel user_roles belum ada, membuat tabel baru...');
      
      // Buat tabel user_roles
      // Catatan: Ini hanya contoh, sebaiknya buat tabel melalui Supabase dashboard
      const { error: createTableError } = await supabase.rpc('create_user_roles_table');
      
      if (createTableError) {
        console.error('Gagal membuat tabel user_roles:', createTableError);
        process.exit(1);
      }
    }

    // Cari user berdasarkan email
    const { data: userData, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', adminEmail)
      .single();

    if (userError) {
      console.error('Gagal menemukan user dengan email tersebut:', userError);
      process.exit(1);
    }

    if (!userData) {
      console.error(`User dengan email ${adminEmail} tidak ditemukan`);
      process.exit(1);
    }

    // Cek apakah user sudah memiliki peran
    const { data: existingRole, error: roleCheckError } = await supabase
      .from('user_roles')
      .select('*')
      .eq('user_id', userData.id)
      .single();

    if (!roleCheckError && existingRole) {
      // Update peran jika sudah ada
      const { error: updateError } = await supabase
        .from('user_roles')
        .update({ role: 'admin' })
        .eq('user_id', userData.id);

      if (updateError) {
        console.error('Gagal mengupdate peran user:', updateError);
        process.exit(1);
      }

      console.log(`Peran user ${adminEmail} berhasil diupdate menjadi admin`);
    } else {
      // Tambahkan peran baru jika belum ada
      const { error: insertError } = await supabase
        .from('user_roles')
        .insert([
          { user_id: userData.id, role: 'admin' }
        ]);

      if (insertError) {
        console.error('Gagal menambahkan peran admin:', insertError);
        process.exit(1);
      }

      console.log(`User ${adminEmail} berhasil ditambahkan sebagai admin`);
    }
  } catch (error) {
    console.error('Terjadi kesalahan:', error);
    process.exit(1);
  }
}

addAdminRole();