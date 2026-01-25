import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { db } from "@/lib/turso";
import { products } from "@/db/schema";
import { inArray, eq } from "drizzle-orm";

interface Product {
  id: number;
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

      // 1. Fetch cart items from Supabase (only IDs)
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity")
        .eq("user_id", user.id);

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      // 2. Extract product IDs (convert string to number for Turso if needed)
      const productIds = cartData
        .map(item => parseInt(item.product_id))
        .filter(id => !isNaN(id));

      if (productIds.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      // 3. Fetch product details from Turso with error handling
      let productsData: any[] = [];
      try {
        productsData = await db
          .select()
          .from(products)
          .where(inArray(products.id, productIds));
      } catch (tursoError) {
        console.error("Turso fetch error:", tursoError);
        // Continue with empty products, cart will show but without product details
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      // 4. Merge data
      const mergedItems: CartItem[] = cartData.map(item => {
        const product = productsData.find(p => p.id === parseInt(item.product_id));
        if (!product) return null; // Handle case where product might be deleted

        return {
          id: item.id,
          product_id: item.product_id,
          quantity: item.quantity,
          product: {
            id: product.id,
            name: product.name,
            price: product.price,
            image_url: product.image_url,
            type: product.type,
            file_url: product.file_url || null
          }
        };
      }).filter(Boolean) as CartItem[];

      setCartItems(mergedItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      // Don't show toast for auth-related errors (user not logged in)
      setCartItems([]);
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

      // Ambil detail produk dari Turso untuk validasi
      const prod = await db.query.products.findFirst({
        where: eq(products.id, parseInt(productId))
      });

      if (!prod) {
        toast.error('Produk tidak ditemukan');
        return;
      }

      // Note: File URL check logic might need adjustment if file_url is not in public schema yet
      // For now, we skip strict file_url check on add to cart, do it on checkout if needed
      // or ensure schema has file_url if we want to check it here.

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
