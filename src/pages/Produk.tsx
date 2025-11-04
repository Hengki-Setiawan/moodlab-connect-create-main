import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import ProductDetailPopup from "@/components/ProductDetailPopup";
import { getImageUrl } from "@/integrations/supabase/storage";
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "template" | "ebook" | "service";
  category: string;
  image_url: string | null;
}

const Produk = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"template" | "ebook">("template");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,price,type,category,image_url,created_at")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data || []) as Product[]);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const openProductDetail = (product: Product) => {
    window.location.href = `/produk/${product.id}`;
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handleAddToCart = async (product: Product) => {
    await addToCart(product.id);
  };

  const templates = products.filter(product => {
    const type = (product.type || '').toLowerCase();
    const category = (product.category || '').toLowerCase();
    return type === 'template' || type === 'redesign' || type === 'redesigns' || /redesign/.test(category);
  });
  const ebooks = products.filter(product => product.type === "ebook");

  const matchesSearch = (p: Product) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    const digits = searchTerm.replace(/\D/g, "");
    const priceStr = (p.price ?? 0).toString();
    const priceId = (p.price ?? 0).toLocaleString("id-ID");
    return (
      (p.name || "").toLowerCase().includes(q) ||
      (p.description || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q) ||
      (p.type || "").toLowerCase().includes(q) ||
      (!!digits && (priceStr.includes(digits) || priceId.includes(digits)))
    );
  };

  const matchesCategory = (p: Product) => {
    if (!activeCategory) return true;
    const c = (p.category || "").toLowerCase();
    const t = (p.type || "").toLowerCase();
    const cat = activeCategory.toLowerCase();
    // Cocokkan kategori langsung atau tipe khusus redesign
    return c === cat || t === cat || (cat.includes("redesign") && (/redesign/.test(c) || /redesign/.test(t)));
  };

  const templateCategories = useMemo(() => {
    const set = new Set<string>();
    templates.forEach((p) => {
      const c = (p.category || '').toLowerCase();
      if (c) set.add(c);
      const t = (p.type || '').toLowerCase();
      if (t.includes('redesign')) set.add('redesigns');
    });
    const defaults = ['design','business','technology','education','marketing','redesigns'];
    return Array.from(new Set([...defaults, ...Array.from(set)]));
  }, [templates]);

  const ebookCategories = useMemo(() => {
    const set = new Set<string>();
    ebooks.forEach((p) => {
      const c = (p.category || '').toLowerCase();
      if (c) set.add(c);
    });
    const defaults = ['education','business','marketing','technology','other'];
    return Array.from(new Set([...defaults, ...Array.from(set)]));
  }, [ebooks]);

  const resolveImageUrl = (url: string | null) => {
    if (!url) return "/placeholder.svg";
    const isHttp = /^https?:\/\//.test(url);
    if (isHttp) return url;
    return getImageUrl(url) || "/placeholder.svg";
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-12">
            <h1 className="text-4xl md:text-6xl font-bold">
              Produk <span className="gradient-text">Digital</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Template dan e-book pemasaran digital untuk mempercepat pertumbuhan bisnis Anda
            </p>
          </div>

          {/* Pencarian */}
          <div className="max-w-3xl mx-auto mb-6">
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Cari produk (nama, deskripsi, kategori)"
                className="flex-1 border rounded px-4 py-2"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Button onClick={() => {/* filter berbasis client, tidak perlu aksi */}}>
                Search
              </Button>
            </div>
          </div>

          <div className="flex justify-center mb-6">
            <div className="bg-muted p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("template")}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === "template"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Template
              </button>
              <button
                onClick={() => setActiveTab("ebook")}
                className={`px-6 py-2 rounded-md transition-all ${
                  activeTab === "ebook"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                E-book
              </button>
            </div>
          </div>

          {/* Filter kategori */}
          <div className="flex flex-wrap gap-2 justify-center mb-12">
            {(
              activeTab === 'template' ? templateCategories : ebookCategories
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(activeCategory === cat ? null : cat)}
                className={`px-3 py-1 rounded-full border text-sm ${
                  activeCategory === cat ? 'bg-primary text-primary-foreground border-primary' : 'bg-background'
                }`}
              >
                {cat}
              </button>
            ))}
            {((activeTab === 'template' ? templateCategories : ebookCategories).length > 0) && (
              <button
                onClick={() => setActiveCategory(null)}
                className="px-3 py-1 rounded-full border text-sm"
              >
                Reset
              </button>
            )}
          </div>

          {activeTab === "template" && (
            <div>
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <Skeleton className="aspect-video rounded-t-lg" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : templates.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Belum ada template tersedia.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {templates.filter((p) => matchesSearch(p) && matchesCategory(p)).map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/produk/${product.id}`)}>
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={resolveImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                        <div className="flex items-center justify-between pt-4">
                          <span className="text-2xl font-bold text-primary">
                            Rp {product.price?.toLocaleString("id-ID")}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); navigate(`/produk/${product.id}`); }}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                              className="gradient-primary"
                            >
                              Beli
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "ebook" && (
            <div>
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i}>
                      <Skeleton className="aspect-video rounded-t-lg" />
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full mt-2" />
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              ) : ebooks.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-muted-foreground">Belum ada e-book tersedia.</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {ebooks.filter((p) => matchesSearch(p) && matchesCategory(p)).map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all cursor-pointer" onClick={() => navigate(`/produk/${product.id}`)}>
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={resolveImageUrl(product.image_url)}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <CardHeader>
                        <CardTitle className="text-xl">{product.name}</CardTitle>
                        <CardDescription>{product.description}</CardDescription>
                        <div className="flex items-center justify-between pt-4">
                          <span className="text-2xl font-bold text-primary">
                            Rp {product.price?.toLocaleString("id-ID")}
                          </span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); navigate(`/produk/${product.id}`); }}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                              className="gradient-primary"
                            >
                              Beli
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <ProductDetailPopup
        product={selectedProduct}
        isOpen={isPopupOpen}
        onClose={() => setIsPopupOpen(false)}
        onAddToCart={handleAddToCart}
      />

      <Footer />
    </div>
  );
};

export default Produk;
