import React, { useState, useEffect } from 'react';
import { adminGetAllRecords, adminCreateRecord, adminUpdateRecord, adminDeleteRecord } from '@/integrations/supabase/admin';

// Contoh komponen Admin untuk mengelola produk
export default function AdminProductManager() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: ''
  });
  
  // Edit mode
  const [editMode, setEditMode] = useState(false);
  const [currentProductId, setCurrentProductId] = useState(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Fetch all products using admin privileges
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

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prepare data with correct types
    const productData = {
      name: formData.name,
      price: parseFloat(formData.price),
      description: formData.description,
      stock: parseInt(formData.stock, 10)
    };
    
    try {
      setLoading(true);
      
      if (editMode) {
        // Update existing product
        await adminUpdateRecord('products', currentProductId, productData);
      } else {
        // Create new product
        await adminCreateRecord('products', productData);
      }
      
      // Reset form and reload products
      resetForm();
      loadProducts();
      
    } catch (err) {
      console.error('Error saving product:', err);
      setError('Gagal menyimpan produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const handleDelete = async (id) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        setLoading(true);
        await adminDeleteRecord('products', id);
        loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Gagal menghapus produk. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Edit a product
  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      stock: product.stock?.toString() || '0'
    });
    setCurrentProductId(product.id);
    setEditMode(true);
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      price: '',
      description: '',
      stock: ''
    });
    setCurrentProductId(null);
    setEditMode(false);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Admin Produk Manager</h1>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Form */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">
            {editMode ? 'Edit Produk' : 'Tambah Produk Baru'}
          </h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Nama Produk</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Harga</label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="0"
                step="0.01"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Deskripsi</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                rows="3"
              />
            </div>
            
            <div className="mb-4">
              <label className="block text-gray-700 mb-2">Stok</label>
              <input
                type="number"
                name="stock"
                value={formData.stock}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border rounded-md"
                required
                min="0"
              />
            </div>
            
            <div className="flex space-x-2">
              <button
                type="submit"
                className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
                disabled={loading}
              >
                {loading ? 'Menyimpan...' : editMode ? 'Update Produk' : 'Tambah Produk'}
              </button>
              
              {editMode && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>
        
        {/* Products List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Daftar Produk</h2>
          
          {loading && !products.length ? (
            <p>Memuat produk...</p>
          ) : products.length === 0 ? (
            <p>Tidak ada produk. Tambahkan produk baru.</p>
          ) : (
            <div className="space-y-4">
              {products.map((product) => (
                <div key={product.id} className="bg-white p-4 rounded-lg shadow-md">
                  <h3 className="font-semibold">{product.name}</h3>
                  <p className="text-green-600 font-medium">Rp {product.price.toLocaleString()}</p>
                  {product.description && <p className="text-gray-600 mt-1">{product.description}</p>}
                  <p className="text-sm text-gray-500 mt-1">Stok: {product.stock || 0}</p>
                  
                  <div className="mt-3 flex space-x-2">
                    <button
                      onClick={() => handleEdit(product)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded-md text-sm hover:bg-yellow-600"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-md text-sm hover:bg-red-600"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}