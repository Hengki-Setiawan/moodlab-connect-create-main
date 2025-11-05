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
import { Skeleton } from "@/components/ui/skeleton";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  type: "template" | "ebook" | "service";
  category: string;
  image_url: string | null;
  stock: number;
  file_url?: string | null;
}

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { addToCart } = useCart();
  const [digitalAvailable, setDigitalAvailable] = useState(true);

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  useEffect(() => {
    const fetchRelated = async () => {
      if (!product) return;
      const { data, error } = await supabase
        .from("products")
        .select("id, name, description, price, image_url, type, category, stock")
        .eq("type", product.type)
        .eq("category", product.category)
        .neq("id", product.id)
        .limit(6);
      if (error) {
        console.error("Error fetching related products:", error);
        return;
      }
      setRelatedProducts((data || []) as Product[]);
    };
    fetchRelated();
  }, [product]);

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

  // Cek ketersediaan file digital saat produk dimuat
  useEffect(() => {
    (async () => {
      if (!product) return;
      if (product.type === 'service') { setDigitalAvailable(true); return; }
      const url = (product.file_url || '').trim();
      if (!url) { setDigitalAvailable(false); return; }
      try {
        const res = await fetch(url, { method: 'HEAD' });
        setDigitalAvailable(res.ok);
      } catch (e) {
        console.error('HEAD check gagal pada ProductDetail:', e);
        setDigitalAvailable(false);
      }
    })();
  }, [product]);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="container mx-auto max-w-6xl pt-32 pb-20 px-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-1/4" />
            <Skeleton className="h-64" />
            <Skeleton className="h-8 w-1/2" />
            <Skeleton className="h-32" />
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

          {product && (
            <div className="text-sm text-muted-foreground mb-6">
              <span className="cursor-pointer hover:underline" onClick={() => navigate("/produk")}>
                Produk
              </span>
              <span className="mx-2">/</span>
              <span className="cursor-pointer hover:underline" onClick={() => navigate(`/produk?tab=${product.type}&category=${(product.category||'').toLowerCase()}`)}>
                {(product.type || '').toUpperCase()}
              </span>
              <span className="mx-2">/</span>
              <span className="font-medium text-foreground">{product.name}</span>
            </div>
          )}

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
                <div className="flex gap-2 mt-3">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      const shareData = {
                        title: product.name,
                        text: product.description || product.name,
                        url: window.location.href,
                      };
                      try {
                        if (navigator.share) {
                          await navigator.share(shareData);
                        } else {
                          await navigator.clipboard.writeText(window.location.href);
                          alert("Link produk telah disalin ke clipboard");
                        }
                      } catch (e) {
                        console.error(e);
                      }
                    }}
                  >
                    Bagikan
                  </Button>
                </div>
              </div>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-2">Deskripsi Produk</h3>
                  <p className="text-muted-foreground whitespace-pre-line">
                    {product.description}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-2">Apa yang Anda Dapatkan</h3>
                  <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                    {product.type === 'template' && (
                      <>
                        <li>File siap pakai dan mudah disesuaikan</li>
                        <li>Desain profesional dan modern</li>
                        <li>Panduan singkat penggunaan</li>
                        <li>Pembaruan minor bila diperlukan</li>
                      </>
                    )}
                    {product.type === 'ebook' && (
                      <>
                        <li>Konten PDF ringkas dan praktis</li>
                        <li>Akses selamanya di perangkat Anda</li>
                        <li>Contoh kasus untuk tiap bab</li>
                        <li>Tips implementasi yang bisa langsung dipraktikkan</li>
                      </>
                    )}
                    {product.type === 'service' && (
                      <>
                        <li>Konsultasi dan eksekusi sesuai kebutuhan</li>
                        <li>Laporan progres berkala</li>
                        <li>Support via chat/email selama periode layanan</li>
                        <li>Strategi disesuaikan dengan industri Anda</li>
                      </>
                    )}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <h3 className="text-xl font-bold mb-2">Spesifikasi</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tipe</span>
                      <div className="font-medium capitalize">{product.type}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Kategori</span>
                      <div className="font-medium capitalize">{product.category}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Stok</span>
                      <div className="font-medium">{product.stock ?? 0}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Format</span>
                      <div className="font-medium">{product.type === 'ebook' ? 'PDF' : product.type === 'template' ? 'File Template' : 'Layanan'}</div>
                    </div>
                  </div>
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
                  disabled={product.stock === 0 || !digitalAvailable}
                >
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  {product.stock === 0
                    ? "Stok Habis"
                    : !digitalAvailable
                      ? "File Tidak Tersedia"
                      : "Tambah ke Keranjang"}
                </Button>
              )}
            </div>
          </div>

          <div className="mt-12">
            <Card>
              <CardContent className="pt-6">
                <h3 className="text-lg font-semibold mb-2">Jaminan Kepuasan</h3>
                <p className="text-sm text-muted-foreground">
                  Kami berkomitmen menghadirkan produk dan layanan berkualitas. Butuh bantuan?
                  Hubungi kami melalui halaman Kontak. Tim kami siap membantu.
                </p>
              </CardContent>
            </Card>
          </div>

          {relatedProducts.length > 0 && (
            <div className="mt-12">
              <h3 className="text-2xl font-semibold mb-4">Produk Terkait</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {relatedProducts.map((rp) => (
                  <div key={rp.id} className="border rounded-lg overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => navigate(`/produk/${rp.id}`)}>
                    <div className="aspect-video overflow-hidden">
                      <img src={resolveImageUrl(rp.image_url)} alt={rp.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="p-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-semibold">{rp.name}</h4>
                        <span className="text-primary font-bold">{formatPrice(rp.price)}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{rp.description}</p>
                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/produk/${rp.id}`); }}>Detail</Button>
                        <Button size="sm" className="gradient-primary" onClick={async (e) => { e.stopPropagation(); await addToCart(rp.id); }}>Beli</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
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
