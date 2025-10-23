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

const About = () => {
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

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-6xl font-bold">
              Tentang <span className="gradient-text">Moodlab</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Membangun merek yang relevan dan autentik di era digital
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
            <Card className="border-2">
              <CardContent className="p-12 text-center">
                <p className="text-muted-foreground">
                  Kami telah menangani berbagai proyek, mulai dari pembuatan konten yang relevan hingga 
                  pengelolaan kampanye pemasaran digital untuk klien kami. Hubungi kami untuk melihat 
                  portofolio lengkap kami.
                </p>
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
