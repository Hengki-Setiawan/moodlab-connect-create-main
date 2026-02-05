
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCart } from "@/contexts/CartContext";
import { db } from "@/lib/turso";
import { orders, orderItems as orderItemsSchema } from "@/db/schema";
import { supabase } from "@/integrations/supabase/client";
import { trackBeginCheckout } from "@/lib/analytics";
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

  // Voucher State
  const [voucherCode, setVoucherCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedVoucher, setAppliedVoucher] = useState<string | null>(null);
  const [voucherError, setVoucherError] = useState("");
  const [isCheckingVoucher, setIsCheckingVoucher] = useState(false);

  // Calculate final total
  const finalTotal = Math.max(0, cartTotal - discount);

  useEffect(() => {
    // If cart total changes (e.g. quantity update), re-validate voucher if one is applied
    if (appliedVoucher) {
      setDiscount(0);
      setAppliedVoucher(null);
      setVoucherCode("");
      toast.info("Total berubah, silakan input ulang voucher jika ada.");
    }
  }, [cartTotal]);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCustomerDetails(prev => ({
          ...prev,
          email: user.email || "",
          name: user.user_metadata?.full_name || ""
        }));
      }
    };
    fetchProfile();
  }, []);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleApplyVoucher = async () => {
    if (!voucherCode.trim()) return;
    setIsCheckingVoucher(true);
    setVoucherError("");

    try {
      // Dynamic import to avoid initial load weight
      const { db } = await import("@/lib/turso");
      const { vouchers } = await import("@/db/schema");
      const { eq } = await import("drizzle-orm");

      // 1. Fetch voucher
      const result = await db.select().from(vouchers).where(eq(vouchers.code, voucherCode.trim()));

      if (result.length === 0) {
        setVoucherError("Kode voucher tidak valid.");
        setDiscount(0);
        setAppliedVoucher(null);
        return;
      }

      const voucher = result[0];

      // 2. Validate expiry
      if (voucher.expiry_date && new Date(voucher.expiry_date) < new Date()) {
        setVoucherError("Voucher sudah kedaluwarsa.");
        return;
      }

      // 3. Validate usage limit
      if (voucher.usage_limit !== -1 && (voucher.used_count || 0) >= (voucher.usage_limit || 0)) {
        setVoucherError("Kuota voucher sudah habis.");
        return;
      }

      // 4. Validate min spend
      if (cartTotal < (voucher.min_spend || 0)) {
        setVoucherError(`Minimal belanja Rp ${(voucher.min_spend || 0).toLocaleString('id-ID')}`);
        return;
      }

      // 5. Calculate Discount
      let calculatedDiscount = 0;
      if (voucher.discount_type === 'percent') {
        calculatedDiscount = Math.floor(cartTotal * (voucher.amount / 100));
        if (voucher.max_discount && calculatedDiscount > voucher.max_discount) {
          calculatedDiscount = voucher.max_discount;
        }
      } else {
        calculatedDiscount = voucher.amount;
      }

      // Cap discount at total
      if (calculatedDiscount > cartTotal) {
        calculatedDiscount = cartTotal;
      }

      setDiscount(calculatedDiscount);
      setAppliedVoucher(voucher.code);
      toast.success(`Voucher ${voucher.code} berhasil dipasang! Hemat Rp ${calculatedDiscount.toLocaleString('id-ID')}`);

    } catch (error) {
      console.error("Voucher check error:", error);
      setVoucherError("Gagal mengecek voucher.");
    } finally {
      setIsCheckingVoucher(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    try {
      // Validasi: blokir jika ada produk digital tanpa file_url
      const hasDigitalUnavailable = cartItems.some((item) => {
        const type = (item.product as any).type;
        const fileUrl = (item.product as any).file_url;
        const isDigital = type === 'ebook' || type === 'template';
        return isDigital && (!fileUrl || String(fileUrl).trim() === '');
      });
      if (hasDigitalUnavailable) {
        toast.error('Checkout diblokir: terdapat produk digital tanpa file di Storage.');
        setIsProcessing(false);
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Silakan login terlebih dahulu");
        navigate("/auth");
        return;
      }

      // Create order in Turso
      const orderResult = await db.insert(orders).values({
        user_id: user.id,
        total_amount: finalTotal, // Use discounted amount
        status: "pending",
        voucher_code: appliedVoucher,
        discount_amount: discount,
      }).returning();

      const orderData = orderResult[0];

      if (!orderData) throw new Error("Failed to create order");

      // Create order items in Turso
      const orderItemsData = cartItems.map((item) => ({
        order_id: orderData.id,
        product_id: parseInt(item.product_id), // Ensure integer
        quantity: item.quantity,
        price: item.product.price,
      }));

      await db.insert(orderItemsSchema).values(orderItemsData);

      // Call edge function to process payment with Midtrans
      const { data, error } = await supabase.functions.invoke("process-payment", {
        body: {
          orderId: orderData.id.toString(),
          amount: finalTotal, // Use discounted amount
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
          voucher_code: appliedVoucher,
          discount_amount: discount
        },
      });

      if (error) throw error;

      // Open Midtrans payment page
      if (data.token) {
        console.log("Payment initiated:", data.token);

        // Trigger standard Midtrans Snap popup
        // @ts-ignore
        window.snap.pay(data.token, {
          onSuccess: function (result: any) {
            console.log("Payment success:", result);
            toast.success("Pembayaran berhasil!");
            clearCart();
            // Navigate to Success Page with Order Data
            navigate("/order-success", {
              state: {
                orderId: orderData.id,
                total: finalTotal,
                items: cartItems.map(item => ({
                  id: item.product_id,
                  name: item.product.name,
                  price: item.product.price,
                  quantity: item.quantity
                }))
              }
            });
          },
          onPending: function (result: any) {
            console.log("Payment pending:", result);
            toast.info("Menunggu pembayaran...");
            navigate("/profile?tab=orders");
          },
          onError: function (result: any) {
            console.log("Payment error:", result);
            toast.error("Pembayaran gagal!");
          },
          onClose: function () {
            console.log("Customer closed the popup without finishing the payment");
            toast.warning("Pembayaran belum diselesaikan");
          },
        });
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      toast.error(error.message || "Gagal memproses checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  // Track Begin Checkout when component mounts or cart is loaded
  useEffect(() => {
    if (cartItems.length > 0) {
      trackBeginCheckout(
        cartItems.map(item => ({
          id: item.product_id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity
        })),
        cartTotal
      );
    }
  }, [cartItems, cartTotal]);

  if (cartItems.length === 0) {
    navigate("/cart");
    return null;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
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

                  {/* Voucher Input */}
                  <div className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl space-y-3">
                    <label className="text-sm font-medium">Kode Promo / Voucher</label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="Contoh: DISKON10"
                        value={voucherCode}
                        onChange={(e) => {
                          setVoucherCode(e.target.value.toUpperCase());
                          setVoucherError("");
                        }}
                        disabled={!!appliedVoucher}
                      />
                      {appliedVoucher ? (
                        <Button variant="destructive" onClick={() => {
                          setAppliedVoucher(null);
                          setDiscount(0);
                          setVoucherCode("");
                        }}>
                          Hapus
                        </Button>
                      ) : (
                        <Button
                          variant="secondary"
                          onClick={handleApplyVoucher}
                          disabled={!voucherCode || isCheckingVoucher}
                        >
                          {isCheckingVoucher ? "..." : "Pakai"}
                        </Button>
                      )}
                    </div>
                    {voucherError && <p className="text-xs text-red-500">{voucherError}</p>}
                    {appliedVoucher && <p className="text-xs text-green-500">Voucher aktif!</p>}
                  </div>

                  <div className="border-t pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatPrice(cartTotal)}</span>
                    </div>
                    {discount > 0 && (
                      <div className="flex justify-between text-sm text-green-600">
                        <span>Diskon ({appliedVoucher})</span>
                        <span>- {formatPrice(discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg pt-2">
                      <span>Total Bayar</span>
                      <span className="text-primary">{formatPrice(finalTotal)}</span>
                    </div>
                  </div>

                  <Button
                    className="w-full h-12 text-lg"
                    onClick={handleSubmit}
                    disabled={isProcessing || cartItems.length === 0}
                  >
                    {isProcessing ? "Memproses..." : `Bayar Sekarang • ${formatPrice(finalTotal)}`}
                  </Button>
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
      <Footer />
    </div>
  );
};

export default Checkout;
