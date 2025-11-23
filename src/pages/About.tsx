import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, TrendingUp, Award } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ModyAvatar from "@/assets/mody-avatar.png";
import { motion } from "framer-motion";

const About = () => {
  const [content, setContent] = useState<{ hero_title?: string; hero_subtitle?: string }>({});
  const faqs = [
    {
      question: "Berapa lama waktu yang dibutuhkan untuk pembuatan website?",
      answer: "Waktu pembuatan website bervariasi tergantung kompleksitas proyek. Website sederhana dapat diselesaikan dalam 2-4 minggu, sementara website dengan fitur e-commerce atau custom dapat memakan waktu 6-8 minggu. Kami akan memberikan timeline yang jelas setelah konsultasi awal.",
    },
    {
      question: "Apakah layanan konsultasi mencakup implementasi?",
      answer: "Layanan konsultasi fokus pada analisis, strategi, dan rekomendasi. Jika Anda membutuhkan implementasi, kami menawarkan layanan Kerjasama Agensi yang mencakup eksekusi penuh dari strategi yang telah dirancang.",
    },
    {
      question: "Bagaimana alur pembelian e-book dan template?",
      answer: "Anda dapat memilih produk digital yang diinginkan, menambahkannya ke keranjang, dan melakukan pembayaran melalui Midtrans. Setelah pembayaran berhasil, file digital akan langsung tersedia untuk diunduh di akun Anda.",
    },
    {
      question: "Apakah harga layanan agensi bisa dinegosiasikan?",
      answer: "Kami menawarkan paket yang fleksibel sesuai kebutuhan dan budget Anda. Silakan hubungi kami untuk konsultasi dan kami akan menyusun proposal yang sesuai dengan kebutuhan spesifik bisnis Anda.",
    },
    {
      question: "Apakah produk digital yang dibeli bisa digunakan untuk komersial?",
      answer: "Ya, semua template dan e-book yang Anda beli dapat digunakan untuk keperluan komersial. Namun, Anda tidak diperkenankan untuk menjual kembali produk tersebut sebagai template atau e-book.",
    },
  ];

  useEffect(() => {
    const fetchContent = async () => {
      const { data } = await (supabase as any).from('page_contents').select('content').eq('page', 'about').maybeSingle();
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
          <div className="text-center space-y-4 mb-16">
            {content.hero_title ? (
              <h1 className="text-4xl md:text-6xl font-bold">{content.hero_title}</h1>
            ) : (
              <h1 className="text-4xl md:text-6xl font-bold">
                Tentang <span className="gradient-text">Moodlab</span>
              </h1>
            )}
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {content.hero_subtitle || "Membangun merek yang relevan dan autentik di era digital"}
            </p>
          </div>

          {/* About Us */}
          <div className="mb-20">
            <Card className="border-2">
              <CardContent className="p-8 md:p-12">
                <h2 className="text-3xl font-bold mb-6">Siapa Kami</h2>
                <p className="text-muted-foreground leading-relaxed text-lg">
                  Moodlab hadir untuk menjawab tantangan yang dihadapi oleh banyak merek, terutama UMKM,
                  dalam mengubah popularitas sesaat menjadi loyalitas pelanggan Gen Z. Kami memahami "mood"
                  audiens kami, dan kami menggunakan pemahaman ini untuk menghasilkan konten yang terasa personal,
                  relevan, dan menghubungkan merek Anda dengan audiens secara autentik.
                </p>
                <p className="text-muted-foreground leading-relaxed text-lg mt-4">
                  Dengan keahlian yang kami asah dalam industri kuliner, kami fokus membangun merek yang kuat
                  dan bukan sekadar menjual produk.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Vision & Mission */}
          <div className="grid md:grid-cols-2 gap-8 mb-20">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardContent className="p-8">
                <Target className="h-12 w-12 text-primary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Visi</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Menjadi mitra utama bagi UMKM yang ingin tumbuh dengan membangun relevansi budaya yang kuat
                  di tengah generasi digital.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-secondary transition-colors">
              <CardContent className="p-8">
                <TrendingUp className="h-12 w-12 text-secondary mb-4" />
                <h3 className="text-2xl font-bold mb-4">Misi</h3>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2 mt-2 flex-shrink-0"></span>
                    <span>Menganalisis konten yang relevan dengan audiens muda untuk menyusun strategi berbasis data</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2 mt-2 flex-shrink-0"></span>
                    <span>Mengadaptasi tren terkini menjadi kampanye pemasaran yang lebih personal dan terhubung</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2 mt-2 flex-shrink-0"></span>
                    <span>Memproduksi konten digital otentik yang mendorong penyebaran organik oleh komunitas</span>
                  </li>
                  <li className="flex items-start">
                    <span className="h-1.5 w-1.5 rounded-full bg-secondary mr-2 mt-2 flex-shrink-0"></span>
                    <span>Memberikan wawasan tentang mengapa konten menjadi viral untuk mendukung keputusan strategis</span>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Values */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Nilai-Nilai Kami</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <Card className="text-center">
                <CardContent className="p-6">
                  <Users className="h-10 w-10 text-primary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Autentik</h3>
                  <p className="text-sm text-muted-foreground">
                    Kami percaya pada konten yang genuine dan relevan dengan audiens
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <TrendingUp className="h-10 w-10 text-secondary mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Data-Driven</h3>
                  <p className="text-sm text-muted-foreground">
                    Keputusan strategis didasarkan pada analisis data yang mendalam
                  </p>
                </CardContent>
              </Card>

              <Card className="text-center">
                <CardContent className="p-6">
                  <Award className="h-10 w-10 text-accent mx-auto mb-4" />
                  <h3 className="font-bold text-lg mb-2">Berkualitas</h3>
                  <p className="text-sm text-muted-foreground">
                    Kami berkomitmen memberikan hasil terbaik untuk setiap proyek
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Portfolio Section - Placeholder */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Portofolio</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {/* Project 1 */}
              <Card className="overflow-hidden border-2 hover:border-primary transition-colors">
                <div className="h-48 overflow-hidden">
                  <img
                    src="/portfolio-gen-z.png"
                    alt="Campaign Viral Gen Z Vibes"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2">Campaign Viral "Gen Z Vibes"</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Meningkatkan engagement rate sebesar 300% melalui konten TikTok yang relatable.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Social Media</span>
                    <span className="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">Viral Marketing</span>
                  </div>
                </CardContent>
              </Card>

              {/* Project 2 */}
              <Card className="overflow-hidden border-2 hover:border-secondary transition-colors">
                <div className="h-48 overflow-hidden">
                  <img
                    src="/portfolio-kopi-senja.png"
                    alt="Rebranding Kopi Senja"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2">Rebranding "Kopi Senja"</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Meremajakan identitas visual brand untuk menarik segmen pasar yang lebih muda.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full">Branding</span>
                    <span className="bg-secondary/10 text-secondary text-xs px-2 py-1 rounded-full">Design</span>
                  </div>
                </CardContent>
              </Card>

              {/* Project 3 */}
              <Card className="overflow-hidden border-2 hover:border-accent transition-colors">
                <div className="h-48 overflow-hidden">
                  <img
                    src="/portfolio-influencer.png"
                    alt="Influencer Activation"
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl mb-2">Influencer Activation</h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    Kolaborasi dengan 50+ mikro-influencer untuk peluncuran produk gadget terbaru.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">Influencer</span>
                    <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">Campaign</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Meet Mody Section */}
          <div className="mb-20">
            <h2 className="text-3xl font-bold mb-8 text-center">Kenalan dengan <span className="gradient-text">Mody</span></h2>
            <Card className="border-2 overflow-hidden">
              <CardContent className="p-8 md:p-12">
                <div className="grid md:grid-cols-2 gap-8 items-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5 }}
                    className="flex justify-center"
                  >
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full blur-2xl opacity-30 animate-pulse"></div>
                      <motion.img
                        src={ModyAvatar}
                        alt="Mody - AI Assistant"
                        className="relative w-64 h-64 md:w-80 md:h-80 object-cover rounded-full border-4 border-white shadow-2xl"
                        whileHover={{ scale: 1.05, rotate: 5 }}
                        transition={{ type: "spring", stiffness: 300 }}
                      />
                    </div>
                  </motion.div>
                  <div className="space-y-4">
                    <h3 className="text-2xl md:text-3xl font-bold">
                      Hai! Saya <span className="gradient-text">Mody</span> 👋
                    </h3>
                    <p className="text-muted-foreground leading-relaxed text-lg">
                      Saya adalah AI chatbot assistant dari Moodlab yang siap membantu Anda 24/7!
                      Dengan pemahaman mendalam tentang digital marketing dan branding, saya di sini
                      untuk menjawab pertanyaan Anda tentang layanan kami, memberikan rekomendasi,
                      dan membantu Anda menemukan solusi terbaik untuk bisnis Anda.
                    </p>
                    <div className="space-y-2">
                      <p className="text-muted-foreground flex items-start gap-2">
                        <span className="text-primary font-bold">💬</span>
                        <span>Tanya saya apa saja tentang Moodlab</span>
                      </p>
                      <p className="text-muted-foreground flex items-start gap-2">
                        <span className="text-secondary font-bold">🎯</span>
                        <span>Dapatkan rekomendasi strategi digital marketing</span>
                      </p>
                      <p className="text-muted-foreground flex items-start gap-2">
                        <span className="text-accent font-bold">✨</span>
                        <span>Konsultasi gratis untuk kebutuhan bisnis Anda</span>
                      </p>
                    </div>
                    <div className="pt-4">
                      <p className="text-sm text-muted-foreground italic">
                        Klik chat widget di pojok kanan bawah untuk mulai berbincang dengan saya!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div>
            <h2 className="text-3xl font-bold mb-8 text-center">FAQ</h2>
            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {faqs.map((faq, index) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
};

export default About;