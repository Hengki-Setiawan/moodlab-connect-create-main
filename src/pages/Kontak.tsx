import { useState } from "react";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Mail, Instagram, Phone, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Kontak = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const message = formData.get("message") as string;

    try {
      const { error } = await supabase.from("consultations").insert({
        service_type: "General Inquiry",
        name,
        email,
        phone,
        message,
        status: "pending",
      });

      if (error) throw error;

      toast.success("Pesan berhasil dikirim!", {
        description: "Tim kami akan menghubungi Anda segera.",
      });

      e.currentTarget.reset();
    } catch (error) {
      console.error("Error submitting message:", error);
      toast.error("Gagal mengirim pesan", {
        description: "Silakan coba lagi atau hubungi kami langsung.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-4 mb-16">
            <h1 className="text-4xl md:text-6xl font-bold">
              Hubungi <span className="gradient-text">Kami</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Ada pertanyaan? Kami siap membantu Anda membangun merek yang kuat
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {/* Contact Form */}
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Kirim Pesan</CardTitle>
                <CardDescription>
                  Isi formulir di bawah ini dan tim kami akan segera menghubungi Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nama Lengkap</Label>
                    <Input 
                      id="name" 
                      name="name" 
                      required 
                      placeholder="Masukkan nama lengkap"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      name="email" 
                      type="email" 
                      required 
                      placeholder="email@example.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Nomor Telepon</Label>
                    <Input 
                      id="phone" 
                      name="phone" 
                      required 
                      placeholder="08xxxxxxxxxx"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="message">Pesan</Label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      placeholder="Ceritakan kebutuhan Anda..."
                      rows={5}
                      className="mt-1.5"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full gradient-primary"
                    size="lg"
                  >
                    {isSubmitting ? "Mengirim..." : "Kirim Pesan"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Contact Information */}
            <div className="space-y-6">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-primary/10">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <a 
                        href="mailto:moodlab.idn@gmail.com"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        moodlab.idn@gmail.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-secondary transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-secondary/10">
                      <Instagram className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Instagram</h3>
                      <a
                        href="https://instagram.com/moodlab.id1"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-secondary transition-colors"
                      >
                        @moodlab.id1
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 hover:border-accent transition-colors">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-accent/10">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">WhatsApp</h3>
                      <a
                        href="https://wa.me/6281341277339"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-accent transition-colors"
                      >
                        081341277339
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-2 gradient-primary animate-gradient text-primary-foreground">
                <CardContent className="p-6">
                  <div className="flex items-start space-x-4">
                    <div className="p-3 rounded-lg bg-white/20">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Jam Operasional</h3>
                      <p className="text-sm opacity-90">
                        Senin - Jumat: 09:00 - 18:00 WIB
                        <br />
                        Sabtu: 09:00 - 15:00 WIB
                        <br />
                        Minggu: Tutup
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Kontak;
