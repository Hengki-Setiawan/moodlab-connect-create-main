import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Download, Package, Trash, AlertCircle, User, Mail, Calendar, Phone, LogOut, Edit, Wallet, ShoppingBag, Star, TrendingUp, Sun, Moon, ShieldCheck, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { db } from "@/lib/turso";
import { products, orders as ordersSchema, orderItems as orderItemsSchema, refundRequests } from "@/db/schema";
import { inArray, eq, desc, and } from "drizzle-orm";

interface Profile {
  full_name: string;
  phone: string;
  email?: string;
  created_at?: string;
  address?: string;
  bio?: string;
  gender?: string;
}

interface Order {
  id: string;
  total_amount: number;
  status: string;
  created_at: string;
  order_items: {
    quantity: number;
    product_id: string;
    product?: {
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
    category: string;
  };
  accessed_at: string;
}

const Profile = () => {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [purchasedProducts, setPurchasedProducts] = useState<PurchasedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hiddenProductIds, setHiddenProductIds] = useState<string[]>([]);
  const [complainProductId, setComplainProductId] = useState<string | null>(null);
  const [complainReason, setComplainReason] = useState<string>("");
  const [complainEmail, setComplainEmail] = useState<string>("");
  const [complainPhone, setComplainPhone] = useState<string>("");
  const [complainSubmitting, setComplainSubmitting] = useState<boolean>(false);

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
      .select("full_name, phone, address, bio, gender")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    // Handle case when profile doesn't exist (e.g., admin accounts)
    if (data) {
      setProfile(prev => ({
        ...prev,
        full_name: data.full_name || "",
        phone: data.phone || "",
        address: data.address || "",
        bio: data.bio || "",
        gender: data.gender || ""
      }));
    }
  };

  const fetchOrders = async (userId: string) => {
    try {
      // Fetch orders from Turso
      const ordersData = await db.query.orders.findMany({
        where: eq(ordersSchema.user_id, userId),
        orderBy: [desc(ordersSchema.created_at)],
        with: {
          // @ts-ignore - Drizzle relations might not be fully typed if not in schema relations
          // We might need to fetch items separately if relations aren't set up in schema.ts
          // Let's assume we need to fetch manually for safety or add relations.
        }
      });

      // Fetch order items manually since relations might be missing in schema export
      // Or better, let's just use raw queries or simple selects if relations are tricky

      // Let's use a simpler approach: fetch orders, then fetch all items for these orders
      const orderIds = ordersData.map(o => o.id);

      let allOrderItems: any[] = [];
      if (orderIds.length > 0) {
        allOrderItems = await db.select().from(orderItemsSchema).where(inArray(orderItemsSchema.order_id, orderIds));
      }

      // Fetch products
      const productIds = allOrderItems.map(i => i.product_id).filter((id): id is number => id !== null);
      let tursoProducts: any[] = [];
      if (productIds.length > 0) {
        tursoProducts = await db.select().from(products).where(inArray(products.id, productIds));
      }

      // Assemble the data structure
      const formattedOrders: Order[] = ordersData.map(order => {
        const items = allOrderItems.filter(i => i.order_id === order.id);
        return {
          id: order.id.toString(),
          total_amount: order.total_amount,
          status: order.status || 'pending',
          created_at: order.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
          order_items: items.map(item => {
            const p = tursoProducts.find(tp => tp.id === item.product_id);
            return {
              quantity: item.quantity,
              product_id: item.product_id.toString(),
              product: {
                name: p?.name || "Produk tidak ditemukan"
              }
            };
          })
        };
      });

      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders from Turso:", error);
      toast.error("Gagal memuat riwayat pesanan");
    }
  };

  const fetchPurchasedProducts = async (userId: string) => {
    try {
      // Fetch paid orders from Turso
      const ordersData = await db.select().from(ordersSchema)
        .where(and(
          eq(ordersSchema.user_id, userId),
          inArray(ordersSchema.status, ["paid", "completed"])
        ));

      if (ordersData.length === 0) {
        setPurchasedProducts([]);
        return;
      }

      const orderIds = ordersData.map(o => o.id);
      const items = await db.select().from(orderItemsSchema)
        .where(inArray(orderItemsSchema.order_id, orderIds));

      const productIds = items.map(i => i.product_id).filter((id): id is number => id !== null);

      if (productIds.length > 0) {
        const tursoProducts = await db.select().from(products).where(inArray(products.id, productIds));

        const mergedItems = items.map(item => {
          const order = ordersData.find(o => o.id === item.order_id);
          const p = tursoProducts.find(tp => tp.id === item.product_id);
          if (!p) return null;

          return {
            id: item.id.toString(),
            accessed_at: order?.created_at ? new Date(order.created_at).toISOString() : new Date().toISOString(),
            product_id: item.product_id.toString(),
            product: {
              id: p.id.toString(),
              name: p.name,
              description: p.description || "",
              file_url: p.file_url || null,
              image_url: p.image_url || null,
              category: p.category || ""
            }
          };
        }).filter(Boolean) as PurchasedProduct[];

        // Unique by product ID
        const uniqueByProduct = new Map<string, PurchasedProduct>();
        for (const item of mergedItems) {
          uniqueByProduct.set(item.product.id, item);
        }
        setPurchasedProducts(Array.from(uniqueByProduct.values()));
      } else {
        setPurchasedProducts([]);
      }
    } catch (error) {
      console.error("Error fetching purchased products from Turso:", error);
    }
  };

  const hideProductFromList = async (productId: string) => {
    try {
      if (!confirm('Hapus produk ini dari daftar Anda? (Tidak menghapus pembelian)')) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Silakan login terlebih dahulu');
        navigate('/auth');
        return;
      }
      // Coba simpan ke tabel user_hidden_products jika tersedia
      const { error } = await supabase
        .from('user_hidden_products')
        .insert({ user_id: user.id, product_id: productId });
      if (error) {
        console.warn('Gagal menyimpan ke user_hidden_products, gunakan fallback lokal:', error);
      }
      setHiddenProductIds((prev) => Array.from(new Set([...prev, productId])));
      toast.success('Produk dihapus dari daftar Anda');
    } catch (err) {
      console.error('Error hiding product:', err);
      toast.error('Gagal menghapus produk dari daftar');
    }
  };

  const [isRefundDialogOpen, setIsRefundDialogOpen] = useState(false);
  const [selectedOrderForRefund, setSelectedOrderForRefund] = useState<Order | null>(null);
  const [refundReason, setRefundReason] = useState("");
  const [isSubmittingRefund, setIsSubmittingRefund] = useState(false);

  const handleOpenRefundDialog = (order: Order) => {
    setSelectedOrderForRefund(order);
    setRefundReason("");
    setIsRefundDialogOpen(true);
  };

  const submitRefundRequest = async () => {
    if (!selectedOrderForRefund) return;
    setIsSubmittingRefund(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login kembali");
        return;
      }

      await db.insert(refundRequests).values({
        order_id: parseInt(selectedOrderForRefund.id),
        user_id: user.id,
        reason: refundReason,
        status: 'pending',
        item_type: 'product' // Default to product for now, or infer from items
      });

      toast.success("Permintaan refund berhasil dikirim");
      setIsRefundDialogOpen(false);
    } catch (error) {
      console.error("Error submitting refund:", error);
      toast.error("Gagal mengirim permintaan refund");
    } finally {
      setIsSubmittingRefund(false);
    }
  };

  const handleDownload = async (fileUrl: string, productName: string) => {
    try {
      if (!fileUrl) {
        toast.error("URL file tidak tersedia");
        return;
      }

      const fileName = productName.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.pdf';
      toast.loading("Sedang mengunduh file...");

      const response = await fetch(fileUrl);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
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

  const totalSpent = useMemo(() => {
    return orders
      .filter(o => o.status === 'paid' || o.status === 'completed')
      .reduce((acc, curr) => acc + curr.total_amount, 0);
  }, [orders]);

  const favoriteCategory = useMemo(() => {
    if (purchasedProducts.length === 0) return "-";
    const categories: Record<string, number> = {};
    purchasedProducts.forEach(p => {
      const cat = p.product.category || "Lainnya";
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return Object.entries(categories).sort((a, b) => b[1] - a[1])[0][0];
  }, [purchasedProducts]);

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
    <div className="min-h-screen bg-gray-50 dark:bg-background transition-colors duration-300">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-5xl">
          {/* Header Profile */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-3xl gradient-primary p-8 text-white shadow-xl mb-12"
          >
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full blur-2xl -ml-10 -mb-10 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 to-violet-500 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-tilt"></div>
                  <div className="relative w-24 h-24 bg-white rounded-full flex items-center justify-center text-4xl font-bold text-primary shadow-lg">
                    {profile.full_name ? profile.full_name.charAt(0).toUpperCase() : "U"}
                  </div>
                </div>

                <div className="text-center md:text-left">
                  <h1 className="text-3xl font-bold mb-1">
                    {profile.full_name || "Pengguna"}
                  </h1>
                  <p className="text-white/80 flex items-center justify-center md:justify-start gap-2">
                    <Mail className="w-4 h-4" /> {profile.email || "Belum ada email"}
                  </p>
                  <p className="text-white/80 flex items-center justify-center md:justify-start gap-2 mt-1">
                    <Calendar className="w-4 h-4" /> Bergabung sejak {profile.created_at ? new Date(profile.created_at).getFullYear() : "-"}
                  </p>

                  {/* Loyalty Level Badge */}
                  <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md rounded-xl border border-white/10">
                    {(() => {
                      let level = "Bronze";
                      let nextLevel = "Silver";
                      let target = 1000000;
                      let icon = <Star className="w-4 h-4 text-orange-300" />;
                      let color = "text-orange-100";

                      if (totalSpent >= 5000000) {
                        level = "Gold";
                        nextLevel = "Max";
                        target = 0;
                        icon = <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />;
                        color = "text-yellow-100 font-bold";
                      } else if (totalSpent >= 1000000) {
                        level = "Silver";
                        nextLevel = "Gold";
                        target = 5000000;
                        icon = <ShieldCheck className="w-4 h-4 text-slate-300" />;
                        color = "text-slate-100";
                      }

                      const progress = target > 0 ? (totalSpent / target) * 100 : 100;

                      return (
                        <div className="flex flex-col gap-1 w-full min-w-[200px]">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              {icon}
                              <span className={`uppercase tracking-wider text-xs ${color}`}>{level} Member</span>
                            </div>
                            {target > 0 && <span className="text-[10px] text-white/70">{Math.floor(progress)}%</span>}
                          </div>
                          {target > 0 && (
                            <div className="w-full h-1.5 bg-black/20 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-emerald-400"
                                style={{ width: `${Math.min(progress, 100)}%` }}
                              />
                            </div>
                          )}
                          {target > 0 && (
                            <p className="text-[10px] text-white/60">
                              Belanja {formatPrice(target - totalSpent)} lagi untuk {nextLevel}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                  variant="secondary"
                  size="icon"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                >
                  <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Toggle theme</span>
                </Button>
                <Button
                  onClick={() => navigate("/edit-profile")}
                  variant="secondary"
                  className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm"
                >
                  <Edit className="w-4 h-4 mr-2" /> Edit Profil
                </Button>
                <Button
                  onClick={() => {
                    supabase.auth.signOut();
                    navigate("/");
                    toast.success("Berhasil logout");
                  }}
                  variant="destructive"
                  className="bg-red-500/80 hover:bg-red-600/90 backdrop-blur-sm"
                >
                  <LogOut className="w-4 h-4 mr-2" /> Logout
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Dashboard Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 dark:text-green-400">
                    <Wallet className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
                    <p className="text-2xl font-bold gradient-text">{formatPrice(totalSpent)}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 dark:text-blue-400">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pesanan</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600 dark:text-purple-400">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Produk Dimiliki</p>
                    <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{purchasedProducts.length}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className="p-3 bg-pink-100 dark:bg-pink-900/30 rounded-full text-pink-600 dark:text-pink-400">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Kategori Favorit</p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400 capitalize truncate max-w-[120px]" title={favoriteCategory}>{favoriteCategory}</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <Tabs defaultValue="profile" className="space-y-8">
            <TabsList className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 rounded-full border border-gray-200 dark:border-gray-700 w-full max-w-md mx-auto grid grid-cols-3 shadow-sm">
              <TabsTrigger value="profile" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">Profile</TabsTrigger>
              <TabsTrigger value="orders" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">Pesanan</TabsTrigger>
              <TabsTrigger value="products" className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white transition-all duration-300">Produk Saya</TabsTrigger>
            </TabsList>

            <TabsContent value="profile">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid gap-6 md:grid-cols-2"
              >
                <Card className="overflow-hidden border-0 shadow-lg bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm hover:shadow-xl transition-all duration-300 md:col-span-2">
                  <CardHeader className="bg-gradient-to-r from-purple-500/10 to-indigo-500/10 dark:from-purple-500/20 dark:to-indigo-500/20 pb-4">
                    <CardTitle className="text-xl text-primary flex items-center gap-2">
                      <User className="w-5 h-5" /> Informasi Pribadi
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="group">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Nama Lengkap</p>
                        <p className="text-lg font-medium group-hover:text-primary transition-colors">{profile.full_name || "Belum diisi"}</p>
                      </div>
                      <div className="group">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Jenis Kelamin</p>
                        <p className="text-lg font-medium group-hover:text-primary transition-colors capitalize">{profile.gender || "Belum diisi"}</p>
                      </div>
                      <div className="group">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Nomor Telepon</p>
                        <p className="text-lg font-medium group-hover:text-primary transition-colors">{profile.phone || "Belum diisi"}</p>
                      </div>
                      <div className="group">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Email</p>
                        <p className="text-lg font-medium break-all group-hover:text-primary transition-colors">{profile.email || "Belum diisi"}</p>
                      </div>
                      <div className="group md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Alamat</p>
                        <p className="text-lg font-medium group-hover:text-primary transition-colors">{profile.address || "Belum diisi"}</p>
                      </div>
                      <div className="group md:col-span-2">
                        <p className="text-sm font-medium text-muted-foreground mb-1">Bio / Tentang Saya</p>
                        <p className="text-lg font-medium group-hover:text-primary transition-colors whitespace-pre-wrap">{profile.bio || "Belum diisi"}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </TabsContent>

            <TabsContent value="orders">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {orders.length === 0 ? (
                  <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-dashed">
                    <CardContent className="text-center py-12">
                      <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Belum ada pesanan
                      </p>
                      <Button onClick={() => navigate('/produk')} variant="link" className="mt-2 text-primary">
                        Mulai Belanja
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  orders.map((order, index) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-l-4 border-l-primary">
                        <CardHeader>
                          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div>
                              <CardTitle className="text-lg font-bold flex items-center gap-2">
                                Pesanan #{order.id.slice(0, 8)}
                              </CardTitle>
                              <CardDescription>
                                {formatDate(order.created_at)}
                              </CardDescription>
                            </div>
                            <span className={`px-4 py-1.5 rounded-full text-sm font-medium shadow-sm ${order.status === 'paid'
                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                              : order.status === 'failed'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                : order.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                                  : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                              }`}>
                              {getStatusBadge(order.status)}
                            </span>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-2 mb-4 bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
                            {order.order_items.map((item, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span>{item.product.name}</span>
                                <span className="font-mono">x{item.quantity}</span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center">
                            <p className="text-xl font-bold gradient-text">
                              Total: {formatPrice(order.total_amount)}
                            </p>
                            {order.status === 'pending' && (
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={async () => {
                                  if (!confirm('Apakah Anda yakin ingin membatalkan pesanan ini?')) return;
                                  const { data: { user } } = await supabase.auth.getUser();
                                  if (!user) return;
                                  const { error } = await supabase
                                    .from('orders')
                                    .update({ status: 'cancelled' })
                                    .eq('id', order.id)
                                    .eq('user_id', user.id);
                                  if (!error) {
                                    setOrders(orders.map(o => o.id === order.id ? { ...o, status: 'cancelled' } : o));
                                    toast.success('Pesanan dibatalkan');
                                  }
                                }}
                              >
                                Batalkan
                              </Button>
                            )}
                            {(order.status === 'paid' || order.status === 'completed') && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenRefundDialog(order)}
                              >
                                Ajukan Refund
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))
                )}
              </motion.div>

              <Dialog open={isRefundDialogOpen} onOpenChange={setIsRefundDialogOpen}>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Ajukan Refund Pesanan #{selectedOrderForRefund?.id}</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Alasan Refund</Label>
                      <Input
                        placeholder="Jelaskan alasan pengajuan refund..."
                        value={refundReason}
                        onChange={(e) => setRefundReason(e.target.value)}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Tim kami akan meninjau permintaan Anda dalam waktu 1x24 jam.
                    </p>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsRefundDialogOpen(false)}>Batal</Button>
                    <Button onClick={submitRefundRequest} disabled={isSubmittingRefund}>
                      {isSubmittingRefund ? "Mengirim..." : "Kirim Pengajuan"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>

            <TabsContent value="products">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="space-y-4"
              >
                {purchasedProducts.length === 0 ? (
                  <Card className="bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm border-dashed">
                    <CardContent className="text-center py-12">
                      <Download className="h-16 w-16 mx-auto mb-4 text-muted-foreground/50" />
                      <p className="text-muted-foreground">
                        Belum ada produk yang dibeli
                      </p>
                      <Button onClick={() => navigate('/produk')} variant="link" className="mt-2 text-primary">
                        Jelajahi Produk
                      </Button>
                    </CardContent>
                  </Card>
                ) : (
                  purchasedProducts
                    .filter((pp) => !hiddenProductIds.includes(pp.product.id))
                    .map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                      >
                        <Card className="group hover:shadow-lg transition-all duration-300 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm overflow-hidden">
                          <div className="flex flex-col md:flex-row gap-6 p-6">
                            <div className="relative w-full md:w-32 h-32 flex-shrink-0 overflow-hidden rounded-xl">
                              {item.product.image_url ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                />
                              ) : (
                                <div className="w-full h-full gradient-primary flex items-center justify-center text-white">
                                  <Package className="w-8 h-8" />
                                </div>
                              )}
                            </div>

                            <div className="flex-1 flex flex-col justify-between">
                              <div>
                                <h3 className="text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                                  {item.product.name}
                                </h3>
                                <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                                  {item.product.description}
                                </p>
                              </div>

                              <div className="flex flex-wrap gap-3">
                                <Button
                                  onClick={() => handleDownload(item.product.file_url || "", item.product.name)}
                                  disabled={!item.product.file_url}
                                  className="gradient-primary shadow-md hover:shadow-lg transition-all hover:scale-105"
                                >
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                                <Button variant="outline" onClick={() => openComplaintForm(item.product)} className="hover:bg-gray-100 dark:hover:bg-gray-700">
                                  <AlertCircle className="h-4 w-4 mr-2" /> Komplain
                                </Button>
                                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-500" onClick={() => hideProductFromList(item.product.id)}>
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>

                              {complainProductId === item.product.id && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  className="mt-6 p-6 border rounded-xl bg-gray-50 dark:bg-gray-900/50"
                                >
                                  <h4 className="font-bold mb-4 flex items-center gap-2">
                                    <AlertCircle className="w-4 h-4 text-orange-500" />
                                    Form Komplain / Pengembalian
                                  </h4>
                                  <div className="grid gap-4">
                                    <div>
                                      <Label htmlFor={`reason-${item.product.id}`}>Alasan</Label>
                                      <textarea
                                        id={`reason-${item.product.id}`}
                                        className="w-full border rounded-lg px-4 py-2 mt-1 focus:ring-2 focus:ring-primary/20 outline-none transition-all bg-white dark:bg-gray-800"
                                        rows={4}
                                        placeholder="Jelaskan masalah/alasannya..."
                                        value={complainReason}
                                        onChange={(e) => setComplainReason(e.target.value)}
                                      />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      <div>
                                        <Label htmlFor={`email-${item.product.id}`}>Email</Label>
                                        <Input
                                          id={`email-${item.product.id}`}
                                          type="email"
                                          value={complainEmail}
                                          onChange={(e) => setComplainEmail(e.target.value)}
                                          className="mt-1"
                                        />
                                      </div>
                                      <div>
                                        <Label htmlFor={`phone-${item.product.id}`}>Nomor Telepon</Label>
                                        <Input
                                          id={`phone-${item.product.id}`}
                                          type="tel"
                                          value={complainPhone}
                                          onChange={(e) => setComplainPhone(e.target.value)}
                                          className="mt-1"
                                        />
                                      </div>
                                    </div>
                                    <div className="flex gap-3 pt-2">
                                      <Button
                                        onClick={() => submitComplaint(item.product)}
                                        disabled={complainSubmitting || complainReason.trim() === ''}
                                        className="gradient-primary"
                                      >
                                        {complainSubmitting ? "Mengirim..." : "Kirim Komplain"}
                                      </Button>
                                      <Button variant="outline" onClick={() => setComplainProductId(null)}>Batal</Button>
                                    </div>
                                    <p className="text-xs text-muted-foreground">Komplain akan dikirim ke email Moodlab dan dicatat untuk ditinjau.</p>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default Profile;
