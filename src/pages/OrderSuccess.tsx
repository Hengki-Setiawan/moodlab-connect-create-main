
import { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, ShoppingBag, ArrowRight, Home, FileText, Send } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { trackPurchase } from "@/lib/analytics";
import confetti from "canvas-confetti";
import { db } from "@/lib/turso";
import { serviceOrders } from "@/db/schema";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const [countdown, setCountdown] = useState(5);
    // Expect state from navigation: { orderId, total, items }
    const { orderId, total, items } = location.state || {};

    // Service Briefing State
    const [hasServices, setHasServices] = useState(false);
    const [briefingSubmitted, setBriefingSubmitted] = useState(false);
    const [isSubmittingBriefing, setIsSubmittingBriefing] = useState(false);
    const [briefingData, setBriefingData] = useState({
        contact_name: "",
        contact_email: "",
        contact_phone: "",
        briefing: ""
    });

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

        // Check for services
        if (items) {
            const services = items.filter((item: any) => item.type === 'service');
            if (services.length > 0) {
                setHasServices(true);
                // Pre-fill user data if available
                const fetchUser = async () => {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        setBriefingData(prev => ({
                            ...prev,
                            contact_email: user.email || "",
                            contact_name: user.user_metadata?.full_name || ""
                        }));
                    }
                };
                fetchUser();
            }
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

    const handleBriefingSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmittingBriefing(true);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not found");

            const serviceItems = items.filter((item: any) => item.type === 'service');

            // Insert records for each service item
            for (const item of serviceItems) {
                await db.insert(serviceOrders).values({
                    order_id: orderId,
                    service_id: item.id,
                    user_id: user.id,
                    contact_name: briefingData.contact_name,
                    contact_email: briefingData.contact_email,
                    contact_phone: briefingData.contact_phone,
                    briefing: briefingData.briefing,
                    service_name: item.name,
                    service_price: item.price,
                    status: 'pending_contact'
                });
            }

            // Send email notification (trigger edge function)
            await supabase.functions.invoke("send-order-email", {
                body: {
                    type: 'service_briefing',
                    orderId,
                    customer: briefingData,
                    services: serviceItems
                }
            });

            setBriefingSubmitted(true);
            toast.success("Briefing berhasil dikirim! Tim kami akan segera menghubungi Anda.");
        } catch (error) {
            console.error("Error submitting briefing:", error);
            toast.error("Gagal mengirim briefing. Silakan hubungi kami via WhatsApp.");
        } finally {
            setIsSubmittingBriefing(false);
        }
    };

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
                <Card className="border-green-100 dark:border-green-900 shadow-xl overflow-hidden mb-8">
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
                        {/* Summary Section */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                <ShoppingBag className="w-5 h-5 text-primary" />
                                Ringkasan Pesanan
                            </h3>
                            <div className="bg-neutral-50 dark:bg-neutral-900 rounded-xl p-4 space-y-3">
                                {items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-2">
                                            {item.type === 'service' && <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] rounded font-bold uppercase">Layanan</span>}
                                            <span className="text-neutral-600 dark:text-neutral-300">
                                                {item.quantity}x {item.name}
                                            </span>
                                        </div>
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

                        {/* Service Briefing Form */}
                        {hasServices && !briefingSubmitted && (
                            <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900 rounded-xl p-6 animate-in slide-in-from-bottom-4 duration-700 delay-300">
                                <div className="flex items-start gap-4 mb-6">
                                    <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <FileText className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">Lengkapi Brief Layanan</h3>
                                        <p className="text-sm text-blue-700 dark:text-blue-300">
                                            Agar kami dapat segera memproses layanan Anda, mohon lengkapi informasi berikut.
                                        </p>
                                    </div>
                                </div>

                                <form onSubmit={handleBriefingSubmit} className="space-y-4">
                                    <div className="grid sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Nama Kontak</Label>
                                            <Input
                                                required
                                                value={briefingData.contact_name}
                                                onChange={(e) => setBriefingData({ ...briefingData, contact_name: e.target.value })}
                                                placeholder="Nama Anda"
                                                className="bg-white"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>No. WhatsApp</Label>
                                            <Input
                                                required
                                                value={briefingData.contact_phone}
                                                onChange={(e) => setBriefingData({ ...briefingData, contact_phone: e.target.value })}
                                                placeholder="0812..."
                                                className="bg-white"
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Email</Label>
                                        <Input
                                            required
                                            type="email"
                                            value={briefingData.contact_email}
                                            onChange={(e) => setBriefingData({ ...briefingData, contact_email: e.target.value })}
                                            placeholder="email@example.com"
                                            className="bg-white"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi Singkat / Kebutuhan (Opsional)</Label>
                                        <Textarea
                                            value={briefingData.briefing}
                                            onChange={(e) => setBriefingData({ ...briefingData, briefing: e.target.value })}
                                            placeholder="Jelaskan kebutuhan Anda secara singkat..."
                                            className="bg-white min-h-[100px]"
                                        />
                                    </div>
                                    <Button type="submit" disabled={isSubmittingBriefing} className="w-full">
                                        {isSubmittingBriefing ? "Mengirim..." : "Kirim Briefing"} <Send className="w-4 h-4 ml-2" />
                                    </Button>
                                </form>
                            </div>
                        )}

                        {/* Briefing Success Message */}
                        {briefingSubmitted && (
                            <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900 rounded-xl p-6 text-center animate-in fade-in zoom-in">
                                <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
                                <h3 className="font-bold text-lg text-green-900">Briefing Terkirim!</h3>
                                <p className="text-green-700">Tim Moodlab akan segera menghubungi Anda via WhatsApp/Email.</p>
                            </div>
                        )}


                        <div className="text-center space-y-4 pt-4 border-t">
                            <p className="text-sm text-neutral-500 max-w-sm mx-auto">
                                {!hasServices ?
                                    "Produk digital akan otomatis tersedia di menu Produk Saya setelah pembayaran terkonfirmasi." :
                                    "Terima kasih telah mempercayakan kebutuhan digital Anda kepada Moodlab."}
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
