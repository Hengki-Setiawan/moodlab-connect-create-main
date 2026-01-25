import React, { useState, useEffect } from 'react';
import { adminGetAllRecords, adminDeleteRecord } from '@/integrations/supabase/admin';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { AdminProtected } from '@/components/AdminProtected';
import AdminNavbar from '@/components/AdminNavbar';
import Navbar from '@/components/Navbar';

export default function DeleteProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteStatus, setDeleteStatus] = useState('');

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await adminGetAllRecords('products');
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Gagal memuat produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Apakah Anda yakin ingin menghapus produk "${name}"?`)) {
      try {
        setLoading(true);
        await adminDeleteRecord('products', id);
        setDeleteStatus(`Produk "${name}" berhasil dihapus!`);
        loadProducts(); // Reload products after deletion
      } catch (err) {
        console.error('Error deleting product:', err);
        setError(`Gagal menghapus produk "${name}". Silakan coba lagi.`);
        setDeleteStatus('');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDeleteAll = async () => {
    if (window.confirm(`PERHATIAN: Apakah Anda yakin ingin menghapus SEMUA produk? Tindakan ini tidak dapat dibatalkan!`)) {
      try {
        setLoading(true);
        let successCount = 0;
        let errorCount = 0;
        
        for (const product of products) {
          try {
            await adminDeleteRecord('products', product.id);
            successCount++;
          } catch (err) {
            console.error(`Error deleting product ${product.id}:`, err);
            errorCount++;
          }
        }
        
        setDeleteStatus(`${successCount} produk berhasil dihapus. ${errorCount} produk gagal dihapus.`);
        loadProducts(); // Reload products after deletion
      } catch (err) {
        console.error('Error in bulk deletion:', err);
        setError('Terjadi kesalahan saat menghapus produk secara massal.');
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminProtected>
        <AdminNavbar />
        <div className="container mx-auto p-6 ml-64 pt-32">
          <h1 className="text-2xl font-bold mb-4">Hapus Produk dari Database</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4">
          <p>{error}</p>
        </div>
      )}
      
      {deleteStatus && (
        <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded mb-4">
          <p>{deleteStatus}</p>
        </div>
      )}
      
      <div className="mb-4">
        <button 
          onClick={loadProducts}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
          disabled={loading}
        >
          {loading ? 'Memuat...' : 'Muat Ulang Produk'}
        </button>
        
        {products.length > 0 && (
          <button 
            onClick={handleDeleteAll}
            className="bg-red-600 text-white px-4 py-2 rounded"
            disabled={loading}
          >
            {loading ? 'Menghapus...' : 'Hapus Semua Produk'}
          </button>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && !products.length ? (
          <p>Memuat produk...</p>
        ) : products.length === 0 ? (
          <p>Tidak ada produk dalam database.</p>
        ) : (
          products.map((product) => (
            <div key={product.id} className="border rounded-lg p-4 bg-white shadow-sm">
              {product.image_url ? (
                <div className="w-full h-40 mb-3 overflow-hidden rounded">
                  <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-full h-40 mb-3 overflow-hidden rounded bg-gray-100 flex items-center justify-center text-xs text-gray-500">
                  Tidak ada gambar
                </div>
              )}
              <h3 className="font-semibold text-lg">{product.name}</h3>
              <p className="text-green-600 font-medium">
                Rp {typeof product.price === 'number' ? product.price.toLocaleString() : product.price}
              </p>
              {product.description && (
                <p className="text-gray-600 mt-1 text-sm">{product.description}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Stok: {product.stock || 0}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                ID: {product.id}
              </p>
              
              <button
                onClick={() => handleDelete(product.id, product.name)}
                className="mt-3 bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                disabled={loading}
              >
                Hapus Produk
              </button>
            </div>
          ))
        )}
      </div>
    </div>
      </AdminProtected>
    </div>
  );
}