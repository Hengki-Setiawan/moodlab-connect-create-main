import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Pencil, Trash2, Plus, PlusCircle, UserPlus } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { getImageUrl, uploadImage } from "@/integrations/supabase/storage";
import { supabaseAdmin } from "@/integrations/supabase/admin";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "template" | "ebook";
  category: string;
  image_url: string | null;
  file_url: string | null;
  stock: number;
}

const Admin = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [digitalFileUrl, setDigitalFileUrl] = useState<string>("");
  const [digitalBucket, setDigitalBucket] = useState<string>("Produk Digital");
  const [digitalFolder, setDigitalFolder] = useState<string>("uploads");
  const [digitalFiles, setDigitalFiles] = useState<string[]>([]);
  const [digitalUploading, setDigitalUploading] = useState<boolean>(false);
  const [digitalSelectedName, setDigitalSelectedName] = useState<string | null>(null);
  const [digitalLoading, setDigitalLoading] = useState<boolean>(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Gunakan RPC has_role agar tidak terblokir RLS
      const { data: hasRole, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error || hasRole !== true) {
        toast.error("Anda tidak memiliki akses admin");
        navigate("/");
        return;
      }

      setIsAdmin(true);
      fetchProducts();
    } catch (error) {
      console.error("Error checking admin status:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Upload gambar baru bila ada
      let uploadedImageUrl: string | null = null;
      if (imageFile) {
        const imageData = await uploadImage(imageFile);
        uploadedImageUrl = imageData?.url || null;
      }

      if (isEditing && currentProduct.id) {
        const { error } = await supabase
          .from("products")
          .update({
            name: currentProduct.name,
            description: currentProduct.description,
            price: currentProduct.price,
            type: currentProduct.type,
            category: currentProduct.category,
            stock: currentProduct.stock,
            image_url: uploadedImageUrl ?? currentProduct.image_url ?? null,
            file_url: digitalFileUrl || currentProduct.file_url || null,
          })
          .eq("id", currentProduct.id);

        if (error) throw error;
        toast.success("Produk berhasil diperbarui");
      } else {
        const { error } = await supabase
          .from("products")
          .insert({
            name: currentProduct.name,
            description: currentProduct.description,
            price: currentProduct.price,
            type: currentProduct.type,
            category: currentProduct.category,
            stock: currentProduct.stock || -1,
            image_url: uploadedImageUrl,
            file_url: digitalFileUrl || null,
          });

        if (error) throw error;
        toast.success("Produk berhasil ditambahkan");
      }

      setCurrentProduct({});
      setIsEditing(false);
      setImageFile(null);
      setImagePreview("");
      setDigitalFileUrl("");
      fetchProducts();
    } catch (error) {
      console.error("Error saving product:", error);
      toast.error("Gagal menyimpan produk");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Apakah Anda yakin ingin menghapus produk ini?")) return;

    try {
      const { error } = await supabase
        .from("products")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Produk berhasil dihapus");
      fetchProducts();
    } catch (error) {
      console.error("Error deleting product:", error);
      toast.error("Gagal menghapus produk");
    }
  };

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsEditing(true);
    setImageFile(null);
    setImagePreview("");
    // Set default bucket & folder untuk file digital saat edit
    setDigitalBucket('Produk Digital');
    setDigitalFolder('uploads');
    setDigitalFileUrl(product.file_url || "");

    // Jika ada file_url sebelumnya, coba ekstrak nama file untuk ditampilkan
    try {
      if (product.file_url) {
        const url = new URL(product.file_url);
        const segments = url.pathname.split('/').filter(Boolean);
        const last = segments[segments.length - 1];
        if (last) setDigitalSelectedName(last);
      } else {
        setDigitalSelectedName(null);
      }
    } catch {
      // Abaikan parsing error
      setDigitalSelectedName(null);
    }

    // Auto-load daftar file dari Storage pada folder default
    (async () => {
      try {
        setDigitalLoading(true);
        const { data, error } = await supabaseAdmin
          .storage
          .from('Produk Digital')
          .list('uploads', { limit: 100, sortBy: { column: 'name', order: 'asc' } });
        if (error) throw error;
        setDigitalFiles((data || []).map((d: any) => d.name));
      } catch (err) {
        console.error('Error auto-load digital files saat edit:', err);
      } finally {
        setDigitalLoading(false);
      }
    })();
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const resolveImageUrl = (url: string | null) => {
    if (!url) return "/placeholder.svg";
    const isHttp = /^https?:\/\//.test(url);
    if (isHttp) return url;
    return getImageUrl(url) || "/placeholder.svg";
  };

  const handleImageChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran gambar maksimal 2MB");
      return;
    }
    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(String(reader.result));
    reader.readAsDataURL(file);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">Memuat...</div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-32">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Akses Ditolak</h1>
            <p>Anda tidak memiliki izin untuk mengakses halaman ini.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <AdminNavbar />

      <section className="pt-32 pb-20 px-4 ml-64">
        <div className="container mx-auto max-w-6xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">
            Dashboard <span className="gradient-text">Admin</span>
          </h1>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link to="/admin?tab=add">
              <Button className="w-full h-20 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg">
                <PlusCircle className="mr-2 h-6 w-6" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold">Tambah Produk</span>
                  <span className="text-xs opacity-80">Tambahkan produk baru</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/admin?tab=products">
              <Button className="w-full h-20 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700 text-white shadow-lg">
                <Trash2 className="mr-2 h-6 w-6" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold">Kelola Produk</span>
                  <span className="text-xs opacity-80">Edit atau hapus produk</span>
                </div>
              </Button>
            </Link>
            
            <Link to="/admin/users">
              <Button className="w-full h-20 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white shadow-lg">
                <UserPlus className="mr-2 h-6 w-6" />
                <div className="flex flex-col items-start">
                  <span className="text-lg font-bold">Tambah Admin</span>
                  <span className="text-xs opacity-80">Kelola akses admin</span>
                </div>
              </Button>
            </Link>
          </div>

          <Tabs defaultValue="products">
            <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-12">
              <TabsTrigger value="products">Kelola Produk</TabsTrigger>
              <TabsTrigger value="add">Tambah Produk</TabsTrigger>
            </TabsList>

            <TabsContent value="products">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <Card key={product.id}>
                    {product.image_url ? (
                      <div className="aspect-video w-full">
                        <img
                          src={resolveImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover rounded-t-lg"
                        />
                      </div>
                    ) : (
                      <div className="aspect-video w-full bg-gradient-primary rounded-t-lg" />
                    )}
                    <CardHeader>
                      <CardTitle className="text-xl">{product.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {product.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold text-primary mb-2">
                        {formatPrice(product.price)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Stok: {product.stock === -1 ? "Unlimited" : product.stock}
                      </p>
                    </CardContent>
                    <CardFooter className="flex gap-2">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleEdit(product)}
                      >
                        <Pencil className="h-4 w-4 mr-2" />
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        className="flex-1"
                        onClick={() => handleDelete(product.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Hapus
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="add">
              <Card className="max-w-2xl mx-auto">
                <CardHeader>
                  <CardTitle>
                    {isEditing ? "Edit Produk" : "Tambah Produk Baru"}
                  </CardTitle>
                  <CardDescription>
                    {isEditing
                      ? "Perbarui informasi produk"
                      : "Lengkapi formulir untuk menambahkan produk"}
                  </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit}>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nama Produk</Label>
                      <Input
                        id="name"
                        required
                        value={currentProduct.name || ""}
                        onChange={(e) =>
                          setCurrentProduct({ ...currentProduct, name: e.target.value })
                        }
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Deskripsi</Label>
                      <Textarea
                        id="description"
                        required
                        rows={4}
                        value={currentProduct.description || ""}
                        onChange={(e) =>
                          setCurrentProduct({
                            ...currentProduct,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Harga (Rp)</Label>
                        <Input
                          id="price"
                          type="number"
                          required
                          min="0"
                          value={currentProduct.price || ""}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              price: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="stock">Stok (-1 = Unlimited)</Label>
                        <Input
                          id="stock"
                          type="number"
                          value={currentProduct.stock || -1}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              stock: parseInt(e.target.value),
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="type">Tipe Produk</Label>
                        <Select
                          value={currentProduct.type}
                          onValueChange={(value: "template" | "ebook") =>
                            setCurrentProduct({ ...currentProduct, type: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Pilih tipe" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="template">Template</SelectItem>
                            <SelectItem value="ebook">E-book</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Kategori</Label>
                        <Input
                          id="category"
                          required
                          value={currentProduct.category || ""}
                          onChange={(e) =>
                            setCurrentProduct({
                              ...currentProduct,
                              category: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Gambar Produk (opsional)</Label>
                      <Input id="image" type="file" accept="image/*" onChange={handleImageChange} />
                      {imagePreview || currentProduct.image_url ? (
                        <div className="mt-2">
                          <p className="text-xs text-muted-foreground">Preview:</p>
                          <div className="relative w-full h-40 border rounded-md overflow-hidden">
                            <img
                              src={imagePreview || resolveImageUrl(currentProduct.image_url || null)}
                              alt="Preview"
                              className="w-full h-full object-contain"
                            />
                          </div>
                        </div>
                      ) : null}
                    </div>

                    {(currentProduct.type === "ebook" || currentProduct.type === "template") && (
                      <div className="space-y-3">
                        <Label>File Digital</Label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <Label className="text-xs">Upload File ke Storage</Label>
                            <Input id="digital-upload" type="file" accept="application/pdf,application/zip,application/octet-stream" onChange={handleDigitalUpload} disabled={digitalUploading} />
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
                          <Input id="file_url" value={digitalFileUrl} onChange={(e) => setDigitalFileUrl(e.target.value)} placeholder="https://..." />
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
                  </CardContent>
                  <CardFooter className="flex gap-2">
                    {isEditing && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setCurrentProduct({});
                          setIsEditing(false);
                        }}
                      >
                        Batal
                      </Button>
                    )}
                    <Button type="submit" className="flex-1">
                      <Plus className="h-4 w-4 mr-2" />
                      {isEditing ? "Update Produk" : "Tambah Produk"}
                    </Button>
                  </CardFooter>
                </form>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </section>
    </div>
  );
};

export default Admin;
