import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { PlusCircle, Trash2, Home, Settings, LogOut } from "lucide-react";

const AdminNavbar = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState(false);

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

      // Check if user has admin role
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .single();

      if (error || !data) {
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

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-purple-900 to-indigo-900 text-white p-6 shadow-xl z-50">
      <div className="flex flex-col h-full">
        <div className="mb-10">
          <h2 className="text-2xl font-bold mb-1">Admin Dashboard</h2>
          <p className="text-purple-200 text-sm">Moodlab Management</p>
        </div>

        <nav className="flex-1">
          <ul className="space-y-2">
            <li>
              <Link to="/">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-white hover:bg-white/10 ${location.pathname === "/" ? "bg-white/20" : ""}`}
                >
                  <Home className="mr-2 h-5 w-5" />
                  Halaman Utama
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/add-product">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-white hover:bg-white/10 ${location.pathname === "/add-product" ? "bg-white/20" : ""}`}
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Tambah Produk
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/delete-products">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-white hover:bg-white/10 ${location.pathname === "/delete-products" ? "bg-white/20" : ""}`}
                >
                  <Trash2 className="mr-2 h-5 w-5" />
                  Hapus Produk
                </Button>
              </Link>
            </li>
            <li>
              <Link to="/add-admin">
                <Button 
                  variant="ghost" 
                  className={`w-full justify-start text-white hover:bg-white/10 ${location.pathname === "/add-admin" ? "bg-white/20" : ""}`}
                >
                  <Settings className="mr-2 h-5 w-5" />
                  Kelola Admin
                </Button>
              </Link>
            </li>
          </ul>
        </nav>

        <div className="mt-auto pt-6 border-t border-white/20">
          <Button 
            variant="ghost" 
            className="w-full justify-start text-white hover:bg-white/10"
            onClick={handleSignOut}
          >
            <LogOut className="mr-2 h-5 w-5" />
            Keluar
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AdminNavbar;