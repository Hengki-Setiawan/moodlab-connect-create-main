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

  const hasDigitalUnavailable = cartItems.some((item) => {
    if (item.item_type === 'service') return false;
    const product = item.product;
    if (!product) return false;

    const type = (product as any).type;
    const fileUrl = (product as any).file_url;
    const isDigital = type === 'ebook' || type === 'template';
    return isDigital && (!fileUrl || String(fileUrl).trim() === '');
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleCheckout = async () => {
    if (hasDigitalUnavailable) {
      alert('Ada produk digital yang filenya belum tersedia di Storage. Hapus produk tersebut dari keranjang atau tunggu hingga file tersedia.');
      return;
    }
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
              {cartItems.map((item) => {
                const isService = item.item_type === 'service';
                const name = isService ? item.service?.title : item.product?.name;
                const price = isService ? item.service?.price : item.product?.price;
                const image = isService ? item.service?.image_url : item.product?.image_url;

                if (!name || price === undefined) return null; // Skip invalid items

                return (
                  <Card key={item.id}>
                    <CardContent className="p-6">
                      <div className="flex gap-4">
                        {image ? (
                          <img
                            src={image}
                            alt={name}
                            className="w-24 h-24 object-cover rounded-lg"
                          />
                        ) : (
                          <div className="w-24 h-24 bg-gradient-primary rounded-lg flex items-center justify-center text-white text-xs text-center p-2">
                            {isService ? 'Layanan' : 'Produk'}
                          </div>
                        )}

                        <div className="flex-1">
                          <div className="flex justify-between items-start">
                            <div>
                              {isService && (
                                <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded mb-1">
                                  Layanan
                                </span>
                              )}
                              <h3 className="text-xl font-semibold mb-2">
                                {name}
                              </h3>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-primary mb-4">
                            {formatPrice(price)}
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
                );
              })}

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
                  <div className="w-full">
                    {hasDigitalUnavailable && (
                      <div className="text-sm text-red-600 mb-3">
                        Ada produk digital tanpa file di Storage. Checkout dinonaktifkan.
                      </div>
                    )}
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleCheckout}
                      disabled={hasDigitalUnavailable}
                    >
                      Lanjut ke Pembayaran
                    </Button>
                  </div>
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
