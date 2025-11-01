import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const navigate = useNavigate();

  // Dengarkan event recovery dari Supabase
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setResetOpen(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string; // bisa email atau username
    const password = formData.get("password") as string;

    try {
      let emailToUse = identifier;

      // Jika bukan email, anggap sebagai username dan resolve ke email via RPC
      if (!identifier.includes("@")) {
        const { data: resolvedEmail, error: rpcError } = await supabase.rpc('get_auth_email_by_username', {
          _username: identifier,
        });
        // Jika fungsi RPC belum ada di DB, berikan pesan yang jelas
        if (rpcError) {
          const msg = typeof rpcError?.message === 'string' ? rpcError.message : '';
          if (msg.includes('Could not find the function') || msg.includes('schema cache')) {
            toast.error('Login dengan username belum aktif', {
              description: 'Fungsi RPC belum tersedia. Jalankan migrasi Supabase lalu coba lagi. Untuk sementara, gunakan email.',
            });
          }
          throw rpcError;
        }
        if (!resolvedEmail) throw new Error("Username tidak ditemukan");
        emailToUse = resolvedEmail;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
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
      const message = typeof error?.message === 'string' ? error.message : 'Periksa kredensial Anda';
      // Deteksi kemungkinan kesalahan API key Supabase
      if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('invalid key') || message.toLowerCase().includes('not allowed')) {
        toast.error('Konfigurasi Supabase bermasalah', {
          description: 'Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_ANON_KEY di .env. Jika perlu, masukkan API Key baru.',
        });
      }
      toast.error("Gagal masuk", { description: message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData(e.currentTarget);
    const fullName = formData.get("fullName") as string;
    const username = (formData.get("username") as string)?.trim();
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
            username,
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

  const handleSendResetEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!resetEmail || !resetEmail.includes('@')) {
        toast.error('Masukkan email yang valid');
        return;
      }
      const redirectTo = `${window.location.origin}/auth`;
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, { redirectTo });
      if (error) throw error;
      toast.success('Email reset password dikirim', { description: 'Silakan cek inbox Anda.' });
      setForgotOpen(false);
    } catch (err: any) {
      console.error('resetPassword error:', err);
      toast.error('Gagal mengirim email reset', { description: err.message });
    }
  };

  const handleUpdateNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!newPassword || newPassword.length < 6) {
        toast.error('Password baru minimal 6 karakter');
        return;
      }
      if (newPassword !== confirmNewPassword) {
        toast.error('Konfirmasi password tidak sama');
        return;
      }
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      toast.success('Password berhasil diperbarui');
      setResetOpen(false);
    } catch (err: any) {
      console.error('updateUser error:', err);
      toast.error('Gagal memperbarui password', { description: err.message });
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
                      <Label htmlFor="login-identifier">Email atau Username</Label>
                      <Input
                        id="login-identifier"
                        name="identifier"
                        type="text"
                        required
                        placeholder="email@example.com atau username"
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
                      <div className="mt-2 text-right">
                        <Button type="button" variant="link" onClick={() => setForgotOpen(true)}>
                          Lupa password?
                        </Button>
                      </div>
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
                      <Label htmlFor="signup-username">Username</Label>
                      <Input
                        id="signup-username"
                        name="username"
                        required
                        placeholder="moodlab_user"
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
          {/* Dialog Lupa Password */}
          <Dialog open={forgotOpen} onOpenChange={setForgotOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Lupa Password</DialogTitle>
                <DialogDescription>Masukkan email untuk menerima link reset password.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSendResetEmail} className="space-y-4">
                <div>
                  <Label htmlFor="reset-email">Email</Label>
                  <Input id="reset-email" type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} required />
                </div>
                <Button type="submit" className="w-full">Kirim Link Reset</Button>
              </form>
            </DialogContent>
          </Dialog>

          {/* Dialog Ganti Password setelah recovery */}
          <Dialog open={resetOpen} onOpenChange={setResetOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Atur Password Baru</DialogTitle>
                <DialogDescription>Masukkan password baru Anda.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleUpdateNewPassword} className="space-y-4">
                <div>
                  <Label htmlFor="new-pass">Password Baru</Label>
                  <Input id="new-pass" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} minLength={6} required />
                </div>
                <div>
                  <Label htmlFor="confirm-new-pass">Konfirmasi Password</Label>
                  <Input id="confirm-new-pass" type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} minLength={6} required />
                </div>
                <Button type="submit" className="w-full">Simpan Password</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </section>
    </div>
  );
};

export default Auth;
