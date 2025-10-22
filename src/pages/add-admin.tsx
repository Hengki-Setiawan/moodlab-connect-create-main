import React, { useState } from 'react';
import { supabaseAdmin } from '@/integrations/supabase/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AdminProtected } from '@/components/AdminProtected';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import AdminNavbar from '@/components/AdminNavbar';

export default function AddAdmin() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const addSpecificUserAsAdmin = async () => {
    const userId = '8d0c210f-b07e-4b36-83cc-df3fdb2de6f7';
    const email = 'hengkishadow@gmail.com';
    
    try {
      setLoading(true);
      
      // Periksa apakah user sudah ada di tabel user_roles sebagai admin
      const { data: existingRole, error: checkError } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking existing role:', checkError);
        toast.error('Gagal memeriksa status admin');
        setResult({ success: false, error: checkError });
        return;
      }
      
      // Jika user sudah menjadi admin, tidak perlu menambahkan lagi
      if (existingRole) {
        toast.info('User sudah memiliki peran admin');
        setResult({ success: true, message: 'User sudah memiliki peran admin' });
        return;
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
        toast.error('Gagal menambahkan peran admin');
        setResult({ success: false, error });
        return;
      }
      
      toast.success('Berhasil menambahkan user sebagai admin');
      setResult({ success: true, data });
      
    } catch (error) {
      console.error('Unexpected error:', error);
      toast.error('Terjadi kesalahan tidak terduga');
      setResult({ success: false, error });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminProtected>
        <AdminNavbar />
        <div className="container mx-auto p-6 ml-64 pt-32">
          <h1 className="text-2xl font-bold mb-6">Tambah Admin</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p className="mb-4">
          Klik tombol di bawah untuk menambahkan akun berikut sebagai admin:
        </p>
        
        <div className="mb-4 p-3 bg-gray-100 rounded">
          <p><strong>Email:</strong> hengkishadow@gmail.com</p>
          <p><strong>User ID:</strong> 8d0c210f-b07e-4b36-83cc-df3fdb2de6f7</p>
        </div>
        
        <Button 
          onClick={addSpecificUserAsAdmin}
          disabled={loading}
          className="w-full md:w-auto"
        >
          {loading ? 'Menambahkan...' : 'Tambahkan Sebagai Admin'}
        </Button>
        
        {result && (
          <div className={`mt-4 p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            <p><strong>{result.success ? 'Berhasil!' : 'Gagal!'}</strong></p>
            <pre className="text-xs mt-2 overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
        </div>
      </AdminProtected>
    </div>
  );
}