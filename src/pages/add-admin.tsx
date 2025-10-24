import React, { useEffect, useState } from 'react';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AdminProtected } from '@/components/AdminProtected';
import AdminNavbar from '@/components/AdminNavbar';
import Navbar from '@/components/Navbar';

interface RoleRow {
  id: string;
  user_id: string;
  role: 'admin' | 'moderator' | 'user';
  email: string | null;
  created_at?: string;
}

export default function AddAdmin() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'moderator'>('moderator');
  const [roles, setRoles] = useState<RoleRow[]>([]);

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabaseAdmin
        .from('user_roles')
        .select('id, user_id, role, email, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setRoles((data || []) as RoleRow[]);
    } catch (err) {
      console.error('Gagal memuat daftar peran:', err);
    }
  };

  const addUserRole = async () => {
    if (!email.trim()) {
      toast.error('Masukkan email akun terlebih dahulu');
      return;
    }
    try {
      setLoading(true);

      // Cari user_id berdasarkan email di tabel profiles
      const { data: userData, error: userError } = await supabaseAdmin
        .from('profiles')
        .select('id, email')
        .eq('email', email.trim())
        .single();

      if (userError || !userData) {
        console.error('Tidak menemukan user dengan email tersebut:', userError);
        toast.error('User dengan email ini belum terdaftar. Pastikan akun sudah login minimal sekali.');
        return;
      }

      // Cek apakah role yang sama sudah ada
      const { data: existingRole, error: checkError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', userData.id)
        .eq('role', role)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing role:', checkError);
        toast.error('Gagal memeriksa role pengguna');
        return;
      }

      if (existingRole) {
        toast.info('Pengguna sudah memiliki peran tersebut');
        return;
      }

      // Tambahkan role baru
      const { error: insertError } = await supabaseAdmin
        .from('user_roles')
        .insert([{ user_id: userData.id, role, email: userData.email }]);

      if (insertError) {
        console.error('Error menambahkan role:', insertError);
        toast.error('Gagal menambahkan role');
        return;
      }

      toast.success(`Berhasil menambahkan ${role} untuk ${email}`);
      setEmail('');
      await fetchRoles();
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Terjadi kesalahan');
    } finally {
      setLoading(false);
    }
  };

  const removeModerator = async (row: RoleRow) => {
    if (row.role !== 'moderator') return;
    try {
      const { error } = await supabaseAdmin
        .from('user_roles')
        .delete()
        .eq('id', row.id);
      if (error) throw error;
      toast.success(`Moderator dengan email ${row.email ?? ''} berhasil dikeluarkan`);
      await fetchRoles();
    } catch (err) {
      console.error('Gagal menghapus moderator:', err);
      toast.error('Gagal menghapus moderator');
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminProtected>
        <AdminNavbar />
        <div className="container mx-auto p-6 ml-64 pt-32">
          <h1 className="text-2xl font-bold mb-6">Kelola Admin & Moderator</h1>

          <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-lg font-semibold mb-4">Tambah Role</h2>
            <div className="grid md:grid-cols-3 gap-3 items-end">
              <div>
                <label className="block text-sm font-medium mb-2">Email akun</label>
                <input
                  type="email"
                  className="border rounded px-3 py-2 w-full"
                  placeholder="user@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Peran</label>
                <select
                  className="border rounded px-3 py-2 w-full"
                  value={role}
                  onChange={(e) => setRole(e.target.value as 'admin' | 'moderator')}
                >
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div>
                <Button onClick={addUserRole} disabled={loading} className="w-full">{loading ? 'Memproses...' : 'Tambahkan Role'}</Button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-3">Catatan: akun target harus sudah pernah login agar ada record di tabel profiles.</p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-4">Daftar Admin & Moderator</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Peran</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {roles.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada admin/moderator</td>
                    </tr>
                  ) : (
                    roles.map((r) => (
                      <tr key={r.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">{r.email ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{r.role}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          {r.role === 'moderator' ? (
                            <Button variant="outline" size="sm" onClick={() => removeModerator(r)}>Keluarkan</Button>
                          ) : (
                            <span className="text-xs text-gray-400">Admin tidak dapat dihapus di halaman ini</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </AdminProtected>
    </div>
  );
}
