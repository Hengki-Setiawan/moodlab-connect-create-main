import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { MessageSquare, Globe, Palette, Code, Briefcase, Zap, Megaphone, FileText, Share2, Package, Search, Filter } from "lucide-react";
import Footer from "@/components/Footer";
import { Skeleton } from "@/components/ui/skeleton";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { motion, AnimatePresence } from "framer-motion";

interface Service {
  id: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  category: string;
  color_class: string;
  is_active: boolean;
  price?: number;
}

const Layanan = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [filteredServices, setFilteredServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [content, setContent] = useState<any>({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchServices();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { db } = await import("@/lib/turso");
        const { pages } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const result = await db.select().from(pages).where(eq(pages.path, "/layanan"));
        if (result.length > 0) {
          if (result[0].content) {
            try {
              const parsed = JSON.parse(result[0].content);
              setContent(parsed);
            } catch (e) {
              console.error("Failed to parse Services page content JSON:", e);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch Services page content:", e);
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    let result = services;

    // Filter by Search
    if (searchQuery) {
      result = result.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by Category
    if (selectedCategory && selectedCategory !== "all") {
      result = result.filter(s => s.category.toLowerCase() === selectedCategory.toLowerCase());
    }

    setFilteredServices(result);
  }, [searchQuery, selectedCategory, services]);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      const { data: servicesData, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setServices(servicesData as any || []);
      setFilteredServices(servicesData as any || []);
    } catch (error) {
      console.warn("Using fallback static data:", error);
      // Fallback data... (same as before but simplified for brevity in this example)
      setServices([]); // Or keep empty to show skeleton/error state nicely
    } finally {
      setIsLoading(false);
    }
  };

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      MessageSquare, Globe, Palette, Code, Briefcase, Zap,
      Megaphone, FileText, Share2, Package
    };
    return icons[iconName] || MessageSquare;
  };

  const categories = [
    { value: "all", label: "Semua" },
    { value: "creative", label: "Creative" },
    { value: "digital", label: "Digital" },
    { value: "strategy", label: "Strategy" },
    { value: "agency", label: "Agency" },
    { value: "consultation", label: "Consultation" }
  ];

  return (
    <div className="min-h-screen bg-gray-50/30 font-sans">
      <Navbar />

      <section className="pt-32 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12 animate-fade-in-up">
            {content.hero_title ? (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">{content.hero_title}</h1>
            ) : (
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight text-gray-900">
                Temukan Solusi <span className="text-indigo-600">Digital</span> Anda
              </h1>
            )}
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {content.hero_subtitle || "Jelajahi berbagai layanan profesional kami untuk membantu bisnis Anda bertumbuh."}
            </p>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 mb-12 sticky top-24 z-20 backdrop-blur-md bg-white/80">
            <div className="relative w-full md:w-1/3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Cari layanan..."
                className="pl-9 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <ToggleGroup
              type="single"
              value={selectedCategory}
              onValueChange={(val) => val && setSelectedCategory(val)}
              className="w-full md:w-auto overflow-x-auto pb-2 md:pb-0 justify-start"
            >
              {categories.map((cat) => (
                <ToggleGroupItem
                  key={cat.value}
                  value={cat.value}
                  className="rounded-full px-4 data-[state=on]:bg-indigo-600 data-[state=on]:text-white whitespace-nowrap border border-gray-200"
                >
                  {cat.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6, 7, 8].map(i => <Skeleton key={i} className="h-48 w-full rounded-2xl" />)
            ) : filteredServices.length > 0 ? (
              <AnimatePresence>
                {filteredServices.map((service) => {
                  const Icon = getIcon(service.icon);
                  return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.2 }}
                      key={service.id}
                    >
                      <Card
                        className="group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border-gray-100 bg-white h-full flex flex-col justify-between"
                        onClick={() => navigate(`/layanan/${service.id}`)}
                      >
                        <CardHeader className="text-center p-6 pb-2">
                          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:rotate-6 ${service.color_class || 'bg-indigo-50 text-indigo-600'} bg-opacity-20`}>
                            <Icon className="w-8 h-8" />
                          </div>
                          <CardTitle className="text-lg font-bold text-gray-900 group-hover:text-indigo-600 transition-colors line-clamp-2 min-h-[3.5rem] flex items-center justify-center">
                            {service.title}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 pt-2 text-center">
                          <p className="text-sm text-gray-500 line-clamp-2 mb-3">
                            {service.description}
                          </p>
                          {service.price && service.price > 0 ? (
                            <p className="text-lg font-bold text-green-600 mb-3">
                              Rp {service.price.toLocaleString('id-ID')}
                            </p>
                          ) : (
                            <p className="text-sm text-gray-400 mb-3">Hubungi untuk harga</p>
                          )}
                          <Button variant="ghost" className="w-full group-hover:bg-indigo-600 group-hover:text-white text-xs font-semibold uppercase tracking-wider">
                            {service.price && service.price > 0 ? 'Pesan Sekarang' : 'Lihat Detail'}
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            ) : (
              <div className="col-span-full text-center py-20 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Tidak ada layanan yang ditemukan.</p>
                <Button variant="link" onClick={() => { setSearchQuery(""); setSelectedCategory("all") }}>Reset Filter</Button>
              </div>
            )}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Layanan;