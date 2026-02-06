import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Sparkles, Target, TrendingUp, Users, Zap, BarChart3, Heart } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MotionSection } from "@/components/MotionSection";
import { BentoGrid, BentoGridItem } from "@/components/ui/bento-grid";
import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";
import { motion } from "framer-motion";

import { Helmet } from "react-helmet-async";

const Home = () => {
  const [content, setContent] = useState<any>({});
  const [meta, setMeta] = useState({ title: "Moodlab - Solusi Marketing Instan", description: "Jasa Pembuatan Website & Digital Marketing Profesional" });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const { db } = await import("@/lib/turso");
        const { pages } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const result = await db.select().from(pages).where(eq(pages.path, "/"));
        if (result.length > 0) {
          setMeta({
            title: result[0].title,
            description: result[0].description || "Jasa Pembuatan Website & Digital Marketing Profesional"
          });
          if (result[0].content) {
            try {
              const parsed = JSON.parse(result[0].content);
              setContent(parsed);
            } catch (e) {
              console.error("Failed to parse Home page content JSON:", e);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch Home page content:", e);
      }
    };
    fetchContent();
  }, []);

  const features = content.features || [
    {
      title: "Analisis Data Mendalam",
      description: "Strategi berbasis data untuk konten yang relevan dengan audiens muda.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"><BarChart3 className="m-auto h-10 w-10 text-primary opacity-50" /></div>,
      icon: <Target className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
    {
      title: "Adaptasi Tren Cepat",
      description: "Mengubah tren terkini menjadi kampanye personal.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"><Zap className="m-auto h-10 w-10 text-yellow-500 opacity-50" /></div>,
      icon: <TrendingUp className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Konten Autentik",
      description: "Produksi konten digital yang mendorong penyebaran organik.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"><Heart className="m-auto h-10 w-10 text-red-500 opacity-50" /></div>,
      icon: <Sparkles className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-1",
    },
    {
      title: "Komunitas Kuat",
      description: "Membangun relevansi budaya yang kuat di generasi digital.",
      header: <div className="flex flex-1 w-full h-full min-h-[6rem] rounded-xl bg-gradient-to-br from-neutral-200 to-neutral-100 dark:from-neutral-900 dark:to-neutral-800"><Users className="m-auto h-10 w-10 text-blue-500 opacity-50" /></div>,
      icon: <Users className="h-4 w-4 text-neutral-500" />,
      className: "md:col-span-2",
    },
  ];

  const testimonials = content.testimonials || [
    {
      quote: "Moodlab mengubah cara kami berinteraksi dengan audiens. Engagement naik 300%!",
      name: "Andi Pratama",
      title: "Owner Kopi Senja",
    },
    {
      quote: "Desain yang fresh dan strategi yang tepat sasaran. Sangat merekomendasikan layanan mereka.",
      name: "Sarah Wijaya",
      title: "Fashion Influencer",
    },
    {
      quote: "Template kontennya sangat membantu tim kami bekerja lebih efisien.",
      name: "Budi Santoso",
      title: "Digital Marketer",
    },
    {
      quote: "Konsultasi yang membuka wawasan baru tentang branding di era Gen Z.",
      name: "Jessica Tan",
      title: "Startup Founder",
    },
    {
      quote: "Website yang dibangun Moodlab sangat profesional dan mudah dikelola.",
      name: "Rizky Ramadhan",
      title: "Tech Blogger",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 font-sans selection:bg-primary/20">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 h-full w-full bg-white dark:bg-black [background:radial-gradient(125%_125%_at_50%_10%,#fff_40%,#63e_100%)] opacity-50"></div>

        <div className="container mx-auto max-w-6xl relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center space-y-8"
          >
            <div className="inline-flex items-center rounded-full border border-neutral-200 bg-white/50 px-3 py-1 text-sm leading-6 text-neutral-600 backdrop-blur-xl ring-1 ring-white/10 dark:border-neutral-800 dark:bg-black/50 dark:text-neutral-400">
              <span className="flex items-center gap-1">
                <Sparkles className="h-4 w-4 text-yellow-500" />
                {content.hero_badge || "Temukan Mood Kamu"}
              </span>
            </div>

            {content.hero_title ? (
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 animate-gradient-x pb-2">
                {content.hero_title}
              </h1>
            ) : (
              <h1 className="text-5xl md:text-7xl font-bold leading-tight tracking-tight text-neutral-900 dark:text-white">
                Temukan <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-600 to-indigo-600">Mood</span>
                <br />
                untuk <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-rose-500">Upgrade Bisnis Kamu</span>
              </h1>
            )}

            <p className="text-xl text-neutral-600 dark:text-neutral-300 max-w-2xl mx-auto leading-relaxed">
              {content.hero_subtitle || (
                <>Moodlab hadir untuk membantu anda membangun konten yang relevan,
                  autentik, dan mengubah engagement menjadi loyalitas pelanggan jangka panjang.</>
              )}
            </p>

            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="flex flex-col sm:flex-row gap-4 justify-center pt-8"
            >
              <Button size="lg" asChild className="h-14 px-8 rounded-full text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all shadow-lg hover:shadow-indigo-500/25 hover:-translate-y-1">
                <Link to="/layanan">
                  Lihat Layanan
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-8 rounded-full text-lg border-2 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 transition-all">
                <Link to="/produk">Jelajahi Produk</Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Infinite Marquee Section */}
      <section className="py-10 bg-white dark:bg-black border-y border-neutral-200 dark:border-neutral-800">
        <div className="flex flex-col items-center justify-center space-y-4 mb-8">
          <p className="text-sm font-medium text-neutral-500 uppercase tracking-widest">
            {content.testimonials_title || "Dipercaya oleh Pemimpin Industri"}
          </p>
        </div>
        <InfiniteMovingCards items={testimonials} direction="right" speed="slow" />
      </section>

      {/* Bento Grid Features Section */}
      <MotionSection className="py-24 px-4 bg-neutral-50 dark:bg-neutral-950" delay={0.2}>
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-neutral-900 to-neutral-600 dark:from-white dark:to-neutral-400">
              Mengapa Memilih Moodlab?
            </h2>
            <p className="text-neutral-500 max-w-2xl mx-auto text-lg">
              Kami fokus pada data, tren, dan konten autentik untuk membangun merek yang kuat di era digital
            </p>
          </div>

          <BentoGrid>
            {features.map((item, i) => (
              <BentoGridItem
                key={i}
                title={item.title}
                description={item.description}
                header={item.header}
                icon={item.icon}
                className={item.className}
              />
            ))}
          </BentoGrid>
        </div>
      </MotionSection>

      {/* Services Preview (Kept Classic but Polished) */}
      <MotionSection className="py-24 px-4 bg-white dark:bg-neutral-900" delay={0.2}>
        <div className="container mx-auto max-w-6xl">

          <div className="flex justify-between items-end mb-12">
            <div className="max-w-xl">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">{content.services_title || "Layanan Unggulan"}</h2>
              <p className="text-neutral-500 text-lg">
                {content.services_subtitle || "Solusi komprehensif untuk pertumbuhan bisnis Anda."}
              </p>
            </div>
            <Button variant="ghost" className="hidden md:flex gap-2" asChild>
              <Link to="/layanan">Lihat Semua <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>


          <div className="grid md:grid-cols-2 gap-8">
            <Card className="group relative overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-blue-500/20 transition-all"></div>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                  Konsultasi Pemasaran
                </CardTitle>
                <CardDescription className="text-base pt-2">
                  Analisis mendalam dan strategi yang tepat untuk media sosial dan website Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-3"></span>
                    Optimalisasi Media Sosial
                  </li>
                  <li className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <span className="h-2 w-2 rounded-full bg-blue-500 mr-3"></span>
                    SEO & Web Analytics
                  </li>
                </ul>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white" asChild>
                  <Link to="/layanan/consultation">Pelajari Lebih Lanjut</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="group relative overflow-hidden border-2 border-neutral-100 dark:border-neutral-800 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-purple-500/20 transition-all"></div>
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-3">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30">
                    <Target className="w-6 h-6" />
                  </div>
                  Layanan Kreatif
                </CardTitle>
                <CardDescription className="text-base pt-2">
                  Solusi end-to-end untuk kebutuhan pemasaran digital Anda dari hulu ke hilir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mr-3"></span>
                    Creative Content Production
                  </li>
                  <li className="flex items-center text-neutral-600 dark:text-neutral-300">
                    <span className="h-2 w-2 rounded-full bg-purple-500 mr-3"></span>
                    Website Development
                  </li>
                </ul>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white" asChild>
                  <Link to="/layanan/agency">Pelajari Lebih Lanjut</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </MotionSection>

      {/* CTA Section */}
      <section className="py-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-neutral-900 dark:to-neutral-800"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#4f4f4f0a_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f0a_1px,transparent_1px)] bg-[size:14px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]"></div>

        <div className="container mx-auto max-w-4xl relative z-10 text-center">
          <h2 className="text-4xl md:text-6xl font-bold mb-6 text-neutral-900 dark:text-white tracking-tight">
            {content.cta_title || "Siap Mengubah Brand Anda?"}
          </h2>
          <p className="text-xl text-neutral-600 dark:text-neutral-400 mb-10 max-w-2xl mx-auto">
            {content.cta_description || "Mulai perjalanan Anda bersama Moodlab hari ini. Bergabunglah dengan ratusan brand yang telah tumbuh bersama kami."}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="h-14 px-10 rounded-full text-lg bg-primary text-white hover:bg-primary/90 transition-all font-semibold" asChild>
              <Link to="/kontak">Hubungi Kami</Link>
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-10 rounded-full text-lg border-neutral-300 dark:border-neutral-700 text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-all bg-transparent" asChild>
              <Link to="/about">Pelajari Tim Kami</Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;