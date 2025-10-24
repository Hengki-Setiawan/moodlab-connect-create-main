import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Globe, Palette, Code, Briefcase, Zap, Megaphone } from "lucide-react";
import Footer from "@/components/Footer";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  category: 'consultation' | 'agency';
  color_class: string;
  is_active: boolean;
}

const Layanan = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      
      // Try to fetch from database first
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });
  
      if (error) {
        console.error("Error fetching services from database:", error);
        // Fallback to static data if database fetch fails
        throw error;
      }
  
      if (servicesData && servicesData.length > 0) {
        // Use database data
        setServices(servicesData);
      } else {
        // Fallback to static data if no services in database
        throw new Error("No services found in database");
      }
    } catch (error) {
      console.error("Using fallback static data:", error);
      
      // Fallback static data
      const staticServices: Service[] = [
        {
          id: '1',
          title: 'Optimalisasi Media Sosial',
          description: 'Layanan ini berupa sesi konsultasi terstruktur di mana tim Moodlab akan menganalisis kinerja akun media sosial Anda (Instagram, TikTok, Facebook, dll.).',
          icon: 'MessageSquare',
          features: [
            'Analisis kinerja akun media sosial',
            'Strategi konten yang lebih efektif',
            'Identifikasi target audiens yang tepat',
            'Rekomendasi praktis untuk meningkatkan engagement'
          ],
          category: 'consultation',
          color_class: 'primary',
          is_active: true
        },
        {
          id: '2',
          title: 'Optimalisasi Website & SEO',
          description: 'Layanan konsultasi yang berfokus pada peninjauan dan perbaikan struktur serta performa website Anda.',
          icon: 'Globe',
          features: [
            'Analisis mendalam User Experience (UX) dan User Interface (UI)',
            'Optimasi kecepatan loading website',
            'Koreksi dasar-dasar SEO on-page',
            'Memaksimalkan website sebagai marketing funnel'
          ],
          category: 'consultation',
          color_class: 'secondary',
          is_active: true
        },
        {
          id: '3',
          title: 'Pembuatan Konten',
          description: 'Layanan end-to-end untuk produksi konten visual dan tekstual yang berkualitas dan konsisten.',
          icon: 'Palette',
          features: [
            'Perencanaan ide dan konsep konten',
            'Penulisan copywriting persuasif',
            'Desain grafis (statis/carousel)',
            'Produksi video singkat untuk media sosial'
          ],
          category: 'agency',
          color_class: 'accent',
          is_active: true
        },
        {
          id: '4',
          title: 'Pembuatan Website',
          description: 'Jasa pengembangan dan pembangunan website yang profesional, responsif di berbagai perangkat, dan fungsional.',
          icon: 'Code',
          features: [
            'Perancangan struktur dan desain UI/UX modern',
            'Implementasi dengan tech stack modern (Next.js, Node.js)',
            'Fitur e-commerce dengan payment gateway Midtrans',
            'Integrasi backend dengan Supabase'
          ],
          category: 'agency',
          color_class: 'primary',
          is_active: true
        }
      ];
  
      setServices(staticServices);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConsultationClick = (serviceTitle: string) => {
    setSelectedService(serviceTitle);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    try {
      const { error } = await supabase.from("consultations").insert({
        service_type: selectedService,
        name,
        email,
        phone,
        message,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Permintaan konsultasi berhasil dikirim!", {
        description: "Tim kami akan menghubungi Anda segera.",
      });

      setIsDialogOpen(false);
      e.currentTarget.reset();
    } catch (error) {
      console.error("Error submitting consultation:", error);
      toast.error("Gagal mengirim permintaan", {
        description: "Silakan coba lagi atau hubungi kami langsung.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'MessageSquare':
        return MessageSquare;
      case 'Globe':
        return Globe;
      case 'Palette':
        return Palette;
      case 'Code':
        return Code;
      case 'Briefcase':
        return Briefcase;
      case 'Zap':
        return Zap;
      case 'Megaphone':
        return Megaphone;
      default:
        return MessageSquare;
    }
  };

  const getColorClass = (colorClass: string) => {
    switch (colorClass) {
      case 'primary':
        return 'border-primary hover:border-primary text-primary';
      case 'secondary':
        return 'border-secondary hover:border-secondary text-secondary';
      case 'accent':
        return 'border-accent hover:border-accent text-accent';
      default:
        return 'border-primary hover:border-primary text-primary';
    }
  };

  const getButtonClass = (colorClass: string) => {
    switch (colorClass) {
      case 'primary':
        return 'gradient-primary';
      case 'secondary':
        return '';
      case 'accent':
        return 'bg-accent hover:bg-accent/90';
      default:
        return 'gradient-primary';
    }
  };

  const consultationServices = services.filter(service => service.category === 'consultation');
  const agencyServices = services.filter(service => service.category === 'agency');

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <section className="pt-32 pb-20 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-4 mb-16">
              <h1 className="text-4xl md:text-6xl font-bold">
                Layanan <span className="gradient-text">Pemasaran Digital</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Dari konsultasi strategi hingga eksekusi penuh, kami siap menjadi mitra pertumbuhan bisnis Anda
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-8">
              {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-12 w-12 bg-muted rounded mb-4"></div>
                    <div className="h-6 bg-muted rounded w-3/4"></div>
                    <div className="h-4 bg-muted rounded w-full mt-2"></div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-6xl font-bold">
              Layanan <span className="gradient-text">Pemasaran Digital</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Dari konsultasi strategi hingga eksekusi penuh, kami siap menjadi mitra pertumbuhan bisnis Anda
            </p>
          </div>

          {/* Konsultasi Section */}
          {consultationServices.length > 0 && (
            <div className="mb-20">
              <h2 className="text-3xl font-bold mb-8 text-center">Konsultasi Pemasaran</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {consultationServices.map((service) => {
                  const IconComponent = getIcon(service.icon);
                  return (
                    <Card key={service.id} className={`border-2 transition-all hover:shadow-lg ${getColorClass(service.color_class)}`}>
                      <CardHeader>
                        <IconComponent className={`h-12 w-12 mb-4 ${service.color_class === 'primary' ? 'text-primary' : service.color_class === 'secondary' ? 'text-secondary' : 'text-accent'}`} />
                        <CardTitle className="text-2xl">{service.title}</CardTitle>
                        <CardDescription className="text-base">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6 text-sm">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <span className={`h-1.5 w-1.5 rounded-full mr-2 mt-2 flex-shrink-0 ${service.color_class === 'primary' ? 'bg-primary' : service.color_class === 'secondary' ? 'bg-secondary' : 'bg-accent'}`}></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold">Hubungi Kami</p>
                          <Button 
                            onClick={() => handleConsultationClick(service.title)}
                            className={getButtonClass(service.color_class)}
                            variant={service.color_class === 'secondary' ? 'secondary' : 'default'}
                          >
                            Konsultasi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kerjasama Agensi Section */}
          {agencyServices.length > 0 && (
            <div>
              <h2 className="text-3xl font-bold mb-8 text-center">Kerjasama Agensi</h2>
              <div className="grid md:grid-cols-2 gap-8">
                {agencyServices.map((service) => {
                  const IconComponent = getIcon(service.icon);
                  return (
                    <Card key={service.id} className={`border-2 transition-all hover:shadow-lg ${getColorClass(service.color_class)}`}>
                      <CardHeader>
                        <IconComponent className={`h-12 w-12 mb-4 ${service.color_class === 'primary' ? 'text-primary' : service.color_class === 'secondary' ? 'text-secondary' : 'text-accent'}`} />
                        <CardTitle className="text-2xl">{service.title}</CardTitle>
                        <CardDescription className="text-base">
                          {service.description}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-3 mb-6 text-sm">
                          {service.features.map((feature, index) => (
                            <li key={index} className="flex items-start">
                              <span className={`h-1.5 w-1.5 rounded-full mr-2 mt-2 flex-shrink-0 ${service.color_class === 'primary' ? 'bg-primary' : service.color_class === 'secondary' ? 'bg-secondary' : 'bg-accent'}`}></span>
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="flex items-center justify-between">
                          <p className="text-lg font-semibold">Hubungi Kami</p>
                          <Button 
                            onClick={() => handleConsultationClick(service.title)}
                            className={getButtonClass(service.color_class)}
                            variant={service.color_class === 'secondary' ? 'secondary' : 'default'}
                          >
                            Konsultasi
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Consultation Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Form Konsultasi</DialogTitle>
            <DialogDescription>
              Isi formulir di bawah ini dan tim kami akan menghubungi Anda segera untuk {selectedService}.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" required placeholder="Masukkan nama lengkap" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" required placeholder="email@example.com" />
            </div>
            <div>
              <Label htmlFor="phone">Nomor Telepon</Label>
              <Input id="phone" name="phone" required placeholder="08xxxxxxxxxx" />
            </div>
            <div>
              <Label htmlFor="message">Pesan</Label>
              <Textarea 
                id="message" 
                name="message" 
                required 
                placeholder="Ceritakan kebutuhan Anda..."
                rows={4}
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full gradient-primary">
              {isSubmitting ? "Mengirim..." : "Kirim Permintaan"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Footer />
    </div>
  );
};

export default Layanan;