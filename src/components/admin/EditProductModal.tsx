import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  type: string;
  category: string;
  image_url?: string | null;
  file_url?: string | null;
  benefits?: string[] | null;
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
    description: '',
    price: '',
    type: '',
    category: '',
    image_url: '',
    file_url: '',
    stock: '',
    benefitsInput: '',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: (product.price ?? 0).toString(),
        stock: (product.stock ?? 0).toString(),
        type: product.type || '',
        category: product.category || '',
        image_url: product.image_url || '',
        file_url: product.file_url || '',
        benefitsInput: (product.benefits || []).join('\n'),
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



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    const updatedProduct: Partial<Product> = {
      id: product.id,
      name: formData.name,
      price: Number(formData.price) || 0,
      stock: Number(formData.stock) || 0,
      description: formData.description,
      category: formData.category,
      type: formData.type,
      image_url: formData.image_url,
      file_url: formData.file_url,
      benefits: formData.benefitsInput
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    };

    if (!updatedProduct.name?.trim()) return;
    if ((updatedProduct.price ?? 0) < 0) return;
    await onSave(updatedProduct);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk'}</DialogTitle>
          <DialogDescription>Lengkapi informasi produk dan simpan perubahan.</DialogDescription>
        </DialogHeader>
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
              <Label htmlFor="type">Tipe Produk</Label>
              <Select value={formData.type} onValueChange={(value) => handleSelectChange('type', value)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih tipe" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="template">Template</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleInputChange} className="w-full" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="image_url">URL Gambar</Label>
              <Input id="image_url" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="https://…" className="w-full" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="file_url">URL File Digital</Label>
              <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleInputChange} placeholder="https://…" className="w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Benefit (satu per baris)</Label>
            <Textarea name="benefitsInput" value={formData.benefitsInput} onChange={handleInputChange} rows={4} />
          </div>

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
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
