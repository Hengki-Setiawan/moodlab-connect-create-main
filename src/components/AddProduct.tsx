import React, { useState, useEffect } from 'react';
import { adminCreateRecord } from '@/integrations/supabase/admin';
import { uploadImage } from '@/integrations/supabase/storage';
import { supabaseAdmin } from '@/integrations/supabase/admin';
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
  const [digitalFileUrl, setDigitalFileUrl] = useState('');
  const [digitalBucket, setDigitalBucket] = useState('Produk Digital');
  const [digitalFolder, setDigitalFolder] = useState('uploads');
  const [digitalFiles, setDigitalFiles] = useState<string[]>([]);
  const [digitalUploading, setDigitalUploading] = useState(false);
  const [digitalSelectedName, setDigitalSelectedName] = useState<string | null>(null);
  const [digitalLoading, setDigitalLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    benefitsText: '',
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
      const benefits = (formData.benefitsText || '')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean);

      const productData: any = {
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock || '0', 10),
        type: formData.type,
        category: formData.category,
        image_url: null,
        file_url: null,
        benefits: benefits.length > 0 ? benefits : null
      };

      // Upload gambar jika ada
      if (imageFile) {
        const imageData = await uploadImage(imageFile);
        if (imageData) {
          productData.image_url = imageData.url;
        }
      }

      // Set file digital bila ada dan tipe digital
      if ((formData.type === 'ebook' || formData.type === 'template') && digitalFileUrl) {
        productData.file_url = digitalFileUrl;
      }

      // Simpan produk ke database
      const newProduct = await adminCreateRecord('products', productData);
      
      if (newProduct) {
        toast.success('Produk berhasil ditambahkan!');
        // Reset form
        setFormData({
          name: '',
          description: '',
          benefitsText: '',
          price: '',
          stock: '',
          type: 'template',
          category: 'design'
        });
        setImageFile(null);
        setImagePreview('');
        setDigitalFileUrl('');
      }
    } catch (error) {
      console.error('Error adding product:', error);
      toast.error('Gagal menambahkan produk. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleDigitalUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setDigitalUploading(true);
      const path = `${digitalFolder}/${Date.now()}_${file.name}`;
      const { error } = await supabaseAdmin.storage.from(digitalBucket).upload(path, file, { upsert: false });
      if (error) throw error;
      const { data } = await supabaseAdmin.storage.from(digitalBucket).getPublicUrl(path);
      setDigitalFileUrl(data.publicUrl);
      const name = path.split('/').pop() || file.name;
      setDigitalSelectedName(name);
      toast.success('File digital diupload');
    } catch (err) {
      console.error('Error upload digital file:', err);
      toast.error('Gagal upload file digital');
    } finally {
      setDigitalUploading(false);
      e.target.value = '';
    }
  };

  const loadDigitalFiles = async () => {
    try {
      setDigitalLoading(true);
      const { data, error } = await supabaseAdmin.storage.from(digitalBucket).list(digitalFolder, { limit: 100, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      setDigitalFiles((data || []).map((d: any) => d.name));
      toast.success('Daftar file dimuat');
    } catch (err) {
      console.error('Error list digital files:', err);
      toast.error('Gagal memuat daftar file');
    } finally {
      setDigitalLoading(false);
    }
  };

  const handleDigitalClear = () => {
    setDigitalFileUrl('');
    setDigitalSelectedName(null);
    toast.success('Link file digital dibersihkan');
  };

  const handleDigitalDelete = async () => {
    try {
      if (!digitalSelectedName) {
        toast.error('Pilih file dari Storage terlebih dahulu');
        return;
      }
      const confirmed = window.confirm(`Hapus file "${digitalSelectedName}" dari Storage?`);
      if (!confirmed) return;
      const path = `${digitalFolder}/${digitalSelectedName}`;
      const { error } = await supabaseAdmin.storage.from(digitalBucket).remove([path]);
      if (error) throw error;
      toast.success('File dihapus dari Storage');
      setDigitalSelectedName(null);
      setDigitalFileUrl('');
      await loadDigitalFiles();
    } catch (err) {
      console.error('Gagal hapus file digital:', err);
      toast.error('Gagal menghapus file digital');
    }
  };

  const handleCopyDigitalLink = async () => {
    try {
      if (!digitalFileUrl) {
        toast.error('Tidak ada URL untuk disalin');
        return;
      }
      await navigator.clipboard.writeText(digitalFileUrl);
      toast.success('URL disalin ke clipboard');
    } catch (err) {
      console.error('Gagal menyalin URL:', err);
      toast.error('Gagal menyalin URL');
    }
  };

  const handleOpenDigitalLink = () => {
    if (!digitalFileUrl) {
      toast.error('Tidak ada URL untuk dibuka');
      return;
    }
    window.open(digitalFileUrl, '_blank');
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
                <Label htmlFor="benefitsText">Benefit (satu baris = satu poin)</Label>
                <Textarea
                  id="benefitsText"
                  name="benefitsText"
                  value={formData.benefitsText}
                  onChange={handleInputChange}
                  placeholder={"Contoh:\n• File siap pakai\n• Desain profesional\n• Panduan penggunaan"}
                  rows={4}
                />
                <p className="text-xs text-muted-foreground mt-1">Poin-poin ini akan ditampilkan di bagian “Apa yang Anda Dapatkan”.</p>
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

              {(formData.type === 'ebook' || formData.type === 'template') && (
                <div className="space-y-3">
                  <Label>File Digital</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs">Upload File ke Storage</Label>
                      <Input type="file" accept="application/pdf,application/zip,application/octet-stream" onChange={handleDigitalUpload} disabled={digitalUploading} />
                      {digitalUploading && (
                        <p className="text-xs text-muted-foreground mt-1">Mengunggah...</p>
                      )}
                    </div>
                    <div>
                      <Label className="text-xs">Ambil dari Storage</Label>
                      <div className="flex gap-2">
                        <Select value={digitalBucket} onValueChange={setDigitalBucket}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih bucket" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Produk Digital">Produk Digital</SelectItem>
                            <SelectItem value="Gambar">Gambar</SelectItem>
                          </SelectContent>
                        </Select>
                        <Select value={digitalFolder} onValueChange={setDigitalFolder}>
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih folder" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="uploads">uploads</SelectItem>
                            <SelectItem value="products">products</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button type="button" variant="outline" onClick={loadDigitalFiles} disabled={digitalLoading}>
                          {digitalLoading ? 'Memuat...' : 'Refresh'}
                        </Button>
                        <Button type="button" variant="outline" onClick={handleDigitalClear}>Clear Link</Button>
                        <Button type="button" variant="destructive" onClick={handleDigitalDelete} disabled={!digitalSelectedName}>Hapus File</Button>
                      </div>
                      {digitalFiles.length > 0 && (
                        <div className="mt-2">
                          <Select onValueChange={(name) => {
                            const path = `${digitalFolder}/${name}`;
                            const { data } = supabaseAdmin.storage.from(digitalBucket).getPublicUrl(path);
                            setDigitalFileUrl(data.publicUrl);
                            setDigitalSelectedName(name);
                          }}>
                            <SelectTrigger>
                              <SelectValue placeholder="Pilih file" />
                            </SelectTrigger>
                            <SelectContent>
                              {digitalFiles.map((n) => (
                                <SelectItem key={n} value={n}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">URL File Digital (public)</Label>
                    <Input value={digitalFileUrl} onChange={(e) => setDigitalFileUrl(e.target.value)} placeholder="https://..." />
                    <p className="text-xs text-muted-foreground mt-1">URL ini akan disimpan sebagai file_url. Gunakan public URL dari Storage agar pembeli bisa mengunduh dari halaman Profil.</p>
                    <div className="flex gap-2 mt-2">
                      <Button type="button" variant="outline" onClick={handleOpenDigitalLink} disabled={!digitalFileUrl}>Buka</Button>
                      <Button type="button" variant="outline" onClick={handleCopyDigitalLink} disabled={!digitalFileUrl}>Copy URL</Button>
                      {digitalSelectedName && (
                        <span className="text-xs text-muted-foreground self-center">Dipilih: {digitalSelectedName}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
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
