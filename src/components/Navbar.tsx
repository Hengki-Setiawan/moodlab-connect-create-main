import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, User } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";

const Navbar = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);
  const { cartCount } = useCart();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <nav className="fixed top-0 w-full bg-background/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo} alt="Moodlab" className="h-8" />
            <span className="text-xl font-bold gradient-text">Moodlab</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
            <Link to="/layanan" className="hover:text-primary transition-colors">Layanan</Link>
            <Link to="/produk" className="hover:text-primary transition-colors">Produk</Link>
            <Link to="/about" className="hover:text-primary transition-colors">About</Link>
            <Link to="/kontak" className="hover:text-primary transition-colors">Kontak</Link>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative" onClick={() => navigate("/cart")}>
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Button>
            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="outline" onClick={() => {
                  supabase.auth.signOut();
                  navigate("/");
                }}>
                  Logout
                </Button>
              </div>
            ) : (
              <Link to="/auth"><Button>Login</Button></Link>
            )}
          </div>

          <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {isOpen && (
          <div className="md:hidden py-4 space-y-2 border-t">
            <Link to="/" className="block px-4 py-2" onClick={() => setIsOpen(false)}>Home</Link>
            <Link to="/layanan" className="block px-4 py-2" onClick={() => setIsOpen(false)}>Layanan</Link>
            <Link to="/produk" className="block px-4 py-2" onClick={() => setIsOpen(false)}>Produk</Link>
            <Link to="/about" className="block px-4 py-2" onClick={() => setIsOpen(false)}>About</Link>
            <Link to="/kontak" className="block px-4 py-2" onClick={() => setIsOpen(false)}>Kontak</Link>
            <div className="px-4 pt-2 space-y-2">
              <Button variant="outline" className="w-full" onClick={() => { navigate("/cart"); setIsOpen(false); }}>
                <ShoppingCart className="h-4 w-4 mr-2" />Keranjang
              </Button>
              {user ? (
                <>
                  <Button className="w-full" onClick={() => { navigate("/profile"); setIsOpen(false); }}>Profile</Button>
                  <Button variant="outline" className="w-full" onClick={() => { 
                    supabase.auth.signOut();
                    navigate("/");
                    setIsOpen(false);
                  }}>Logout</Button>
                </>
              ) : (
                <Button className="w-full" onClick={() => { navigate("/auth"); setIsOpen(false); }}>Login</Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
