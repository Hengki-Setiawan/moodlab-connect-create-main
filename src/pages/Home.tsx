import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Target, TrendingUp, Users } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const Home = () => {
  const [content, setContent] = useState<{ hero_badge?: string; hero_title?: string; hero_subtitle?: string }>({});

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await supabase.from('page_contents').select('content').eq('page','home').maybeSingle();
      setContent(data?.content || {});
    };
    fetchContent();
  }, []);

  return (
    <div className="min-h-screen">
      <Navbar />
      
      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6">
            <div className="inline-flex items-center space-x-2 bg-muted px-4 py-2 rounded-full mb-4">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">{content.hero_badge || "Agensi Pemasaran Digital untuk Gen Z"}</span>
            </div>
            {content.hero_title ? (
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">{content.hero_title}</h1>
            ) : (
              <h1 className="text-5xl md:text-7xl font-bold leading-tight">
                Ubah <span className="gradient-text">Popularitas</span>
                <br />
                Menjadi <span className="gradient-text">Loyalitas</span>
              </h1>
            )}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {content.hero_subtitle || (
                <>Kami memahami "mood" audiens Gen Z Anda. Moodlab hadir untuk membangun konten yang relevan, 
                autentik, dan mengubah engagement menjadi loyalitas pelanggan jangka panjang.</>
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button size="lg" asChild className="gradient-primary animate-gradient">
                <Link to="/layanan">
                  Lihat Layanan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link to="/produk">Jelajahi Produk Digital</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Mengapa Memilih <span className="gradient-text">Moodlab</span>?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Kami fokus pada data, tren, dan konten autentik untuk membangun merek yang kuat di era digital
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Target className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Analisis Data</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Strategi berbasis data untuk konten yang relevan dengan audiens muda
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-secondary mb-2" />
                <CardTitle>Adaptasi Tren</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Mengubah tren terkini menjadi kampanye personal yang terhubung
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-accent transition-colors">
              <CardHeader>
                <Sparkles className="h-10 w-10 text-accent mb-2" />
                <CardTitle>Konten Autentik</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Produksi konten digital yang mendorong penyebaran organik
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>Fokus Komunitas</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Membangun relevansi budaya yang kuat di generasi digital
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Layanan Kami</h2>
            <p className="text-muted-foreground">
              Dari konsultasi hingga eksekusi penuh, kami siap membantu bisnis Anda tumbuh
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8">
            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Konsultasi Pemasaran</CardTitle>
                <CardDescription>
                  Analisis mendalam dan strategi yang tepat untuk media sosial dan website Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                    Optimalisasi Media Sosial
                  </li>
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mr-2"></span>
                    Optimalisasi Website & SEO
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/layanan">Pelajari Lebih Lanjut</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="text-2xl">Kerjasama Agensi</CardTitle>
                <CardDescription>
                  Solusi end-to-end untuk kebutuhan pemasaran digital Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2"></span>
                    Pembuatan Konten
                  </li>
                  <li className="flex items-center">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2"></span>
                    Pembuatan Website
                  </li>
                </ul>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/layanan">Pelajari Lebih Lanjut</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Products Preview */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Produk Digital</h2>
            <p className="text-muted-foreground">
              Template dan e-book siap pakai untuk mempercepat pertumbuhan bisnis Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Template Konten</CardTitle>
                <CardDescription>
                  Paket template polosan meme, carousel, dan bahan edit video
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Mulai dari Rp 50.000</p>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/produk">Lihat Template</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>E-book</CardTitle>
                <CardDescription>
                  Panduan lengkap e-commerce, pemasaran digital, dan pembuatan konten
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">Mulai dari Rp 80.000</p>
                <Button variant="outline" asChild className="w-full">
                  <Link to="/produk">Lihat E-book</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="border-2 border-primary hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>Paket Bundling</CardTitle>
                <CardDescription>
                  Dapatkan diskon khusus untuk pembelian paket lengkap
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-primary font-semibold mb-4">Hemat hingga 30%</p>
                <Button asChild className="w-full gradient-primary">
                  <Link to="/produk">Lihat Paket</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="gradient-primary animate-gradient rounded-2xl p-12 text-center text-primary-foreground">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Siap Mengubah Brand Anda?
            </h2>
            <p className="text-lg mb-8 opacity-90">
              Mulai perjalanan Anda bersama Moodlab hari ini dan lihat perbedaannya
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/kontak">Hubungi Kami</Link>
              </Button>
              <Button size="lg" variant="outline" className="bg-transparent border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary" asChild>
                <Link to="/about">Tentang Kami</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Home;