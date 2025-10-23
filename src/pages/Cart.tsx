import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useCart } from "@/contexts/CartContext";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import Footer from "@/components/Footer";

const Cart = () => {
  const navigate = useNavigate();
  const { cartItems, removeFromCart, updateQuantity, cartTotal, isLoading } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    navigate("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-32 pb-20 px-4 container mx-auto">
          <p className="text-center text-muted-foreground">Memuat keranjang...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Keranjang <span className="gradient-text">Belanja</span>
            </h1>
          </div>

          {cartItems.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl mb-2">Keranjang Anda kosong</p>
                <p className="text-muted-foreground mb-6">
                  Mulai berbelanja dan tambahkan produk ke keranjang Anda
                </p>
                <Button onClick={() => navigate("/produk")}>
                  Lihat Produk
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-6">
                    <div className="flex gap-4">
                      {item.product.image_url ? (
                        <img
                          src={item.product.image_url}
                          alt={item.product.name}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      ) : (
                        <div className="w-24 h-24 bg-gradient-primary rounded-lg" />
                      )}
                      
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold mb-2">
                          {item.product.name}
                        </h3>
                        <p className="text-2xl font-bold text-primary mb-4">
                          {formatPrice(item.product.price)}
                        </p>
                        
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="destructive"
                            size="icon"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between text-lg mb-2">
                    <span>Subtotal:</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-2xl font-bold text-primary">
                    <span>Total:</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    className="w-full" 
                    size="lg"
                    onClick={handleCheckout}
                  >
                    Lanjut ke Pembayaran
                  </Button>
                </CardFooter>
              </Card>
            </div>
          )}
        </div>
       </section>
       <Footer />
    </div>
  );
};

export default Cart;
