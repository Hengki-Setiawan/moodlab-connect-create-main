import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Setelah login, cek apakah user adalah admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Gunakan RPC has_role agar bypass RLS
        const { data: hasRole, error: roleError } = await supabase.rpc('has_role', {
          _user_id: user.id,
          _role: 'admin',
        });

        if (!roleError && hasRole === true) {
          toast.success("Berhasil masuk sebagai admin!");
          navigate("/admin-dashboard");
          return;
        }
      }

      toast.success("Berhasil masuk!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error("Gagal masuk", {
        description: error.message || "Periksa email dan password Anda",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    try {
      const redirectUrl = `https://www.moodlab.web.id/`;
      
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: redirectUrl,
        },
      });

      if (error) throw error;

      toast.success("Akun berhasil dibuat!", {
        description: "Silakan cek email Anda untuk verifikasi",
      });
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error("Gagal membuat akun", {
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-md">
          <Card className="border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl">Selamat Datang</CardTitle>
              <CardDescription>Masuk atau buat akun untuk melanjutkan</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Masuk</TabsTrigger>
                  <TabsTrigger value="signup">Daftar</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        name="email"
                        type="email"
                        required
                        placeholder="email@example.com"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="mt-1.5"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full gradient-primary"
                      size="lg"
                    >
                      {isLoading ? "Memproses..." : "Masuk"}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="signup">
                  <form onSubmit={handleSignup} className="space-y-4 mt-4">
                    <div>
                      <Label htmlFor="signup-name">Nama Lengkap</Label>
                      <Input
                        id="signup-name"
                        name="fullName"
                        required
                        placeholder="John Doe"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        name="email"
                        type="email"
                        required
                        placeholder="email@example.com"
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        name="password"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="mt-1.5"
                        minLength={6}
                      />
                    </div>
                    <div>
                      <Label htmlFor="signup-confirm">Konfirmasi Password</Label>
                      <Input
                        id="signup-confirm"
                        name="confirmPassword"
                        type="password"
                        required
                        placeholder="••••••••"
                        className="mt-1.5"
                        minLength={6}
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full gradient-primary"
                      size="lg"
                    >
                      {isLoading ? "Memproses..." : "Daftar"}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Auth;