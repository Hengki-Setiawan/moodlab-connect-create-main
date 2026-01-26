import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { uploadImage, resolveImageUrl } from '@/integrations/supabase/storage';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number;
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
    type: 'template',
    category: '',
    image_url: '',
    file_url: '',
    benefitsInput: '',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: (product.price ?? 0).toString(),
        type: product.type || 'template',
        category: product.category || '',
        image_url: product.image_url || '',
        file_url: product.file_url || '',
        benefitsInput: (product.benefits || []).join('\n'),
      });
      // Set preview dari URL yang sudah ada
      if (product.image_url) {
        setImagePreview(resolveImageUrl(product.image_url));
      } else {
        setImagePreview(null);
      }
    } else {
      // Reset form untuk produk baru
      setFormData({
        name: '',
        description: '',
        price: '',
        type: 'template',
        category: '',
        image_url: '',
        file_url: '',
        benefitsInput: '',
      });
      setImagePreview(null);
    }
  }, [product, isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validasi tipe file
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar');
      return;
    }

    // Validasi ukuran (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Ukuran gambar maksimal 10MB');
      return;
    }

    // Preview lokal
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload ke Supabase
    setIsUploading(true);
    try {
      const result = await uploadImage(file, 'Gambar', 'products', null, true);
      if (result) {
        setFormData(prev => ({ ...prev, image_url: result.url }));
        toast.success('Gambar berhasil diupload & dikompres');
      } else {
        toast.error('Gagal mengupload gambar');
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Gagal mengupload gambar');
    } finally {
      setIsUploading(false);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const updatedProduct: Partial<Product> = {
      ...(product?.id && { id: product.id }),
      name: formData.name,
      price: Number(formData.price) || 0,
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

    if (!updatedProduct.name?.trim()) {
      toast.error('Nama produk harus diisi');
      return;
    }
    if ((updatedProduct.price ?? 0) < 0) {
      toast.error('Harga tidak boleh negatif');
      return;
    }
    await onSave(updatedProduct);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Produk' : 'Tambah Produk Baru'}</DialogTitle>
          <DialogDescription>Lengkapi informasi produk dan simpan perubahan.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload Section */}
          <div className="space-y-2">
            <Label>Gambar Produk</Label>
            <div className="flex items-start gap-4">
              {/* Preview */}
              <div className="relative w-32 h-32 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300">
                {imagePreview ? (
                  <>
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={removeImage}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                )}
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
              </div>

              {/* Upload Button & URL Input */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="w-full"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Mengupload...' : 'Upload Gambar'}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Gambar akan otomatis dikompres. Max 10MB.
                </p>
                <div className="pt-2">
                  <Label htmlFor="image_url" className="text-xs text-muted-foreground">Atau masukkan URL:</Label>
                  <Input
                    id="image_url"
                    name="image_url"
                    value={formData.image_url}
                    onChange={(e) => {
                      handleInputChange(e);
                      if (e.target.value) {
                        setImagePreview(resolveImageUrl(e.target.value));
                      }
                    }}
                    placeholder="https://..."
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nama Produk *</Label>
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
              <Label htmlFor="price">Harga (Rp) *</Label>
              <Input
                id="price"
                name="price"
                type="number"
                value={formData.price}
                onChange={handleInputChange}
                required
                min="0"
                step="1"
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
                  <SelectItem value="ebook">E-book</SelectItem>
                  <SelectItem value="digital">Digital</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="redesigns">Redesign</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Kategori</Label>
              <Input id="category" name="category" value={formData.category} onChange={handleInputChange} placeholder="design, business, marketing..." className="w-full" />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="file_url">URL File Digital (untuk download)</Label>
            <Input id="file_url" name="file_url" value={formData.file_url} onChange={handleInputChange} placeholder="https://..." className="w-full" />
          </div>

          <div className="space-y-2">
            <Label>Benefit (satu per baris)</Label>
            <Textarea name="benefitsInput" value={formData.benefitsInput} onChange={handleInputChange} rows={4} placeholder="Desain profesional&#10;Mudah diedit&#10;Support 24/7" />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading || isUploading}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={loading || isUploading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {loading ? 'Menyimpan...' : product ? 'Simpan Perubahan' : 'Tambah Produk'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductModal;
