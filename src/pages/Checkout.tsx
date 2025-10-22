import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart } = useCart();
  const [isProcessing, setIsProcessing] = useState(false);
  const [customerDetails, setCustomerDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/auth");
        return;
      }

      // Create order
      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total_amount: cartTotal,
          status: "pending",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price: item.product.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Call edge function to process payment with Midtrans
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          orderId: orderData.id,
          amount: cartTotal,
          customerDetails: {
            first_name: customerDetails.name,
            email: customerDetails.email,
            phone: customerDetails.phone,
          },
          items: cartItems.map((item) => ({
            id: item.product_id,
            name: item.product.name,
            price: item.product.price,
            quantity: item.quantity,
          })),
        },
      });

      if (error) throw error;

      // Open Midtrans payment page
      if (data.token) {
        // Load Midtrans Snap
        const script = document.createElement("script");
        script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
        script.setAttribute("data-client-key", "Mid-client-35fgBhK8ianqJP3d");
        document.body.appendChild(script);

        script.onload = () => {
          // @ts-ignore
          window.snap.pay(data.token, {
            onSuccess: async () => {
              await clearCart();
              toast.success("Pembayaran berhasil!");
              navigate("/profile");
            },
            onPending: () => {
              toast.info("Menunggu pembayaran");
              navigate("/profile");
            },
            onError: () => {
              toast.error("Pembayaran gagal");
            },
            onClose: () => {
              toast.info("Pembayaran dibatalkan");
            },
          });
        };
      }
    } catch (error) {
      console.error("Error processing checkout:", error);
      toast.error("Gagal memproses pembayaran");
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-6xl font-bold mb-12 text-center">
            Checkout
          </h1>

          <div className="grid md:grid-cols-2 gap-8">
            <Card>
              <CardHeader>
                <CardTitle>Detail Pembeli</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit}>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input
                      id="name"
                      required
                      value={customerDetails.name}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          name: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={customerDetails.email}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          email: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={customerDetails.phone}
                      onChange={(e) =>
                        setCustomerDetails({
                          ...customerDetails,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? "Memproses..." : "Lanjut ke Pembayaran"}
                  </Button>
                </CardFooter>
              </form>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ringkasan Pesanan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {cartItems.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <div>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x {formatPrice(item.product.price)}
                        </p>
                      </div>
                      <p className="font-semibold">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                  
                  <div className="border-t pt-4">
                    <div className="flex justify-between text-xl font-bold text-primary">
                      <span>Total:</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-muted">
                <CardContent className="pt-6">
                  <p className="text-sm text-muted-foreground">
                    Anda akan diarahkan ke halaman pembayaran Midtrans untuk
                    menyelesaikan transaksi dengan aman.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Checkout;
