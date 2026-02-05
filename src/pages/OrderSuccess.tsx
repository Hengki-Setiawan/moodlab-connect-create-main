
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, ShoppingBag, ArrowRight, Home } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/analytics";
import confetti from "canvas-confetti";

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    // Expect state from navigation: { orderId, total, items }
    const { orderId, total, items } = location.state || {};

    useEffect(() => {
        // If accessed directly without state, redirect to home
        if (!location.state) {
            const timer = setInterval(() => {
                setCountdown((prev) => {
                    if (prev <= 1) {
                        clearInterval(timer);
                        navigate("/");
                    }
                    return prev - 1;
                });
            }, 1000);
            return () => clearInterval(timer);
        }

        // Trigger confetti
        const duration = 5 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const randomInRange = (min: number, max: number) => {
            return Math.random() * (max - min) + min;
        };

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);

        // Track Purchase in GA4
        if (orderId && items && total) {
            trackPurchase(orderId, items, total);
        }

        return () => clearInterval(interval);
    }, [location.state, navigate, orderId, items, total]);

    if (!location.state) {
        return (
            <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col items-center justify-center p-4">
                <Card className="max-w-md w-full text-center p-8">
                    <h2 className="text-2xl font-bold mb-4">Halaman Tidak Ditemukan</h2>
                    <p className="text-muted-foreground mb-6">
                        Anda akan dialihkan ke beranda dalam {countdown} detik...
                    </p>
                    <Button asChild onClick={() => navigate("/")}>
                        <Link to="/">Ke Beranda Sekarang</Link>
                    </Button>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
            <Navbar />

            <div className="pt-32 pb-20 px-4 container mx-auto max-w-2xl">
                <Card className="border-green-100 dark:border-green-900 shadow-xl overflow-hidden">
                    <div className="bg-green-50 dark:bg-green-900/20 p-8 text-center border-b border-green-100 dark:border-green-900">
                        <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center mb-6 animate-in zoom-in duration-500">
                            <CheckCircle2 className="w-10 h-10 text-green-600 dark:text-green-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-neutral-900 dark:text-white mb-2">
                            Terima Kasih!
                        </h1>
                        <p className="text-lg text-neutral-600 dark:text-neutral-400">
                            Pesanan Anda berhasil dibuat
                        </p>
                        <p className="text-sm font-mono mt-2 text-neutral-500">
                            Order ID: #{orderId}
                        </p>
                    </div>

                    <CardContent className="p-8 space-y-8">
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Ringkasan Pesanan
                            </h3>
                            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 space-y-3">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <span className="text-neutral-600 dark:text-neutral-300">
                                            {item.quantity}x {item.name}
                                        </span>
                                        <span className="font-medium">
                                            {new Intl.NumberFormat("id-ID", {
                                                style: "currency",
                                                currency: "IDR",
                                                minimumFractionDigits: 0
                                            }).format(item.price * item.quantity)}
                                        </span>
                                    </div>
                                ))}
                                <div className="border-t border-neutral-200 dark:border-neutral-800 pt-3 flex justify-between items-center font-bold text-lg">
                                    <span>Total</span>
                                    <span className="text-primary">
                                        {new Intl.NumberFormat("id-ID", {
                                            style: "currency",
                                            currency: "IDR",
                                            minimumFractionDigits: 0
                                        }).format(total)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="text-center space-y-4">
                            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                                Silakan selesaikan pembayaran sesuai instruksi di halaman Midtrans.
                                Produk digital akan otomatis tersedia di menu <Link to="/profile" className="text-primary underline">Produk Saya</Link> setelah pembayaran terkonfirmasi.
                            </p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Button size="lg" asChild className="w-full sm:w-auto">
                                    <Link to="/produk">
                                        Lanjut Belanja <ArrowRight className="w-4 h-4 ml-2" />
                                    </Link>
                                </Button>
                                <Button size="lg" variant="outline" asChild className="w-full sm:w-auto">
                                    <Link to="/profile?tab=orders">
                                        Lihat Status Pesanan
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Footer />
        </div>
    );
};

export default OrderSuccess;
