import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Package } from "lucide-react";
import Footer from "@/components/Footer";

interface Profile {
  full_name: string;
  phone: string;
  email?: string;
  created_at?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

interface PurchasedProduct {
  id: string;
  product: {
    id: string;
    name: string;
    description: string;
    file_url: string | null;
    image_url: string | null;
  };
  accessed_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      // Simpan email dan created_at dari user auth
      setProfile(prev => ({
        ...prev,
        email: user.email || "",
        created_at: user.created_at || ""
      }));

      await Promise.all([fetchProfile(user.id), fetchOrders(user.id), fetchPurchasedProducts(user.id)]);
    } catch (error) {
      console.error("Error:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data || { full_name: "", phone: "" });
  };

  const fetchOrders = async (userId: string) => {
    const { data, error } = await supabase
      .from("orders")
      .select(`
        id,
        total_amount,
        status,
        created_at,
        order_items (
          quantity,
          product:products (name)
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching orders:", error);
      return;
    }

    setOrders((data || []) as Order[]);
  };

  const fetchPurchasedProducts = async (userId: string) => {
    console.log('Fetching purchased products for user:', userId);
    
    // Ambil produk yang sudah dibeli dan pembayarannya berhasil
    const { data, error } = await supabase
      .from("order_items")
      .select(`
        id,
        order:orders!inner(
          id,
          status,
          created_at
        ),
        product:products!inner(
          id,
          name,
          description,
          file_url,
          image_url
        )
      `)
      .eq("orders.user_id", userId)
      .eq("orders.status", "berhasil") // Hanya ambil pesanan yang sudah selesai/dibayar
      .order("order.created_at", { ascending: false });

    console.log('Query result:', { data, error });

    if (error) {
      console.error("Error fetching purchased products:", error);
      return;
    }

    // Transform data untuk menyesuaikan dengan struktur PurchasedProduct
    const transformedData = (data || []).map(item => ({
      id: item.id,
      accessed_at: item.order.created_at,
      product: item.product
    }));

    console.log('Transformed purchased products:', transformedData);
    setPurchasedProducts(transformedData as PurchasedProduct[]);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profile berhasil diperbarui");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profile");
    }
  };

  const handleDownload = async (fileUrl: string, productName: string) => {
    try {
      if (!fileUrl) {
        toast.error("URL file tidak tersedia");
        return;
      }
      
      // Buat nama file yang bersih untuk download
      const fileName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      
      // Tampilkan loading toast
      toast.loading("Sedang mengunduh file...");
      
      // Lakukan fetch ke URL file dari Supabase Storage
      const response = await fetch(fileUrl);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Konversi response ke blob
      const blob = await response.blob();
      
      // Buat URL objek untuk blob
      const downloadUrl = window.URL.createObjectURL(blob);
      
      // Buat elemen anchor untuk download
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      
      // Klik anchor untuk memulai download
      a.click();
      
      // Bersihkan
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
      
      toast.dismiss();
      toast.success("File berhasil diunduh");
    } catch (error) {
      console.error("Error downloading file:", error);
      toast.dismiss();
      toast.error("Gagal mengunduh file");
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, string> = {
      pending: "Menunggu Pembayaran",
      paid: "Berhasil",
      failed: "Gagal",
      cancelled: "Dibatalkan",
    };
    return statusMap[status] || status;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 container mx-auto">
          <p className="text-center">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col md:flex-row items-center justify-between mb-12 bg-white p-6 rounded-xl shadow-sm">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
              </div>
              <div>
                <h1 className="text-2xl font-bold">
                  {profile.full_name || "Pengguna"}
                </h1>
                <p className="text-gray-500">{profile.phone || "Belum ada nomor telepon"}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => navigate("/edit-profile")} 
                variant="outline" 
                className="border-purple-500 text-purple-700 hover:bg-purple-50"
              >
                Edit Profil
              </Button>
              <Button 
                onClick={() => {
                  supabase.auth.signOut();
                  navigate("/");
                  toast.success("Berhasil logout");
                }} 
                variant="outline" 
                className="border-red-500 text-red-700 hover:bg-red-50"
              >
                Logout
              </Button>
            </div>
          </div>

          <Tabs defaultValue="profile" className="bg-white rounded-xl shadow-sm p-6">
            <TabsList className="grid w-full grid-cols-3 mb-8 bg-gray-100">
              <TabsTrigger value="profile" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">Profile</TabsTrigger>
              <TabsTrigger value="orders" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">Pesanan</TabsTrigger>
              <TabsTrigger value="products" className="data-[state=active]:bg-white data-[state=active]:text-purple-700">Produk Saya</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <div className="space-y-6">
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 pb-2">
                    <CardTitle className="text-xl text-purple-800">Informasi Pribadi</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nama Lengkap</p>
                        <p className="text-lg font-medium">{profile.full_name || "Belum diisi"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Nomor Telepon</p>
                        <p className="text-lg font-medium">{profile.phone || "Belum diisi"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="overflow-hidden border-0 shadow-md">
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100 pb-2">
                    <CardTitle className="text-xl text-purple-800">Informasi Akun</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Email</p>
                        <p className="text-lg font-medium break-all">{profile.email || "Belum diisi"}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Tanggal Bergabung</p>
                        <p className="text-lg font-medium">{profile.created_at ? formatDate(profile.created_at) : "Tidak tersedia"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="orders">
              <div className="space-y-4">
                {orders.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Belum ada pesanan
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order) => (
                    <Card key={order.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">
                              Pesanan #{order.id.slice(0, 8)}
                            </CardTitle>
                            <CardDescription>
                              {formatDate(order.created_at)}
                            </CardDescription>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm ${
                            order.status === 'paid' 
                              ? 'bg-green-100 text-green-800' 
                              : order.status === 'failed'
                              ? 'bg-red-100 text-red-800'
                              : order.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {getStatusBadge(order.status)}
                          </span>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 mb-4">
                          {order.order_items.map((item, idx) => (
                            <p key={idx} className="text-sm">
                              {item.quantity}x {item.product.name}
                            </p>
                          ))}
                        </div>
                        <p className="text-xl font-bold text-primary">
                          Total: {formatPrice(order.total_amount)}
                        </p>
                        {order.status === 'pending' && (
                          <Button 
                            variant="destructive" 
                            className="mt-4 w-full"
                            onClick={async () => {
                              try {
                                // Confirm cancellation
                                if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) {
                                  return;
                                }

                                // Get current user
                                const { data: { user }, error: userError } = await supabase.auth.getUser();
                                if (userError || !user) {
                                  toast.error('Silakan login terlebih dahulu');
                                  navigate('/auth');
                                  return;
                                }

                                // Update order status with user validation
                                const { error } = await supabase
                                  .from('orders')
                                  .update({ status: 'cancelled' })
                                  .eq('id', order.id)
                                  .eq('user_id', user.id); // Ensure user can only cancel their own orders
                                
                                if (error) {
                                  console.error('Database error:', error);
                                  throw new Error(error.message || 'Gagal mengupdate status pesanan');
                                }
                                
                                // Update local state
                                setOrders(orders.map(o => 
                                  o.id === order.id ? {...o, status: 'cancelled'} : o
                                ));
                                
                                toast.success('Pesanan berhasil dibatalkan');
                              } catch (error) {
                                console.error('Error cancelling order:', error);
                                const errorMessage = error instanceof Error ? error.message : 'Terjadi kesalahan yang tidak diketahui';
                                toast.error(`Gagal membatalkan pesanan: ${errorMessage}`);
                              }
                            }}
                          >
                            Batalkan Pesanan
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="products">
              <div className="space-y-4">
                {purchasedProducts.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Download className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">
                        Belum ada produk yang dibeli
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  purchasedProducts.map((item) => (
                    <Card key={item.id}>
                      <div className="flex gap-4 p-6">
                        {item.product.image_url ? (
                          <img
                            src={item.product.image_url}
                            alt={item.product.name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-primary rounded-lg" />
                        )}
                        
                        <div className="flex-1">
                          <h3 className="text-xl font-semibold mb-2">
                            {item.product.name}
                          </h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {item.product.description}
                          </p>
                          <Button
                            onClick={() =>
                              handleDownload(
                                item.product.file_url || "",
                                item.product.name
                              )
                            }
                            disabled={!item.product.file_url}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
       </section>
       <Footer />
    </div>
  );
};

export default Profile;
