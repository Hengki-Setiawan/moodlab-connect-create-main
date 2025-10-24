import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Trash, Edit, Package, Users, ShoppingCart, FileText } from "lucide-react";
import { Footer } from "@/components/Footer";
import AdminNavbar from "@/components/AdminNavbar";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import UsersManagement from "@/components/admin/UsersManagement";
import ServicesManagement from "@/components/admin/ServicesManagement";

interface User {
  id: string;
  email: string;
  role: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  type: string;
  category: string;
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total: number;
  created_at: string;
}

interface Consultation {
  id: string;
  name: string;
  email: string;
  service_type: string;
  status: string;
  created_at: string;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<{
    viewsByDay: { date: string; count: number }[];
    topPages: { path: string; count: number }[];
    topReferrers: { referrer: string; count: number }[];
  }>({ viewsByDay: [], topPages: [], topReferrers: [] });
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  // Tambahan state untuk filter tanggal
  const [dateRange, setDateRange] = useState<'7d' | '30d' | 'all' | 'custom'>('7d');
  const [customStart, setCustomStart] = useState<string>('');
  const [customEnd, setCustomEnd] = useState<string>('');
  // Pencarian produk
  const [searchTerm, setSearchTerm] = useState<string>('');
  // Edit produk
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [editingData, setEditingData] = useState<{ name: string; price: number; type: string; category: string }>({ name: '', price: 0, type: '', category: '' });
  // Edit status konsultasi
  const [editingConsultId, setEditingConsultId] = useState<string | null>(null);
  const [editingConsultStatus, setEditingConsultStatus] = useState<string>('pending');
  // Konten halaman
  const [homeContent, setHomeContent] = useState<{ hero_badge: string; hero_title: string; hero_subtitle: string }>({ hero_badge: "", hero_title: "", hero_subtitle: "" });
  const [aboutContent, setAboutContent] = useState<{ hero_title: string; hero_subtitle: string }>({ hero_title: "", hero_subtitle: "" });
  const [loadingPages, setLoadingPages] = useState(false);
  // Sinkronisasi tab dengan query param ?tab=
  const [tab, setTab] = useState<string>(new URLSearchParams(location.search).get('tab') || 'products');
  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t && t !== tab) setTab(t);
  }, [location.search]);

  // Storage state
  const [buckets, setBuckets] = useState<{ id: string; name: string; public?: boolean }[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [storageFiles, setStorageFiles] = useState<{ name: string; id?: string; updated_at?: string; created_at?: string }[]>([]);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);

  const loadBuckets = async () => {
    try {
      const { data, error } = await supabaseAdmin.storage.listBuckets();
      if (error) throw error;
      setBuckets(data || []);
      if (!selectedBucket && data && data.length > 0) {
        setSelectedBucket(data[0].name);
      }
    } catch (err) {
      console.error('Error listing buckets:', err);
    }
  };

  const loadFiles = async (bucket: string) => {
    try {
      setLoadingStorage(true);
      const { data, error } = await supabaseAdmin.storage.from(bucket).list('', { limit: 100, offset: 0, sortBy: { column: 'name', order: 'asc' } });
      if (error) throw error;
      setStorageFiles(data || []);
    } catch (err) {
      console.error('Error listing files:', err);
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (tab === 'storage') {
      loadBuckets();
    }
  }, [tab]);

  useEffect(() => {
    if (tab === 'storage' && selectedBucket) {
      loadFiles(selectedBucket);
    }
  }, [tab, selectedBucket]);

  const handleBucketSelect = (name: string) => {
    setSelectedBucket(name);
  };

  const handleUpload: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    if (!selectedBucket) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const path = `uploads/${Date.now()}_${file.name}`;
        const { error } = await supabaseAdmin.storage.from(selectedBucket).upload(path, file, { upsert: false });
        if (error) throw error;
      }
      await loadFiles(selectedBucket);
    } catch (err) {
      console.error('Error uploading files:', err);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const removeFile = async (path: string) => {
    if (!selectedBucket) return;
    try {
      const { error } = await supabaseAdmin.storage.from(selectedBucket).remove([path]);
      if (error) throw error;
      await loadFiles(selectedBucket);
    } catch (err) {
      console.error('Error removing file:', err);
    }
  };

  const getSignedUrl = async (path: string) => {
    if (!selectedBucket) return;
    try {
      const { data, error } = await supabaseAdmin.storage.from(selectedBucket).createSignedUrl(path, 300);
      if (error) throw error;
      if (data?.signedUrl) {
        navigator.clipboard.writeText(data.signedUrl);
        alert('Signed URL disalin ke clipboard');
      }
    } catch (err) {
      console.error('Error creating signed URL:', err);
    }
  };

  useEffect(() => {
    checkUserRole();
    fetchData();
    fetchAnalytics();
    loadPageContents();
  }, []);

  const checkUserRole = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      // Cek role admin atau moderator via RPC has_role agar tidak terblokir RLS
      const { data: isAdmin, error: errAdmin } = await supabase.rpc('has_role', {
        _user_id: session.user.id,
        _role: 'admin',
      });

      let role: 'admin' | 'moderator' | null = null;
      if (!errAdmin && isAdmin === true) {
        role = 'admin';
      } else {
        const { data: isModerator, error: errModerator } = await supabase.rpc('has_role', {
          _user_id: session.user.id,
          _role: 'moderator',
        });
        if (!errModerator && isModerator === true) {
          role = 'moderator';
        }
      }

      if (!role) {
        navigate("/profile");
        return;
      }

      setUser({
        id: session.user.id,
        email: session.user.email || "",
        role,
      });
    } catch (error) {
      console.error("Error checking user role:", error);
      navigate("/profile");
    }
  };

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch products
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (productsError) throw productsError;
      setProducts(productsData || []);

      // Fetch orders
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });

      if (ordersError) throw ordersError;
      setOrders(ordersData || []);

      // Fetch consultations
      const { data: consultationsData, error: consultationsError } = await supabase
        .from("consultations")
        .select("*")
        .order("created_at", { ascending: false });

      if (consultationsError) throw consultationsError;
      setConsultations(consultationsData || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      let query = supabase
        .from("page_views")
        .select("*");

      const now = new Date();
      // Terapkan filter tanggal berdasarkan pilihan
      if (dateRange === '7d') {
        const from = new Date();
        from.setDate(now.getDate() - 6); // 7 hari termasuk hari ini
        query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', now.toISOString());
      } else if (dateRange === '30d') {
        const from = new Date();
        from.setDate(now.getDate() - 29); // 30 hari termasuk hari ini
        query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', now.toISOString());
      } else if (dateRange === 'custom') {
        if (customStart && customEnd) {
          const from = new Date(customStart);
          const to = new Date(customEnd);
          // inklusif sampai akhir hari end
          const endOfDay = new Date(to.getTime());
          endOfDay.setHours(23, 59, 59, 999);
          query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', endOfDay.toISOString());
        }
      }

      const { data, error } = await query
        .order("viewed_at", { ascending: false })
        .limit(2000);

      if (error) throw error;

      const byDay = new Map<string, number>();
      const pages = new Map<string, number>();
      const refs = new Map<string, number>();

      (data || []).forEach((v: any) => {
        const day = new Date(v.viewed_at).toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);

        const p = v.path || "/";
        pages.set(p, (pages.get(p) || 0) + 1);

        const r = v.referrer || "direct";
        refs.set(r, (refs.get(r) || 0) + 1);
      });

      const viewsByDay = Array.from(byDay.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, count]) => ({ date, count }));

      const topPages = Array.from(pages.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([path, count]) => ({ path, count }));

      const topReferrers = Array.from(refs.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([referrer, count]) => ({ referrer, count }));

      setAnalytics({ viewsByDay, topPages, topReferrers });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  const loadPageContents = async () => {
    try {
      setLoadingPages(true);
      const { data, error } = await supabase
        .from("page_contents")
        .select("page, content")
        .in("page", ["home", "about"]);
      if (error) throw error;
      (data || []).forEach((row: { page: string; content: any }) => {
        if (row.page === "home") {
          setHomeContent({
            hero_badge: row.content?.hero_badge || "",
            hero_title: row.content?.hero_title || "",
            hero_subtitle: row.content?.hero_subtitle || "",
          });
        }
        if (row.page === "about") {
          setAboutContent({
            hero_title: row.content?.hero_title || "",
            hero_subtitle: row.content?.hero_subtitle || "",
          });
        }
      });
    } catch (err) {
      console.error("Error loadPageContents:", err);
    } finally {
      setLoadingPages(false);
    }
  };

  const saveHomeContent = async () => {
    try {
      const { error } = await supabaseAdmin
        .from("page_contents")
        .upsert({ page: "home", content: homeContent });
      if (error) throw error;
    } catch (err) {
      console.error("Error saveHomeContent:", err);
    }
  };

  const saveAboutContent = async () => {
    try {
      const { error } = await supabaseAdmin
        .from("page_contents")
        .upsert({ page: "about", content: aboutContent });
      if (error) throw error;
    } catch (err) {
      console.error("Error saveAboutContent:", err);
    }
  };

  // Export data mentah ke CSV berdasarkan filter saat ini
  const exportAnalyticsCSV = async () => {
    try {
      let query = supabase
        .from('page_views')
        .select('*');

      const now = new Date();
      if (dateRange === '7d') {
        const from = new Date();
        from.setDate(now.getDate() - 6);
        query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', now.toISOString());
      } else if (dateRange === '30d') {
        const from = new Date();
        from.setDate(now.getDate() - 29);
        query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', now.toISOString());
      } else if (dateRange === 'custom') {
        if (customStart && customEnd) {
          const from = new Date(customStart);
          const to = new Date(customEnd);
          const endOfDay = new Date(to.getTime());
          endOfDay.setHours(23, 59, 59, 999);
          query = query.gte('viewed_at', from.toISOString()).lte('viewed_at', endOfDay.toISOString());
        }
      }

      const { data, error } = await query.order('viewed_at', { ascending: true }).limit(10000);
      if (error) throw error;

      const rows = (data || []) as any[];
      const headers = ['id', 'path', 'user_id', 'referrer', 'user_agent', 'viewed_at'];
      const csv = [
        headers.join(','),
        ...rows.map(r => headers.map(h => {
          const val = r[h];
          if (val === null || val === undefined) return '';
          const s = String(val).replace(/"/g, '""');
          if (s.includes(',') || s.includes('\n') || s.includes('"')) return `"${s}"`;
          return s;
        }).join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `page_views_${dateRange === 'custom' ? `${customStart}_${customEnd}` : dateRange}.csv`;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting CSV:', err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  // Filter produk berdasarkan searchTerm
  const displayedProducts = products.filter((p) =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const startEditProduct = (p: Product) => {
    setEditingProductId(p.id);
    setEditingData({ name: p.name ?? '', price: p.price ?? 0, type: p.type ?? '', category: p.category ?? '' });
  };

  const cancelEditProduct = () => {
    setEditingProductId(null);
  };

  const saveEditProduct = async () => {
    if (!editingProductId) return;
    try {
      const payload = { ...editingData };
      const { error } = await supabaseAdmin
        .from('products')
        .update(payload)
        .eq('id', editingProductId);
      if (error) throw error;
      console.log('Produk diperbarui');
      setProducts(prev => prev.map(p => p.id === editingProductId ? { ...p, ...payload } as Product : p));
      setEditingProductId(null);
    } catch (err) {
      console.error('Gagal menyimpan perubahan produk:', err);
    }
  };

  // Edit status konsultasi
  const startEditConsultation = (c: Consultation) => {
    setEditingConsultId(c.id);
    setEditingConsultStatus(c.status || 'pending');
  };

  const cancelEditConsultation = () => {
    setEditingConsultId(null);
  };

  const saveEditConsultation = async () => {
    if (!editingConsultId) return;
    try {
      const { error } = await supabaseAdmin
        .from('consultations')
        .update({ status: editingConsultStatus })
        .eq('id', editingConsultId);
      if (error) throw error;
      setConsultations(prev => prev.map(c => c.id === editingConsultId ? { ...c, status: editingConsultStatus } : c));
      setEditingConsultId(null);
    } catch (err) {
      console.error('Gagal menyimpan status konsultasi:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 ml-64">
      <AdminNavbar />
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{user?.email}</span>
            <Button variant="outline" onClick={() => navigate("/")}>
              Kembali ke Website
            </Button>
            <Button variant="outline" onClick={() => {
              supabase.auth.signOut();
              navigate("/");
            }}>
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Produk</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{products.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Pesanan</CardTitle>
              <ShoppingCart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{orders.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Permintaan Konsultasi</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{consultations.length}</div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={(v) => { setTab(v); navigate(`/admin-dashboard?tab=${v}`, { replace: true }); }} className="w-full">
          <TabsList className="grid grid-cols-8 w-full">
              <TabsTrigger value="products">Produk</TabsTrigger>
              <TabsTrigger value="orders">Pesanan</TabsTrigger>
              <TabsTrigger value="consultations">Konsultasi</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="storage">Storage</TabsTrigger>
              <TabsTrigger value="users">Users</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
            </TabsList>

          {/* Storage */}
          <TabsContent value="storage">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Kelola Storage</h2>
              <div className="flex gap-2 items-center">
                <Select value={selectedBucket} onValueChange={handleBucketSelect}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Pilih bucket" />
                  </SelectTrigger>
                  <SelectContent>
                    {buckets.length === 0 ? (
                      <SelectItem value="" disabled>Tidak ada bucket</SelectItem>
                    ) : (
                      buckets.map((b) => (
                        <SelectItem key={b.name} value={b.name}>{b.name}</SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <Button variant="outline" disabled={!selectedBucket || loadingStorage} onClick={() => selectedBucket && loadFiles(selectedBucket)}>Refresh</Button>
              </div>
            </div>

            <div className="mb-4">
              <input type="file" multiple onChange={handleUpload} disabled={!selectedBucket || uploading} />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {loadingStorage ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Memuat...</td>
                      </tr>
                    ) : storageFiles.length === 0 ? (
                      <tr>
                        <td colSpan={2} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada file</td>
                      </tr>
                    ) : (
                      storageFiles.map((f) => (
                        <tr key={f.name}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{f.name}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                            <div className="flex gap-2 justify-end">
                              <Button variant="outline" onClick={() => getSignedUrl(f.name)}>Copy URL</Button>
                              <Button variant="destructive" onClick={() => removeFile(f.name)}>Hapus</Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="products">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Daftar Produk</h2>
              <div className="flex gap-2">
                <Button onClick={() => navigate("/add-product")}>
                  <Plus className="mr-2 h-4 w-4" /> Tambah Produk
                </Button>
                <Button variant="outline" onClick={() => navigate("/delete-products")}>
                  <Trash className="mr-2 h-4 w-4" /> Hapus Produk
                </Button>
              </div>
            </div>

            {/* Pencarian produk */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Cari produk berdasarkan nama..."
                className="w-full md:w-1/2 border rounded px-3 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Harga</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipe</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal Dibuat</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {displayedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                          Tidak ada produk
                        </td>
                      </tr>
                    ) : (
                      displayedProducts.map((product) => (
                        <tr key={product.id}>
                          {editingProductId === product.id ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                <input className="border rounded px-2 py-1 w-full" value={editingData.name} onChange={(e) => setEditingData({ ...editingData, name: e.target.value })} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">
                                <input type="number" className="border rounded px-2 py-1 w-full" value={editingData.price} onChange={(e) => setEditingData({ ...editingData, price: Number(e.target.value) })} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                <input className="border rounded px-2 py-1 w-full" value={editingData.type} onChange={(e) => setEditingData({ ...editingData, type: e.target.value })} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                <input className="border rounded px-2 py-1 w-full" value={editingData.category} onChange={(e) => setEditingData({ ...editingData, category: e.target.value })} />
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(product.created_at)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={cancelEditProduct}>Batal</Button>
                                <Button size="sm" onClick={saveEditProduct}>Simpan</Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{product.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatPrice(product.price)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{product.type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{product.category}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(product.created_at)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => startEditProduct(product)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="orders">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Daftar Pesanan</h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {orders.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada pesanan</td>
                      </tr>
                    ) : (
                      orders.map((order) => (
                        <tr key={order.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{order.id}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(order.total)}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{order.status}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(order.created_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="consultations">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Permintaan Konsultasi</h2>
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nama</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Layanan</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tanggal</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {consultations.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">Tidak ada konsultasi</td>
                      </tr>
                    ) : (
                      consultations.map((c) => (
                        <tr key={c.id}>
                          {editingConsultId === c.id ? (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{c.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{c.service_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">
                                <Select value={editingConsultStatus} onValueChange={(v) => setEditingConsultStatus(v)}>
                                  <SelectTrigger className="w-[160px]">
                                    <SelectValue placeholder="Pilih status" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="contacted">Contacted</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(c.created_at)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex gap-2 justify-end">
                                <Button variant="outline" size="sm" onClick={cancelEditConsultation}>Batal</Button>
                                <Button size="sm" onClick={saveEditConsultation}>Simpan</Button>
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">{c.name}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{c.email}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{c.service_type}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{c.status}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm">{formatDate(c.created_at)}</td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button variant="ghost" size="sm" onClick={() => startEditConsultation(c)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </td>
                            </>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Analytics</h2>
              <div className="flex gap-2">
                <Button variant="outline" onClick={exportAnalyticsCSV} disabled={loadingAnalytics}>
                  <FileText className="mr-2 h-4 w-4" /> Export CSV
                </Button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium mb-2">Rentang Tanggal</label>
                <Select value={dateRange} onValueChange={(v) => setDateRange(v as any)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih rentang" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7d">7 Hari</SelectItem>
                    <SelectItem value="30d">30 Hari</SelectItem>
                    <SelectItem value="all">Semua</SelectItem>
                    <SelectItem value="custom">Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {dateRange === 'custom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Mulai</label>
                    <input type="date" className="border rounded px-3 py-2 w-full" value={customStart} onChange={(e) => setCustomStart(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Selesai</label>
                    <input type="date" className="border rounded px-3 py-2 w-full" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} />
                  </div>
                </>
              )}
              <div className="flex items-end">
                <Button onClick={fetchAnalytics} disabled={loadingAnalytics} className="w-full">Terapkan</Button>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Views per Hari</CardTitle>
                <CardDescription>Jumlah kunjungan berdasarkan tanggal</CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer config={{}} className="h-[300px] w-full">
                  <BarChart data={analytics.viewsByDay}>
                    <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar dataKey="count" fill="var(--chart-1)" />
                  </BarChart>
                </ChartContainer>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Top Pages</CardTitle>
                  <CardDescription>Halaman dengan kunjungan terbanyak</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topPages.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada data</p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.topPages.map((p) => (
                        <li key={p.path} className="flex justify-between text-sm">
                          <span className="truncate mr-2">{p.path}</span>
                          <span className="font-medium">{p.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Referrers</CardTitle>
                  <CardDescription>Sumber rujukan terbanyak</CardDescription>
                </CardHeader>
                <CardContent>
                  {analytics.topReferrers.length === 0 ? (
                    <p className="text-sm text-gray-500">Belum ada data</p>
                  ) : (
                    <ul className="space-y-2">
                      {analytics.topReferrers.map((r) => (
                        <li key={r.referrer} className="flex justify-between text-sm">
                          <span className="truncate mr-2">{r.referrer}</span>
                          <span className="font-medium">{r.count}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="pages">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Halaman Home</CardTitle>
                  <CardDescription>Edit hero section (badge, judul, subjudul)</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPages ? (
                    <p className="text-sm text-gray-500">Memuat...</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Badge</label>
                        <input
                          className="w-full border rounded px-3 py-2"
                          value={homeContent.hero_badge}
                          onChange={(e) => setHomeContent({ ...homeContent, hero_badge: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Judul</label>
                        <input
                          className="w-full border rounded px-3 py-2"
                          value={homeContent.hero_title}
                          onChange={(e) => setHomeContent({ ...homeContent, hero_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subjudul</label>
                        <textarea
                          className="w-full border rounded px-3 py-2"
                          rows={3}
                          value={homeContent.hero_subtitle}
                          onChange={(e) => setHomeContent({ ...homeContent, hero_subtitle: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveHomeContent}>Simpan</Button>
                        <Button variant="outline" onClick={loadPageContents}>Reset</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Halaman About</CardTitle>
                  <CardDescription>Edit judul dan subjudul</CardDescription>
                </CardHeader>
                <CardContent>
                  {loadingPages ? (
                    <p className="text-sm text-gray-500">Memuat...</p>
                  ) : (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Judul</label>
                        <input
                          className="w-full border rounded px-3 py-2"
                          value={aboutContent.hero_title}
                          onChange={(e) => setAboutContent({ ...aboutContent, hero_title: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Subjudul</label>
                        <textarea
                          className="w-full border rounded px-3 py-2"
                          rows={3}
                          value={aboutContent.hero_subtitle}
                          onChange={(e) => setAboutContent({ ...aboutContent, hero_subtitle: e.target.value })}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={saveAboutContent}>Simpan</Button>
                        <Button variant="outline" onClick={loadPageContents}>Reset</Button>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="users">
            <UsersManagement />
          </TabsContent>

          <TabsContent value="services">
            <ServicesManagement />
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;