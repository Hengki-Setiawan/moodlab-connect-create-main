import React, { useState, useEffect } from 'react';
import { adminGetAllRecords } from '@/integrations/supabase/admin';

export default function TestAdminConnection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [table, setTable] = useState('products');

  useEffect(() => {
    testConnection();
  }, [table]);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await adminGetAllRecords(table);
      setData(result);
    } catch (err) {
      console.error('Error testing connection:', err);
      setError(err.message || 'Terjadi kesalahan saat menguji koneksi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Uji Koneksi Admin Supabase</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Pilih Tabel:</label>
        <select 
          value={table} 
          onChange={(e) => setTable(e.target.value)}
          className="border p-2 rounded"
        >
          <option value="products">Products</option>
          <option value="users">Users</option>
          <option value="orders">Orders</option>
          <option value="user_roles">User Roles</option>
        </select>
      </div>

      <button 
        onClick={testConnection}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        disabled={loading}
      >
        {loading ? 'Memuat...' : 'Uji Koneksi Lagi'}
      </button>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p className="font-bold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {data && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Hasil ({data.length} baris):</h2>
          <div className="bg-gray-100 p-4 rounded overflow-auto max-h-96">
            <pre>{JSON.stringify(data, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}