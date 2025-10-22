import React, { useState, useEffect } from 'react';
import { adminCreateRecord } from '@/integrations/supabase/admin';
import { uploadImage } from '@/integrations/supabase/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    type: 'template',
    category: 'design'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSelectChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validasi tipe file (hanya gambar)
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPG, PNG, dll)');
      return;
    }

    // Validasi ukuran file (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 2MB');
      return;
    }

    setImageFile(file);

    // Membuat preview gambar
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);

      // Validasi form
      if (!formData.name || !formData.price) {
        toast.error('Nama dan harga produk wajib diisi');
        return;
      }

      // Prepare data
      const productData = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock || '0', 10),
        type: formData.type,
        category: formData.category,
        image_url: null
      };

      // Upload gambar jika ada
      if (imageFile) {
        const imageData = await uploadImage(imageFile);
        if (imageData) {
          productData.image_url = imageData.url;
        }
      }

      // Simpan produk ke database
      const newProduct = await adminCreateRecord('products', productData);
      
      if (newProduct) {
        toast.success('Produk berhasil ditambahkan!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          price: '',
          stock: '',
          type: 'template',
          category: 'design'
        });
        setImageFile(null);
        setImagePreview('');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Gagal menambahkan produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Tambah Produk Baru</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="name">Nama Produk *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="Masukkan nama produk"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="price">Harga (Rp) *</Label>
                <Input
                  id="price"
                  name="price"
                  type="number"
                  value={formData.price}
                  onChange={handleInputChange}
                  placeholder="Contoh: 150000"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="stock">Stok</Label>
                <Input
                  id="stock"
                  name="stock"
                  type="number"
                  value={formData.stock}
                  onChange={handleInputChange}
                  placeholder="Jumlah stok produk"
                />
              </div>
              
              <div>
                <Label htmlFor="type">Tipe Produk</Label>
                <Select 
                  value={formData.type} 
                  onValueChange={(value) => handleSelectChange('type', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tipe produk" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="template">Template</SelectItem>
                    <SelectItem value="ebook">E-Book</SelectItem>
                    <SelectItem value="physical">Produk Fisik</SelectItem>
                    <SelectItem value="service">Layanan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="category">Kategori</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => handleSelectChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="design">Desain</SelectItem>
                    <SelectItem value="education">Pendidikan</SelectItem>
                    <SelectItem value="business">Bisnis</SelectItem>
                    <SelectItem value="technology">Teknologi</SelectItem>
                    <SelectItem value="other">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="description">Deskripsi Produk</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Deskripsi detail tentang produk"
                  rows={4}
                />
              </div>
              
              <div>
                <Label htmlFor="image">Gambar Produk</Label>
                <div className="mt-1 flex items-center">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="flex-1"
                  />
                </div>
                
                {imagePreview && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-500 mb-1">Preview:</p>
                    <div className="relative w-full h-48 border rounded-md overflow-hidden">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              className="w-full md:w-auto"
              disabled={loading}
            >
              {loading ? 'Menyimpan...' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}