import { useEffect, useState } from "react";
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
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
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

  const templates = products.filter(product => product.type === "template");
  const ebooks = products.filter(product => product.type === "ebook");

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

          <div className="flex justify-center mb-12">
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

          {activeTab === "template" && (
            <div>
              {isLoading ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-video bg-muted rounded-t-lg"></div>
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
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
                  {templates.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all">
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={product.image_url || "/placeholder.svg"}
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
                              onClick={() => navigate(`/produk/${product.id}`)}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(product)}
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
                    <Card key={i} className="animate-pulse">
                      <div className="aspect-video bg-muted rounded-t-lg"></div>
                      <CardHeader>
                        <div className="h-6 bg-muted rounded w-3/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
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
                  {ebooks.map((product) => (
                    <Card key={product.id} className="group hover:shadow-lg transition-all">
                      <div className="aspect-video overflow-hidden rounded-t-lg">
                        <img
                          src={product.image_url || "/placeholder.svg"}
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
                              onClick={() => navigate(`/produk/${product.id}`)}
                            >
                              Detail
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleAddToCart(product)}
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
