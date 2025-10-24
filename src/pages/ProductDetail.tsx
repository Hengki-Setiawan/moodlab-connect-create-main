import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ShoppingCart, ArrowLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { formatPrice } from "@/lib/utils";
import { getImageUrl } from "@/integrations/supabase/storage";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "template" | "ebook" | "service";
  category: string;
  image_url: string | null;
  stock: number;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("id", productId)
        .single();

      if (error) throw error;
      setProduct(data as Product);
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (product) {
      await addToCart(product.id);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-6xl pt-32 pb-20 px-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-muted rounded w-1/4"></div>
            <div className="h-64 bg-muted rounded"></div>
            <div className="h-8 bg-muted rounded w-1/2"></div>
            <div className="h-32 bg-muted rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-6xl pt-32 pb-20 px-4 text-center">
          <h2 className="text-2xl font-bold">Produk tidak ditemukan</h2>
          <Button onClick={goBack} className="mt-4">
            Kembali
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <Button
            variant="ghost"
            onClick={goBack}
            className="mb-6 flex items-center gap-2"
          >
            <ArrowLeft size={16} />
            Kembali
          </Button>

          <div className="grid md:grid-cols-2 gap-8">
            <div>
              {product.image_url ? (
                <img
                  src={resolveImageUrl(product.image_url)}
                  alt={product.name}
                  className="w-full h-auto rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                  <span className="text-muted-foreground">Tidak ada gambar</span>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold">{product.name}</h1>
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="capitalize">
                    {product.type}
                  </Badge>
                  <Badge variant="outline" className="capitalize">
                    {product.category}
                  </Badge>
                </div>
                <p className="text-2xl font-bold mt-4 text-primary">
                  {formatPrice(product.price)}
                </p>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-2">Deskripsi Produk</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </CardContent>
              </Card>

              {product.type === "service" ? (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Pesan Layanan
                </Button>
              ) : (
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {product.stock === 0 ? "Stok Habis" : "Tambah ke Keranjang"}
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

function resolveImageUrl(url: string | null) {
  if (!url) return "/placeholder.svg";
  const isHttp = /^https?:\/\//.test(url);
  if (isHttp) return url;
  return getImageUrl(url) || "/placeholder.svg";
}

export default ProductDetail;