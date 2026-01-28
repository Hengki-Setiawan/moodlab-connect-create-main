import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Home,
  ShoppingCart,
  Users,
  BarChart,
  FileText,
  HardDrive,
  Briefcase,
  User,
  LogOut,
  Menu,
  X,
  LayoutDashboard,
  Sparkles
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const AdminNavbar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);
  const currentTab = new URLSearchParams(location.search).get('tab');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkAdminStatus();
  }, []);

  const checkAdminStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setIsAdmin(false);
        return;
      }

      const { data: hasRole, error } = await supabase.rpc('has_role', {
        _user_id: user.id,
        _role: 'admin',
      });

      if (error || hasRole !== true) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
    } catch (error) {
      console.error("Error checking admin status:", error);
      setIsAdmin(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  if (!isAdmin) return null;

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="mb-8 px-2">
        <h2 className="text-2xl font-bold mb-1 text-white flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <LayoutDashboard className="w-5 h-5" />
          </div>
          Admin
        </h2>
        <p className="text-purple-200 text-xs ml-10">Moodlab Management</p>
      </div>

      <nav className="flex-1 min-h-0 overflow-y-auto pr-2 space-y-1">
        <Link to="/admin-dashboard?tab=overview" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${(!currentTab || currentTab === "overview") ? "bg-white/20 shadow-inner" : ""}`}
          >
            <Home className="mr-3 h-5 w-5" />
            Overview
          </Button>
        </Link>

        <Link to="/admin-dashboard?tab=products" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "products" ? "bg-white/20 shadow-inner" : ""}`}
          >
            <ShoppingCart className="mr-3 h-5 w-5" />
            Produk
          </Button>
        </Link>

        <Link to="/admin-dashboard?tab=orders" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "orders" ? "bg-white/20 shadow-inner" : ""}`}
          >
            <FileText className="mr-3 h-5 w-5" />
            Pesanan
          </Button>
        </Link>

        <Link to="/admin-dashboard?tab=consultations" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "consultations" ? "bg-white/20 shadow-inner" : ""}`}
          >
            <Users className="mr-3 h-5 w-5" />
            Konsultasi
          </Button>
        </Link>

        <Link to="/admin-dashboard?tab=users" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "users" ? "bg-white/20 shadow-inner" : ""}`}
          >
            <User className="mr-3 h-5 w-5" />
            Pengguna
          </Button>
        </Link>

        <Link to="/admin-dashboard?tab=analytics" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "analytics" ? "bg-white/20 shadow-inner" : ""}`}
          >
            <BarChart className="mr-3 h-5 w-5" />
            Analytics
          </Button>
        </Link>

        <div className="pt-4 pb-2">
          <p className="text-xs font-semibold text-purple-200 uppercase tracking-wider mb-2 px-4">Content</p>
          <Link to="/admin-dashboard?tab=pages" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "pages" ? "bg-white/20 shadow-inner" : ""}`}
            >
              <FileText className="mr-3 h-5 w-5" />
              Halaman
            </Button>
          </Link>

          <Link to="/admin-dashboard?tab=services" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "services" ? "bg-white/20 shadow-inner" : ""}`}
            >
              <Briefcase className="mr-3 h-5 w-5" />
              Layanan
            </Button>
          </Link>

          <Link to="/admin-dashboard?tab=ai-playground" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "ai-playground" ? "bg-white/20 shadow-inner" : ""}`}
            >
              <Sparkles className="mr-3 h-5 w-5" />
              AI Playground
            </Button>
          </Link>

          <Link to="/admin-dashboard?tab=storage" onClick={() => setIsOpen(false)}>
            <Button
              variant="ghost"
              className={`w-full justify-start text-white hover:bg-white/10 ${currentTab === "storage" ? "bg-white/20 shadow-inner" : ""}`}
            >
              <HardDrive className="mr-3 h-5 w-5" />
              Storage
            </Button>
          </Link>
        </div>
      </nav>

      <div className="mt-auto pt-6 border-t border-white/20">
        <Link to="/profile" onClick={() => setIsOpen(false)}>
          <Button
            variant="ghost"
            className="w-full justify-start text-white hover:bg-white/10 mb-2"
          >
            <User className="mr-3 h-5 w-5" />
            Profil Saya
          </Button>
        </Link>
        <Button
          variant="ghost"
          className="w-full justify-start text-red-200 hover:bg-red-500/20 hover:text-red-100"
          onClick={handleSignOut}
        >
          <LogOut className="mr-3 h-5 w-5" />
          Keluar
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-slate-900 to-slate-800 text-white p-6 shadow-xl z-50">
        <NavContent />
      </div>

      {/* Mobile Toggle */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-slate-900 border-slate-700 text-white">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[80%] bg-gradient-to-b from-slate-900 to-slate-800 text-white border-r-slate-700 p-6">
            <NavContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
};

export default AdminNavbar;
