import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Target, Users, TrendingUp, Award, Briefcase, Smile, FolderGit2 } from "lucide-react";
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
import { AnimatedCounter } from "@/components/ui/animated-counter";

import { Helmet } from "react-helmet-async";

const About = () => {
  const [content, setContent] = useState<any>({});
  const [meta, setMeta] = useState({ title: "Tentang Kami - Moodlab", description: "Agensi Digital Kreatif untuk UMKM" });

  useEffect(() => {
    const fetchContent = async () => {
      try {
        // Dynamic import for client components
        const { db } = await import("@/lib/turso");
        const { pages } = await import("@/db/schema");
        const { eq } = await import("drizzle-orm");

        const result = await db.select().from(pages).where(eq(pages.path, "/about"));
        if (result.length > 0) {
          setMeta({
            title: result[0].title,
            description: result[0].description || "Agensi Digital Kreatif untuk UMKM"
          });
          if (result[0].content) {
            try {
              const parsed = JSON.parse(result[0].content);
              setContent(parsed);
            } catch (e) {
              console.error("Failed to parse About page content JSON:", e);
            }
          }
        }
      } catch (e) {
        console.error("Failed to fetch About page content:", e);
      }
    };
    fetchContent();
  }, []);

  // Fallback map for icons since JSON can't store function references cleanly without a mapping system
  const iconMap: Record<string, any> = {
    FolderGit2, Smile, Briefcase, Award, Target, Users, TrendingUp
  };

  const stats = (content.stats || [
    { label: "Proyek Selesai", value: 150, iconName: "FolderGit2", color: "text-blue-500" },
    { label: "Klien Puas", value: 120, iconName: "Smile", color: "text-yellow-500" },
    { label: "Tahun Pengalaman", value: 5, iconName: "Briefcase", color: "text-purple-500" },
    { label: "Penghargaan", value: 12, iconName: "Award", color: "text-red-500" },
  ]).map((stat: any) => ({
    ...stat,
    icon: iconMap[stat.iconName || "Award"] || Award
  }));


  const faqs = content.faq || [
    {
      question: "Berapa lama waktu yang dibutuhkan untuk pembuatan website?",
      answer: "Waktu pembuatan website bervariasi tergantung kompleksitas proyek. Website sederhana dapat diselesaikan dalam 2-4 minggu, sementara website dengan fitur e-commerce atau custom dapat memakan waktu 6-8 minggu.",
    },
    {
      question: "Apakah layanan konsultasi mencakup implementasi?",
      answer: "Layanan konsultasi fokus pada analisis dan strategi. Untuk eksekusi penuh, kami menawarkan layanan Kerjasama Agensi.",
    },
    {
      question: "Apakah produk digital bisa untuk komersial?",
      answer: "Ya, template dan e-book dapat digunakan untuk keperluan bisnis/komersial Anda sendiri, namun tidak untuk dijual kembali.",
    },
  ];

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <Helmet>
        <title>{meta.title}</title>
        <meta name="description" content={meta.description} />
      </Helmet>
      <Navbar />

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-4 relative overflow-hidden bg-white dark:bg-black">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] opacity-50 dark:opacity-20"></div>
        <div className="container mx-auto max-w-6xl relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            {content.hero_title ? (
              <h1 className="text-4xl md:text-6xl font-bold mb-6">{content.hero_title}</h1>
            ) : (
              <h1 className="text-4xl md:text-6xl font-bold text-neutral-900 dark:text-white mb-6">
                Tentang <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Moodlab</span>
              </h1>
            )}
            <p className="text-xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
              {content.hero_subtitle || "Membangun merek yang relevan dan autentik di era digital dengan pendekatan berbasis data dan kreativitas tanpa batas."}
            </p>
          </motion.div>
        </div>
      </section>

      {/* Stats Section (New) */}
      <section className="py-12 border-y border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <div className="container mx-auto max-w-6xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, scale: 0.5 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center space-y-2"
              >
                <div className={`mx-auto w-12 h-12 rounded-2xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center mb-4 ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
                <div className="text-4xl font-bold text-neutral-900 dark:text-white tabular-nums">
                  <AnimatedCounter value={stat.value} />
                  {stat.label !== "Tahun Pengalaman" && "+"}
                </div>
                <div className="text-sm font-medium text-neutral-500 uppercase tracking-wide">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Vision & Mission (Redesigned) */}
      <section className="py-24 px-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-medium dark:bg-blue-900/30 dark:text-blue-400">
                  Our Vision
                </div>
                <h2 className="text-3xl md:text-4xl font-bold text-neutral-900 dark:text-white">
                  {content.vision_title || "Menjadi Mitra Pertumbuhan UMKM Digital"}
                </h2>
                <p className="text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  {content.vision_text || "Visi kami adalah memdemokratisasi akses ke strategi branding kelas dunia. Kami percaya setiap bisnis, sekecil apapun, berhak memiliki suara yang didengar."}
                </p>
              </div>

              <div className="grid gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center flex-shrink-0 dark:bg-purple-900/30">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Trend Adaptation</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">Selalu relevan dengan perubahan algoritma dan tren budaya pop.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-pink-100 text-pink-600 flex items-center justify-center flex-shrink-0 dark:bg-pink-900/30">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold mb-2">Community First</h3>
                    <p className="text-neutral-600 dark:text-neutral-400">Fokus pada membangun komunitas setia, bukan sekadar angka followers.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500 to-purple-500 rounded-3xl transform rotate-3 opacity-20 blur-2xl"></div>
              <img
                src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80"
                alt="Team collaboration"
                className="relative rounded-3xl shadow-2xl border-4 border-white dark:border-neutral-800"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Meet Mody Section (Enhanced) */}
      <section className="py-24 px-4 bg-white dark:bg-black overflow-hidden">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Meet the Brains</h2>
            <p className="text-neutral-500">Kolaborasi Kecerdasan Buatan & Kreativitas Manusia</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Tilt Card Effect for Mody */}
            <motion.div
              whileHover={{ scale: 1.02, rotateY: 5, rotateX: -5 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="relative group perspective-1000"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-3xl blur-xl opacity-30 group-hover:opacity-50 transition-opacity"></div>
              <div className="relative bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-3xl p-8 shadow-2xl">
                <div className="relative w-48 h-48 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-tr from-purple-400 to-pink-400 rounded-full blur-2xl opacity-40 animate-pulse"></div>
                  <img
                    src={ModyAvatar}
                    alt="Mody - AI Assistant"
                    className="relative w-full h-full object-cover rounded-full border-4 border-white shadow-lg"
                  />
                </div>
                <h3 className="text-2xl font-bold text-center mb-1">Mody AI</h3>
                <p className="text-purple-600 text-center font-medium mb-4">Virtual Assistant</p>
                <p className="text-center text-neutral-600 dark:text-neutral-400 italic">
                  "Saya menganalisis jutaan data tren agar strategi Anda selalu one step ahead."
                </p>
              </div>
            </motion.div>

            {/* Human Profile */}
            <div className="relative group">
              <div className="bg-neutral-50 dark:bg-neutral-900 rounded-3xl p-8 border border-neutral-200 dark:border-neutral-800">
                <h3 className="text-2xl font-bold mb-2">Hengki Setiawan</h3>
                <p className="text-blue-600 font-medium mb-6">Founder & Lead Developer</p>

                <div className="space-y-4 text-neutral-600 dark:text-neutral-400 leading-relaxed">
                  <p>
                    Mahasiswa Bisnis Digital yang memiliki passion dalam menggabungkan teknologi dan strategi bisnis.
                  </p>
                  <p>
                    Project Moodlab ini lahir dari keinginan untuk membantu teman-teman UMKM yang sering kesulitan mengikuti cepatnya perubahan tren digital.
                  </p>
                </div>

                <div className="mt-8 flex gap-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">Expertise</span>
                    <span className="text-sm text-neutral-500">Web Dev, Digital Marketing</span>
                  </div>
                  <div className="w-px h-10 bg-neutral-200 dark:bg-neutral-800"></div>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-neutral-900 dark:text-white">Education</span>
                    <span className="text-sm text-neutral-500">Universitas Negeri Makassar</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Frequently Asked Questions</h2>
          <Card className="border-none shadow-lg bg-white dark:bg-neutral-900">
            <CardContent className="p-8">
              <Accordion type="single" collapsible className="w-full">
                {faqs.map((faq, index) => (
                  <AccordionItem key={index} value={`item-${index}`} className="border-b-neutral-100 dark:border-b-neutral-800">
                    <AccordionTrigger className="text-left font-semibold text-lg hover:no-underline hover:text-blue-600 transition-colors py-4">
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent className="text-neutral-600 dark:text-neutral-400 text-base leading-relaxed pb-6">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default About;