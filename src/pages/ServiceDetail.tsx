import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle2, MessageSquare, ExternalLink, ShoppingCart } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useCart } from "@/contexts/CartContext";

interface Service {
    id: string;
    title: string;
    description: string;
    icon: string;
    features: string[];
    category: string;
    image_url?: string;
    price?: number;
}

const ServiceDetail = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { addServiceToCart } = useCart();
    const [service, setService] = useState<Service | null>(null);
    const [loading, setLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isAddingToCart, setIsAddingToCart] = useState(false);

    useEffect(() => {
        if (id) {
            fetchServiceDetail(id);
        }
    }, [id]);

    const fetchServiceDetail = async (serviceId: string) => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from("services")
                .select("*")
                .eq("id", serviceId)
                .single();

            if (error) throw error;
            setService(data);
        } catch (error) {
            console.error("Error fetching service:", error);
            toast.error("Gagal memuat detail layanan.");
            navigate("/layanan");
        } finally {
            setLoading(false);
        }
    };

    const handleBooking = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        const formData = new FormData(e.currentTarget);

        try {
            const { error } = await supabase.from("consultations").insert({
                service_type: service?.title,
                name: formData.get("name"),
                email: formData.get("email"),
                phone: formData.get("phone"),
                message: formData.get("message"),
                status: "pending",
            } as any);

            if (error) throw error;
            toast.success("Permintaan terkirim!", { description: "Kami akan segera menghubungi Anda." });
            setIsDialogOpen(false);
        } catch (error) {
            toast.error("Gagal mengirim permintaan.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white">
                <Navbar />
                <div className="container mx-auto px-4 pt-32 pb-20">
                    <Skeleton className="h-8 w-32 mb-6" />
                    <div className="grid md:grid-cols-2 gap-12">
                        <Skeleton className="h-[400px] w-full rounded-2xl" />
                        <div className="space-y-4">
                            <Skeleton className="h-12 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!service) return null;

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="container mx-auto px-4 pt-32 pb-20">
                <Button
                    variant="ghost"
                    className="mb-8 hover:bg-gray-100 -ml-4 transition-all hover:pl-2"
                    onClick={() => navigate("/layanan")}
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Kembali ke Layanan
                </Button>

                <div className="grid lg:grid-cols-2 gap-12 items-start animate-fade-in-up">
                    {/* Left Column: Image */}
                    <div className="relative group">
                        <div className="absolute inset-0 bg-blue-600/5 rounded-3xl transform rotate-3 scale-95 transition-transform group-hover:rotate-1"></div>
                        <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-100 bg-gray-50 aspect-video lg:aspect-square flex items-center justify-center">
                            {service.image_url ? (
                                <img
                                    src={service.image_url}
                                    alt={service.title}
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                            ) : (
                                <div className="text-center p-8">
                                    <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <ExternalLink className="w-10 h-10" />
                                    </div>
                                    <p className="text-gray-500 font-medium">Gambar Ilustrasi Layanan</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="space-y-8">
                        <div>
                            <div className="inline-block px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-sm font-semibold mb-4 capitalize">
                                {service.category}
                            </div>
                            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight mb-4">
                                {service.title}
                            </h1>
                            {service.price && service.price > 0 ? (
                                <div className="mb-6">
                                    <span className="text-3xl font-bold text-green-600">Rp {service.price.toLocaleString('id-ID')}</span>
                                    <span className="text-gray-500 ml-2">(Harga Mulai)</span>
                                </div>
                            ) : (
                                <div className="mb-6">
                                    <span className="text-xl text-gray-500">Hubungi untuk informasi harga</span>
                                </div>
                            )}
                            <p className="text-xl text-gray-600 leading-relaxed">
                                {service.description}
                            </p>
                        </div>

                        <div className="space-y-6 bg-gray-50 p-8 rounded-2xl border border-gray-100">
                            <h3 className="text-lg font-bold text-gray-900">Apa yang Anda dapatkan:</h3>
                            <ul className="grid sm:grid-cols-2 gap-4">
                                {service.features.map((feature, idx) => (
                                    <li key={idx} className="flex items-start gap-3">
                                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                                        <span className="text-gray-700">{feature}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4 pt-4">
                            {/* Add to Cart button for priced services */}
                            {service.price && service.price > 0 && (
                                <Button
                                    size="lg"
                                    className="h-14 px-8 text-lg rounded-full flex-1 bg-green-600 hover:bg-green-700 hover:shadow-lg transition-all"
                                    onClick={async () => {
                                        setIsAddingToCart(true);
                                        await addServiceToCart(service.id);
                                        setIsAddingToCart(false);
                                    }}
                                    disabled={isAddingToCart}
                                >
                                    <ShoppingCart className="mr-2 h-5 w-5" />
                                    {isAddingToCart ? 'Menambahkan...' : 'Tambah ke Keranjang'}
                                </Button>
                            )}

                            {/* Consultation dialog for services without price or free consultation */}
                            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" variant={service.price && service.price > 0 ? "outline" : "default"} className={`h-14 px-8 text-lg rounded-full flex-1 ${!service.price || service.price === 0 ? 'gradient-primary hover:shadow-lg shadow-blue-500/25' : ''} transition-all`}>
                                        Konsultasi Gratis
                                    </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[500px]">
                                    <DialogHeader>
                                        <DialogTitle>Mulai Proyek Anda</DialogTitle>
                                        <DialogDescription>
                                            Isi form untuk konsultasi gratis mengenai <strong>{service.title}</strong>.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleBooking} className="space-y-4 mt-4">
                                        <div className="grid gap-2">
                                            <Label>Nama</Label>
                                            <Input name="name" required placeholder="Nama Lengkap" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Email</Label>
                                            <Input name="email" type="email" required placeholder="nama@email.com" />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>WhatsApp</Label>
                                            <Input name="phone" required placeholder="0812..." />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label>Pesan</Label>
                                            <Textarea name="message" required placeholder={`Saya tertarik dengan layanan ${service.title}...`} />
                                        </div>
                                        <Button type="submit" disabled={isSubmitting} className="w-full h-12 text-lg font-bold">
                                            {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>

                            <Button size="lg" variant="outline" className="h-14 px-8 text-lg rounded-full flex-1" onClick={() => navigate("/kontak")}>
                                <MessageSquare className="mr-2 h-5 w-5" /> Chat WhatsApp
                            </Button>
                        </div>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default ServiceDetail;
