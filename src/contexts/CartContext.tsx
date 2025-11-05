import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  type?: string | null;
  file_url?: string | null;
}

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: Product;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (productId: string) => Promise<void>;
  removeFromCart: (cartItemId: string) => Promise<void>;
  updateQuantity: (cartItemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("cart_items")
        .select(`
          id,
          product_id,
          quantity,
          product:products (
            id,
            name,
            price,
            image_url,
            type,
            file_url
          )
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      setCartItems((data || []) as CartItem[]);
    } catch (error) {
      console.error("Error fetching cart:", error);
      toast.error("Gagal memuat keranjang");
    } finally {
      setIsLoading(false);
    }
  };

  const addToCart = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        return;
      }

      // Ambil detail produk untuk validasi ketersediaan file digital
      const { data: prod, error: pErr } = await supabase
        .from('products')
        .select('id, type, file_url, stock')
        .eq('id', productId)
        .single();

      if (pErr || !prod) {
        toast.error('Produk tidak ditemukan');
        return;
      }

      const isDigital = prod.type === 'ebook' || prod.type === 'template';
      if (isDigital) {
        const url = (prod.file_url || '').trim();
        if (!url) {
          toast.error('Produk digital belum tersedia di Storage. Tidak bisa dibeli.');
          return;
        }
        // Cek ketersediaan file via HEAD request (graceful fallback)
        try {
          const res = await fetch(url, { method: 'HEAD' });
          if (!res.ok) {
            toast.error('File digital tidak ditemukan/terkunci di Storage. Tidak bisa dibeli.');
            return;
          }
        } catch (e) {
          console.error('HEAD check gagal untuk file_url:', e);
          toast.error('Gagal mengakses file digital. Tidak bisa dibeli.');
          return;
        }
      }

      // Check if item already in cart
      const existingItem = cartItems.find(item => item.product_id === productId);
      
      if (existingItem) {
        await updateQuantity(existingItem.id, existingItem.quantity + 1);
        return;
      }

      const { error } = await supabase
        .from("cart_items")
        .insert({
          user_id: user.id,
          product_id: productId,
          quantity: 1,
        });

      if (error) throw error;
      
      await fetchCart();
      toast.success("Produk ditambahkan ke keranjang");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Gagal menambahkan ke keranjang");
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", cartItemId);

      if (error) throw error;
      
      await fetchCart();
      toast.success("Produk dihapus dari keranjang");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Gagal menghapus dari keranjang");
    }
  };

  const updateQuantity = async (cartItemId: string, quantity: number) => {
    if (quantity < 1) {
      await removeFromCart(cartItemId);
      return;
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", cartItemId);

      if (error) throw error;
      
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Gagal mengubah jumlah");
    }
  };

  const clearCart = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", user.id);

      if (error) throw error;
      
      setCartItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
      toast.error("Gagal mengosongkan keranjang");
    }
  };

  const cartTotal = cartItems.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );

  const cartCount = cartItems.reduce((count, item) => count + item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartTotal,
        cartCount,
        isLoading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
