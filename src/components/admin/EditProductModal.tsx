import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AdminModal } from './AdminModal';

interface Product {
  id: string;
  name: string;
  price: number;
  description?: string;
  stock: number;
  category?: string;
  type?: string;
  image_url?: string;
  digital_file_url?: string;
  is_digital?: boolean;
}

interface EditProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onSave: (product: Partial<Product>) => Promise<void>;
  loading?: boolean;
}

export const EditProductModal: React.FC<EditProductModalProps> = ({
  isOpen,
  onClose,
  product,
  onSave,
  loading = false,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    price: '',
    description: '',
    stock: '',
    category: '',
    type: '',
    image_url: '',
    digital_file_url: '',
    is_digital: false,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        price: product.price?.toString() || '',
        description: product.description || '',
        stock: product.stock?.toString() || '',
        category: product.category || '',
        type: product.type || '',
        image_url: product.image_url || '',
        digital_file_url: product.digital_file_url || '',
        is_digital: product.is_digital || false,
      });
    }
  }, [product]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCheckboxChange = (name: string, checked: boolean) => {
    setFormData(prev => ({ ...prev, [name]: checked }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const updatedProduct: Partial<Product> = {
      id: product.id,
      name: formData.name,
      price: parseFloat(formData.price) || 0,
      description: formData.description,
      stock: parseInt(formData.stock) || 0,
      category: formData.category,
      type: formData.type,
      image_url: formData.image_url,
      digital_file_url: formData.digital_file_url,
      is_digital: formData.is_digital,
    };

    await onSave(updatedProduct);
  };

  return (
    <AdminModal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Edit Produk' : 'Tambah Produk Baru'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Produk</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="price">Harga (Rp)</Label>
            <Input
              id="price"
              name="price"
              type="number"
              value={formData.price}
              onChange={handleInputChange}
              required
              min="0"
              step="0.01"
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Deskripsi</Label>
          <Textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleInputChange}
            rows={3}
            className="w-full"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="stock">Stok</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              required
              min="0"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Kategori</Label>
            <Input
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipe Produk</Label>
            <Select
              value={formData.type}
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="physical">Produk Fisik</SelectItem>
                <SelectItem value="digital">Produk Digital</SelectItem>
                <SelectItem value="service">Jasa/Layanan</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="image_url">URL Gambar</Label>
            <Input
              id="image_url"
              name="image_url"
              value={formData.image_url}
              onChange={handleInputChange}
              placeholder="https://..."
              className="w-full"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_digital"
              name="is_digital"
              checked={formData.is_digital}
              onChange={(e) => handleCheckboxChange('is_digital', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_digital">Produk Digital</Label>
          </div>
        </div>

        {formData.is_digital && (
          <div className="space-y-2">
            <Label htmlFor="digital_file_url">URL File Digital</Label>
            <Input
              id="digital_file_url"
              name="digital_file_url"
              value={formData.digital_file_url}
              onChange={handleInputChange}
              placeholder="https://..."
              className="w-full"
            />
          </div>
        )}

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            Batal
          </Button>
          <Button
            type="submit"
            disabled={loading}
          >
            {loading ? 'Menyimpan...' : 'Simpan Produk'}
          </Button>
        </div>
      </form>
    </AdminModal>
  );
};

export default EditProductModal;