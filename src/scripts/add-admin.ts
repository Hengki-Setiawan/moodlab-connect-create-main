// Script untuk menambahkan akun sebagai admin
import { supabaseAdmin } from '../integrations/supabase/admin';

// Fungsi untuk menambahkan user sebagai admin
async function addUserAsAdmin() {
  const userId = '8d0c210f-b07e-4b36-83cc-df3fdb2de6f7'; // UID yang diberikan
  const email = 'hengkishadow@gmail.com'; // Email yang diberikan
  
  try {
    // Periksa apakah user sudah ada di tabel user_roles sebagai admin
    const { data: existingRole, error: checkError } = await supabaseAdmin
      .from('user_roles')
      .select('*')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking existing role:', checkError);
      return { success: false, error: checkError };
    }
    
    // Jika user sudah menjadi admin, tidak perlu menambahkan lagi
    if (existingRole) {
      console.log('User sudah memiliki peran admin');
      return { success: true, message: 'User sudah memiliki peran admin' };
    }
    
    // Tambahkan user ke tabel user_roles sebagai admin
    const { data, error } = await supabaseAdmin
      .from('user_roles')
      .insert([
        { user_id: userId, role: 'admin', email: email }
      ])
      .select();
    
    if (error) {
      console.error('Error adding admin role:', error);
      return { success: false, error };
    }
    
    console.log('Berhasil menambahkan user sebagai admin:', data);
    return { success: true, data };
    
  } catch (error) {
    console.error('Unexpected error:', error);
    return { success: false, error };
  }
}

// Jalankan fungsi
addUserAsAdmin().then(result => {
  console.log('Result:', result);
});

export {};