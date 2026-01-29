import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { db } from "@/lib/turso";
import { products, cartItems as cartItemsSchema } from "@/db/schema";
import { inArray, eq, and } from "drizzle-orm";

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
      // 1. Fetch cart items from Turso
      const cartData = await db
        .select()
        .from(cartItemsSchema)
        .where(eq(cartItemsSchema.user_id, user.id));

      if (!cartData || cartData.length === 0) {
        setCartItems([]);
        setIsLoading(false);
        return;
      }

      // 2. Extract product IDs (convert string to number for Turso if needed)
      const productIds = cartData
        .map(item => item.product_id)
        .filter((id): id is number => id !== null);

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
        const product = productsData.find(p => p.id === item.product_id);
        if (!product) return null; // Handle case where product might be deleted

        return {
          id: item.id.toString(),
          product_id: item.product_id?.toString() || "",
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
      const existingItem = await db.query.cartItems.findFirst({
        where: and(
          eq(cartItemsSchema.user_id, user.id),
          eq(cartItemsSchema.product_id, parseInt(productId))
        )
      });

      if (existingItem) {
        await updateQuantity(existingItem.id.toString(), existingItem.quantity + 1);
        return;
      }

      await db.insert(cartItemsSchema).values({
        user_id: user.id,
        product_id: parseInt(productId),
        quantity: 1,
      });

      await fetchCart();
      toast.success("Produk ditambahkan ke keranjang");
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Gagal menambahkan ke keranjang");
    }
  };

  const removeFromCart = async (cartItemId: string) => {
    try {
      await db.delete(cartItemsSchema)
        .where(eq(cartItemsSchema.id, parseInt(cartItemId)));

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
      await db.update(cartItemsSchema)
        .set({ quantity })
        .where(eq(cartItemsSchema.id, parseInt(cartItemId)));

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

      await db.delete(cartItemsSchema)
        .where(eq(cartItemsSchema.user_id, user.id));

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
