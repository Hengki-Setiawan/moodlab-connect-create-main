import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { uploadImage, resolveImageUrl } from '@/integrations/supabase/storage';
import { Upload, X, ImageIcon, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { generateProductSEO } from '@/lib/groq';

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
  meta_title?: string | null;
  meta_description?: string | null;
  keywords?: string | null;
  stock?: number;
  // New e-commerce fields
  preview_images?: string[] | null;
  license_type?: string | null;
  license_prices?: Record<string, number> | null;
  mood_category?: string | null;
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
    meta_title: '',
    meta_description: '',
    keywords: '',
    stock: '0',
    // New e-commerce fields
    preview_images: [] as string[],
    license_type: 'personal',
    license_prices: { personal: '', commercial: '', extended: '' } as Record<string, string | number>,
    mood_category: 'general',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [seoLoading, setSeoLoading] = useState(false);
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
        meta_title: product.meta_title || '',
        meta_description: product.meta_description || '',
        keywords: product.keywords || '',
        stock: (product.stock ?? 0).toString(),
        // New e-commerce fields
        preview_images: product.preview_images || [],
        license_type: product.license_type || 'personal',
        license_prices: {
          personal: product.license_prices?.personal || '',
          commercial: product.license_prices?.commercial || '',
          extended: product.license_prices?.extended || ''
        },
        mood_category: product.mood_category || 'general',
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
        meta_title: '',
        meta_description: '',
        keywords: '',
        stock: '0',
        // New e-commerce fields
        preview_images: [],
        license_type: 'personal',
        license_prices: { personal: '', commercial: '', extended: '' },
        mood_category: 'general',
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
      // Result is guaranteed to be non-null if no error thrown
      setFormData(prev => ({ ...prev, image_url: result.url }));
      toast.success('Gambar berhasil diupload & dikompres');
    } catch (error: unknown) {
      console.error('Upload error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Gagal mengupload gambar: ${errorMessage}`);
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

  const handleGenerateSEO = async () => {
    if (!formData.name || !formData.description) {
      toast.error("Nama dan deskripsi produk harus diisi dulu!");
      return;
    }

    setSeoLoading(true);
    try {
      const result = await generateProductSEO(formData.name, formData.description);
      setFormData(prev => ({
        ...prev,
        meta_title: result.meta_title,
        meta_description: result.meta_description,
        keywords: result.keywords
      }));
      toast.success("SEO Metadata berhasil dibuat!");
    } catch (error) {
      toast.error("Gagal generate SEO");
    } finally {
      setSeoLoading(false);
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
      meta_title: formData.meta_title,
      meta_description: formData.meta_description,
      keywords: formData.keywords,
      stock: Number(formData.stock) || 0,
      // New e-commerce fields
      preview_images: formData.preview_images,
      license_type: formData.license_type,
      license_prices: {
        personal: Number(formData.license_prices.personal) || 0,
        commercial: Number(formData.license_prices.commercial) || 0,
        extended: Number(formData.license_prices.extended) || 0
      },
      mood_category: formData.mood_category,
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
            <Label htmlFor="stock">Stok</Label>
            <Input
              id="stock"
              name="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              min="0"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Deskripsi (Support Markdown: **bold**, - list)</Label>
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

          {/* New E-commerce Fields */}
          <div className="border-t pt-4 mt-4">
            <Label className="text-base font-semibold mb-4 block">Pengaturan E-commerce</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kategori Mood</Label>
                <Select value={formData.mood_category} onValueChange={(value) => setFormData(prev => ({ ...prev, mood_category: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih mood" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="professional">Professional & Corporate</SelectItem>
                    <SelectItem value="hype">Hype & Viral</SelectItem>
                    <SelectItem value="minimalist">Minimalist & Aesthetic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Tipe Lisensi</Label>
                <Select value={formData.license_type} onValueChange={(value) => setFormData(prev => ({ ...prev, license_type: value }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih lisensi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Personal Use</SelectItem>
                    <SelectItem value="commercial">Commercial Use</SelectItem>
                    <SelectItem value="extended">Extended License</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* License Prices */}
            <div className="mt-4 space-y-2">
              <Label>Harga per Lisensi (opsional)</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label className="text-xs text-muted-foreground">Personal (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.license_prices.personal}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      license_prices: { ...prev.license_prices, personal: e.target.value }
                    }))}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Commercial (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.license_prices.commercial}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      license_prices: { ...prev.license_prices, commercial: e.target.value }
                    }))}
                    min="0"
                    placeholder="0"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Extended (Rp)</Label>
                  <Input
                    type="number"
                    value={formData.license_prices.extended}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      license_prices: { ...prev.license_prices, extended: e.target.value }
                    }))}
                    min="0"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Benefit (satu per baris)</Label>
            <Textarea name="benefitsInput" value={formData.benefitsInput} onChange={handleInputChange} rows={4} placeholder="Desain profesional&#10;Mudah diedit&#10;Support 24/7" />
          </div>

          {/* SEO Section */}
          <div className="border-t pt-4 mt-4">
            <div className="flex justify-between items-center mb-4">
              <Label className="text-base font-semibold">SEO Settings</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateSEO}
                disabled={seoLoading}
                className="text-purple-600 border-purple-200 hover:bg-purple-50"
              >
                {seoLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Auto-Generate SEO
              </Button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="meta_title">Meta Title</Label>
                <Input
                  id="meta_title"
                  name="meta_title"
                  value={formData.meta_title}
                  onChange={handleInputChange}
                  placeholder="Judul menarik untuk Google..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea
                  id="meta_description"
                  name="meta_description"
                  value={formData.meta_description}
                  onChange={handleInputChange}
                  rows={2}
                  placeholder="Deskripsi singkat yang muncul di hasil pencarian..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="keywords">Keywords</Label>
                <Input
                  id="keywords"
                  name="keywords"
                  value={formData.keywords}
                  onChange={handleInputChange}
                  placeholder="keyword1, keyword2, keyword3..."
                />
              </div>
            </div>
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
