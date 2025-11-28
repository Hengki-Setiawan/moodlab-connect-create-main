import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import AdminNavbar from "@/components/AdminNavbar";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import UsersManagement from "@/components/admin/UsersManagement";
import ServicesManagement from "@/components/admin/ServicesManagement";
import DashboardOverview from "@/components/admin/DashboardOverview";
import OrdersManagement from "@/components/admin/OrdersManagement";
import AdminProductManager from "@/components/admin/AdminProductManager";
import ConsultationsManagement from "@/components/admin/ConsultationsManagement";
import AnalyticsView from "@/components/admin/AnalyticsView";
import PagesManagement from "@/components/admin/PagesManagement";
import { uploadImage } from "@/integrations/supabase/storage";

// Import other necessary components for different tabs if needed
// For now, we'll keep the inline implementations for simple tabs or move them later

interface User {
  id: string;
  email: string;
  role: string;
}

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
  created_at: string;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
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
    totalViews: number;
    uniqueVisitors: number;
  }>({ viewsByDay: [], topPages: [], topReferrers: [], totalViews: 0, uniqueVisitors: 0 });

  const [recentActivity, setRecentActivity] = useState<{
    id: string;
    action: string;
    details: string;
    timestamp: string;
  }[]>([]);

  // Tab state management
  const [tab, setTab] = useState<string>('overview');

  // Storage state
  const [buckets, setBuckets] = useState<{ id: string; name: string; public?: boolean }[]>([]);
  const [selectedBucket, setSelectedBucket] = useState<string>('');
  const [storageFiles, setStorageFiles] = useState<{ name: string; id?: string; updated_at?: string; created_at?: string }[]>([]);
  const [loadingStorage, setLoadingStorage] = useState<boolean>(false);
  const [uploading, setUploading] = useState<boolean>(false);
  const [currentPath, setCurrentPath] = useState<string>('');

  useEffect(() => {
    const t = new URLSearchParams(location.search).get('tab');
    if (t) setTab(t);
    else setTab('overview');
  }, [location.search]);

  useEffect(() => {
    checkUserRole();
    fetchData();
    fetchAnalytics();
    fetchRecentActivity();
  }, []);

  // ... (keep existing realtime subscription)

  const fetchRecentActivity = async () => {
    try {
      // Fetch latest orders
      const { data: latestOrders } = await supabaseAdmin
        .from('orders')
        .select('id, created_at, status, total_amount')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch latest products
      const { data: latestProducts } = await supabaseAdmin
        .from('products')
        .select('id, created_at, name')
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch latest users
      const { data: latestUsers } = await supabaseAdmin
        .from('profiles')
        .select('id, created_at, full_name')
        .order('created_at', { ascending: false })
        .limit(5);

      const activities = [
        ...(latestOrders || []).map((o: any) => ({
          id: `order-${o.id}`,
          action: 'Pesanan Baru',
          details: `Order #${o.id.slice(0, 8)} - Rp ${o.total_amount?.toLocaleString('id-ID')}`,
          timestamp: o.created_at
        })),
        ...(latestProducts || []).map((p: any) => ({
          id: `product-${p.id}`,
          action: 'Produk Ditambahkan',
          details: p.name,
          timestamp: p.created_at
        })),
        ...(latestUsers || []).map((u: any) => ({
          id: `user-${u.id}`,
          action: 'Pengguna Baru',
          details: u.full_name || 'User Baru',
          timestamp: u.created_at
        }))
      ];

      const sortedActivity = activities
        .sort((a, b) => {
          const dateA = a.timestamp ? new Date(a.timestamp) : null;
          const dateB = b.timestamp ? new Date(b.timestamp) : null;

          const timeA = dateA && !isNaN(dateA.getTime()) ? dateA.getTime() : -Infinity;
          const timeB = dateB && !isNaN(dateB.getTime()) ? dateB.getTime() : -Infinity;

          return timeB - timeA;
        })
        .slice(0, 5);

      setRecentActivity(sortedActivity);
    } catch (error) {
      console.error("Error fetching recent activity:", error);
    }
  };

  const checkUserRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: isAdmin, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin'
      });

      if (error || !isAdmin) {
        navigate("/profile");
        return;
      }

      setUser({ id: user.id, email: user.email!, role: 'admin' });
    } catch (error) {
      navigate("/auth");
    }
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);

      const { data: productsData } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      setProducts(productsData || []);

      const { data: ordersData } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });
      setOrders(ordersData || []);

      const { data: consultationsData } = await supabaseAdmin
        .from('consultations')
        .select('*')
        .order('created_at', { ascending: false });
      setConsultations(consultationsData || []);

      const { data: bucketsData } = await supabaseAdmin.storage.listBuckets();
      if (bucketsData) {
        setBuckets(bucketsData);
        if (bucketsData.length > 0 && !selectedBucket) {
          setSelectedBucket(bucketsData[0].name);
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from('page_views' as any)
        .select('*')
        .gte('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      const byDay = new Map<string, number>();
      const pages = new Map<string, number>();
      const referrers = new Map<string, number>();
      const uniqueUsers = new Set<string>();

      const sample = data?.[0];
      const timeColumn = sample && 'viewed_at' in sample ? 'viewed_at' : 'created_at';

      (data || []).forEach((v: any) => {
        const timestamp = v[timeColumn];
        if (!timestamp) return;
        const dateObj = new Date(timestamp);
        if (isNaN(dateObj.getTime())) return;

        const day = dateObj.toISOString().slice(0, 10);
        byDay.set(day, (byDay.get(day) || 0) + 1);

        const p = v.path || "/";
        pages.set(p, (pages.get(p) || 0) + 1);

        if (v.referrer) referrers.set(v.referrer, (referrers.get(v.referrer) || 0) + 1);
        if (v.user_id || v.visitor_id) uniqueUsers.add(v.user_id || v.visitor_id);
      });

      const viewsByDay = Array.from(byDay.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      const topPages = Array.from(pages.entries())
        .map(([path, count]) => ({ path, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      const topReferrers = Array.from(referrers.entries())
        .map(([referrer, count]) => ({ referrer, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      setAnalytics({
        viewsByDay,
        topPages,
        topReferrers,
        totalViews: data?.length || 0,
        uniqueVisitors: uniqueUsers.size
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    }
  };

  const fetchStorageFiles = async () => {
    if (!selectedBucket) return;
    setLoadingStorage(true);
    try {
      const { data, error } = await supabaseAdmin.storage.from(selectedBucket).list(currentPath);
      if (error) throw error;
      setStorageFiles(data || []);
    } catch (error) {
      console.error('Error fetching storage:', error);
    } finally {
      setLoadingStorage(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !selectedBucket) return;
    setUploading(true);
    try {
      for (const file of Array.from(e.target.files)) {
        await uploadImage(file, selectedBucket, currentPath, file.name);
      }
      fetchStorageFiles();
    } catch (error) {
      console.error('Error uploading:', error);
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (name: string) => {
    if (!selectedBucket) return;
    try {
      const path = currentPath ? `${currentPath}/${name}` : name;
      await supabaseAdmin.storage.from(selectedBucket).remove([path]);
      fetchStorageFiles();
    } catch (error) {
      console.error('Error deleting file:', error);
    }
  };

  useEffect(() => {
    if (selectedBucket) {
      fetchStorageFiles();
    }
  }, [selectedBucket, currentPath]);

  const renderContent = () => {
    switch (tab) {
      case 'overview':
        return (
          <DashboardOverview
            stats={{
              productsCount: products.length,
              ordersCount: orders.length,
              consultationsCount: consultations.length,
              totalViews: analytics.totalViews
            }}
            analytics={analytics}
            recentActivity={recentActivity}
          />
        );
      case 'products':
        return <AdminProductManager />;
      case 'orders':
        return <OrdersManagement orders={orders} onOrderUpdated={fetchData} />;
      case 'users':
        return <UsersManagement />;
      case 'consultations':
        return <ConsultationsManagement />;
      case 'analytics':
        return <AnalyticsView />;
      case 'pages':
        return <PagesManagement />;
      case 'services':
        return <ServicesManagement />;
      case 'storage':
        return (
          <div className="bg-white dark:bg-card/60 backdrop-blur-sm rounded-lg p-6 shadow-sm border dark:border-border">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-foreground">File Storage</h2>
              <div className="flex gap-2">
                <select
                  className="border dark:border-border rounded px-3 py-1 bg-white dark:bg-muted text-foreground"
                  value={selectedBucket}
                  onChange={(e) => setSelectedBucket(e.target.value)}
                >
                  {buckets.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                </select>
                <div className="relative">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleUpload}
                    disabled={uploading}
                  />
                  <Button disabled={uploading}>
                    {uploading ? 'Uploading...' : 'Upload File'}
                  </Button>
                </div>
              </div>
            </div>

            {loadingStorage ? (
              <div className="text-center py-8 text-muted-foreground">Loading files...</div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {storageFiles.length === 0 && <p className="col-span-full text-center text-muted-foreground">Folder kosong</p>}
                {storageFiles.map((file, idx) => (
                  <div key={idx} className="group relative border dark:border-border rounded-lg p-4 hover:bg-white/80 dark:hover:bg-muted/50 transition-all">
                    <div className="aspect-square bg-gray-100 dark:bg-muted rounded mb-2 flex items-center justify-center overflow-hidden">
                      {file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                        <img
                          src={supabaseAdmin.storage.from(selectedBucket).getPublicUrl(`${currentPath ? currentPath + '/' : ''}${file.name}`).data.publicUrl}
                          alt={file.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-2xl text-gray-400">📄</span>
                      )}
                    </div>
                    <p className="text-xs truncate font-medium text-foreground" title={file.name}>{file.name}</p>
                    <button
                      onClick={() => removeFile(file.name)}
                      className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c0 1 1 2 2 2v2" /></svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      default:
        return (
          <div className="flex items-center justify-center h-[50vh] text-muted-foreground">
            Halaman sedang dalam pengembangan
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <AdminNavbar />

      <div className="md:ml-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-40 border-b border-gray-200/50">
          <div className="container mx-auto px-6 py-4 flex justify-between items-center pl-16 md:pl-6">
            <h1 className="text-xl font-semibold capitalize text-gray-800">
              {tab === 'overview' ? 'Dashboard Overview' : tab}
            </h1>

            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-gray-600" />
                <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full animate-pulse" />
              </Button>
              <div className="flex items-center gap-3 pl-4 border-l">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-gray-500 capitalize">{user?.role}</p>
                </div>
                <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
                  {user?.email?.[0].toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-6 py-8">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;
