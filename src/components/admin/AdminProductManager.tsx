import React, { useState, useEffect } from 'react';
import { db } from "@/lib/turso";
import { products as productsSchema } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { EditProductModal } from './EditProductModal';
import { resolveImageUrl } from '@/integrations/supabase/storage';
import { ImageIcon } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  description?: string | null;
  stock?: number | null;
  category: string;
  type: string;
  image_url?: string | null;
  file_url?: string | null;
  benefits?: string[] | null;
}

export default function AdminProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  // Load products on component mount
  useEffect(() => {
    loadProducts();
  }, []);

  // Fetch all products using admin privileges
  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await db.select().from(productsSchema).orderBy(desc(productsSchema.created_at));

      // Map and parse benefits
      const mappedData: Product[] = data.map(p => ({
        ...p,
        description: p.description || null,
        stock: p.stock || 0,
        category: p.category || "",
        type: p.type || "template",
        image_url: p.image_url || null,
        file_url: p.file_url || null,
        benefits: p.benefits ? JSON.parse(p.benefits) : []
      }));

      setProducts(mappedData);
      setError(null);
    } catch (err) {
      console.error('Error loading products:', err);
      setError('Gagal memuat produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  // Handle modal open/close
  const openModal = (product: Product | null = null) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsModalOpen(false);
  };

  // Handle save product
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      setLoading(true);

      // Strictly sanitize data to avoid sending 'id', 'created_at' or other unwanted fields
      const cleanData = {
        name: productData.name,
        description: productData.description,
        price: productData.price,
        type: productData.type,
        category: productData.category,
        image_url: productData.image_url,
        file_url: productData.file_url,
        // Only include stock if it's defined
        ...(productData.stock !== undefined && { stock: productData.stock }),
        benefits: productData.benefits ? JSON.stringify(productData.benefits) : null,
        meta_title: (productData as any).meta_title,
        meta_description: (productData as any).meta_description,
        keywords: (productData as any).keywords,
      };

      console.log("Saving product data:", cleanData);

      if (selectedProduct) {
        // Update existing product
        await db.update(productsSchema)
          .set(cleanData)
          .where(eq(productsSchema.id, selectedProduct.id));
      } else {
        // Create new product
        await db.insert(productsSchema).values(cleanData as typeof productsSchema.$inferInsert);
      }

      closeModal();
      loadProducts();

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
      console.error('Error saving product:', err);
      setError(`Gagal menyimpan produk: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  // Delete a product
  const handleDelete = async (id: string) => {
    if (window.confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      try {
        setLoading(true);
        await db.delete(productsSchema).where(eq(productsSchema.id, parseInt(id)));
        loadProducts();
      } catch (err) {
        console.error('Error deleting product:', err);
        setError('Gagal menghapus produk. Silakan coba lagi.');
      } finally {
        setLoading(false);
      }
    }
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (product.category && product.category.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manajemen Produk</h1>
        <Button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700">
          <span className="mr-2">+</span> Tambah Produk
        </Button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <Input
          type="text"
          placeholder="Cari produk berdasarkan nama, deskripsi, atau kategori..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full max-w-md"
        />
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stok</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading && filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Memuat produk...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Tidak ada produk ditemukan.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-lg overflow-hidden bg-gray-100 flex items-center justify-center mr-3 flex-shrink-0">
                          {product.image_url ? (
                            <img
                              className="h-full w-full object-cover"
                              src={resolveImageUrl(product.image_url)}
                              alt={product.name}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <ImageIcon className="h-5 w-5 text-gray-400" />
                          )}
                        </div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.name}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.category || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      Rp {product.price.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {product.stock || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${product.type === 'digital' ? 'bg-blue-100 text-blue-800' :
                        product.type === 'ebook' ? 'bg-purple-100 text-purple-800' :
                          product.type === 'service' ? 'bg-green-100 text-green-800' :
                            product.type === 'template' ? 'bg-orange-100 text-orange-800' :
                              'bg-gray-100 text-gray-800'
                        }`}>
                        {product.type === 'digital' ? 'Digital' :
                          product.type === 'ebook' ? 'E-book' :
                            product.type === 'service' ? 'Jasa' :
                              product.type === 'template' ? 'Template' :
                                product.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openModal(product)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(product.id.toString())}
                          className="text-red-600 hover:text-red-900"
                        >
                          Hapus
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      <EditProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        product={selectedProduct}
        onSave={handleSaveProduct}
        loading={loading}
      />
    </div>
  );
}