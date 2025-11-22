import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { CartProvider } from "./contexts/CartContext";
import { Analytics } from "@vercel/analytics/react";
import Home from "./pages/Home";
import Layanan from "./pages/Layanan";
import Produk from "./pages/Produk";
import ProductDetail from "./pages/ProductDetail";
import About from "./pages/About";
import Kontak from "./pages/Kontak";
import Auth from "./pages/Auth";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Profile from "./pages/Profile";
import Admin from "./pages/Admin";
import AdminDashboard from "./pages/AdminDashboard";
import TestAdmin from "./pages/test-admin";
import DeleteProducts from "./pages/delete-products";
import AddProductPage from "./pages/add-product";
import AddAdmin from "./pages/add-admin";
import EditProfile from "./pages/edit-profile";
import NotFound from "./pages/NotFound";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminProtected } from "@/components/AdminProtected";
import { StaffProtected } from "@/components/StaffProtected";
import ChatWidget from "./components/ChatWidget";


// Komponen kecil untuk mencatat page view setiap kali rute berubah
const RouteChangeTracker = () => {
  const location = useLocation();

  useEffect(() => {
    // Auto scroll ke atas saat perpindahan page
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const track = async () => {
      // Guard: nonaktifkan tracking jika flag env tidak diaktifkan atau API key/url tidak tersedia
      const enableViews = String(import.meta.env.VITE_ENABLE_PAGE_VIEWS ?? 'false') === 'true';
      const supabaseUrlOk = typeof import.meta.env.VITE_SUPABASE_URL === 'string' && import.meta.env.VITE_SUPABASE_URL.length > 0;
      const supabaseAnonOk = typeof import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY === 'string' && import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY.length > 0;
      if (!enableViews || !supabaseUrlOk || !supabaseAnonOk) {
        // Skip tanpa error agar tidak mengganggu UX
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        const referrer = document.referrer || null;
        const userAgent = navigator.userAgent || null;

        // Persistent visitor_id di localStorage
        const VISITOR_KEY = "ml_visitor_id";
        let visitorId = localStorage.getItem(VISITOR_KEY);
        if (!visitorId) {
          visitorId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
          localStorage.setItem(VISITOR_KEY, visitorId);
        }

        // Session id per sesi browser (sessionStorage)
        const SESSION_KEY = "ml_session_id";
        let sessionId = sessionStorage.getItem(SESSION_KEY);
        if (!sessionId) {
          sessionId = (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
          sessionStorage.setItem(SESSION_KEY, sessionId);
        }

        // Ambil UTM parameters jika ada
        const params = new URLSearchParams(location.search);
        const utm_source = params.get("utm_source") || null;
        const utm_medium = params.get("utm_medium") || null;
        const utm_campaign = params.get("utm_campaign") || null;
        const utm_term = params.get("utm_term") || null;
        const utm_content = params.get("utm_content") || null;

        const payload = {
          path: `${location.pathname}${location.search}`,
          user_id: user?.id ?? null,
          referrer,
          user_agent: userAgent,
          viewed_at: new Date().toISOString(),
          visitor_id: visitorId,
          session_id: sessionId,
          utm_source,
          utm_medium,
          utm_campaign,
          utm_term,
          utm_content,
        } as any;

        // Coba insert dengan kolom tambahan; jika gagal (mis. kolom belum ada/RLS), fallback ke payload minimal
        let { error } = await supabase.from("page_views").insert(payload);
        if (error) {
          const minimal = {
            path: `${location.pathname}${location.search}`,
            user_id: user?.id ?? null,
            referrer,
            user_agent: userAgent,
            viewed_at: new Date().toISOString(),
          };
          await supabase.from("page_views").insert(minimal);
        }
      } catch (error) {
        console.error("Error tracking page view:", error);
      }
    };

    track();
  }, [location.pathname, location.search]);

  return null;
};

const queryClient = new QueryClient();

// Wrapper untuk transisi halaman halus
const Page = ({ children }: { children: React.ReactNode }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -12 }}
    transition={{ duration: 0.25, ease: "easeInOut" }}
  >
    {children}
  </motion.div>
);

// Routes dengan AnimatePresence agar perpindahan rute terasa smooth
const AppRoutesWithAnimations = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Page><Home /></Page>} />
        <Route path="/layanan" element={<Page><Layanan /></Page>} />
        <Route path="/produk" element={<Page><Produk /></Page>} />
        <Route path="/produk/:id" element={<Page><ProductDetail /></Page>} />
        <Route path="/about" element={<Page><About /></Page>} />
        <Route path="/kontak" element={<Page><Kontak /></Page>} />
        <Route path="/auth" element={<Page><Auth /></Page>} />
        <Route path="/cart" element={<Page><Cart /></Page>} />
        <Route path="/checkout" element={<Page><Checkout /></Page>} />
        <Route path="/profile" element={<Page><Profile /></Page>} />
        <Route path="/admin" element={<Page><Admin /></Page>} />
        <Route path="/admin-dashboard" element={<Page><StaffProtected><AdminDashboard /></StaffProtected></Page>} />
        <Route path="/test-admin" element={<Page><TestAdmin /></Page>} />
        <Route path="/delete-products" element={<Page><DeleteProducts /></Page>} />
        <Route path="/add-product" element={<Page><AddProductPage /></Page>} />
        <Route path="/add-admin" element={<Page><AddAdmin /></Page>} />
        <Route path="/edit-profile" element={<Page><EditProfile /></Page>} />
        <Route path="*" element={<Page><NotFound /></Page>} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <CartProvider>
        <Toaster />
        <Sonner />
        <Analytics />
        {/* Widget Chatbot mengambang terhubung ke n8n */}
        <ChatWidget />
        <BrowserRouter>
          {/* Tracker untuk page views */}
          <RouteChangeTracker />
          <AppRoutesWithAnimations />
        </BrowserRouter>
      </CartProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
