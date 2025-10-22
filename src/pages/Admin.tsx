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

      const { data: roleData, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !roleData) {
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
          });

        if (error) throw error;
        toast.success("Produk berhasil ditambahkan");
      }

      setCurrentProduct({});
      setIsEditing(false);
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
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
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

      <section className="pt-32 pb-20 px-4">
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
                          src={product.image_url}
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
