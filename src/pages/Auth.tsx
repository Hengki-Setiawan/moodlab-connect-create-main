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
  // Dialog verifikasi email setelah signup
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [signupEmailState, setSignupEmailState] = useState("");
  // Email belum terverifikasi terdeteksi saat gagal login
  const [unconfirmedEmail, setUnconfirmedEmail] = useState("");
  // State untuk validasi realtime username saat pendaftaran
  const [signupUsername, setSignupUsername] = useState("");
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameMessage, setUsernameMessage] = useState("");
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

  // Deteksi hasil redirect setelah klik email verifikasi Supabase
  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const type = params.get('type');
      const errorCode = params.get('error_code');
      // token_hash biasanya ada saat redirect dari verifikasi
      const tokenHash = params.get('token_hash');

      if (type === 'signup' && tokenHash && !errorCode) {
        toast.success('Verifikasi email berhasil', {
          description: 'Silakan login dengan email dan password Anda.',
        });
        // Bersihkan query string agar tidak memicu ulang
        window.history.replaceState({}, document.title, window.location.pathname);
      } else if (errorCode) {
        const errDesc = params.get('error_description') || 'Terjadi kesalahan saat verifikasi.';
        toast.error('Verifikasi gagal', { description: errDesc });
        window.history.replaceState({}, document.title, window.location.pathname);
      }
    } catch (e) {
      console.error('Parse verification params error:', e);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setUnconfirmedEmail("");

    const formData = new FormData(e.currentTarget);
    const identifier = formData.get("identifier") as string; // bisa email atau username
    const password = formData.get("password") as string;
    // siapkan email yang akan digunakan untuk sign-in (bisa hasil resolve dari username)
    let emailToUse = identifier;

    try {
      // Jika bukan email, anggap sebagai username dan resolve ke email via RPC (dengan timeout)
      if (!identifier.includes("@")) {
        const timeoutMs = 1500;
        const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs));
        const rpcPromise = supabase.rpc('get_auth_email_by_username', { _username: identifier });

        const result = await Promise.race([rpcPromise, timeoutPromise]);
        // Jika timeout, lanjutkan mencoba login dengan input asli sebagai email (fallback)
        if (result === null) {
          emailToUse = identifier;
        } else {
          const { data: resolvedEmail, error: rpcError } = result as any;
          // Jika fungsi RPC belum ada di DB, tampilkan pesan ramah dan hentikan proses tanpa melempar error mentah
          if (rpcError) {
            const msg = typeof (rpcError as any)?.message === 'string' ? (rpcError as any).message : '';
            if (msg.includes('Could not find the function') || msg.includes('schema cache') || msg.toLowerCase().includes('not found')) {
              toast.error('Login dengan username belum aktif', {
                description: 'Fungsi RPC belum tersedia di Supabase. Jalankan migrasi terlebih dahulu atau login dengan email.',
              });
              setIsLoading(false);
              return;
            }
            // Error lain tetap ditangani di blok catch umum
            throw rpcError;
          }
          if (!resolvedEmail) {
            toast.error('Username tidak ditemukan', { description: 'Silakan periksa kembali atau gunakan email.' });
            setIsLoading(false);
            return;
          }
          emailToUse = resolvedEmail;
        }
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;

      // Setelah login, cek apakah user adalah admin
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Cek dan buat profile jika belum ada (Self-healing)
        const { data: profileCheck } = await supabase.from("profiles").select("id").eq("id", user.id).single();
        if (!profileCheck) {
          const { error: insertError } = await supabase.from("profiles").insert({
            id: user.id,
            full_name: user.user_metadata.full_name || user.email?.split('@')[0] || 'User',
            email: user.email,
            // created_at will be handled by default if defined, or we can pass it
          });
          if (insertError) {
            console.error("Failed to auto-create profile:", insertError);
          }
        }

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

        toast.success("Berhasil masuk!");
        navigate("/profile");
      }
    } catch (error) {
      console.error("Login error:", error);
      const message = typeof (error as any)?.message === 'string' ? (error as any).message : 'Periksa kredensial Anda';
      // Deteksi kemungkinan kesalahan API key Supabase
      if (message.toLowerCase().includes('api key') || message.toLowerCase().includes('invalid key') || message.toLowerCase().includes('not allowed')) {
        toast.error('Konfigurasi Supabase bermasalah', {
          description: 'Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env. Jika perlu, masukkan API Key baru.',
        });
      }
      let friendly = message;
      const lowerMsg = message.toLowerCase();
      if (lowerMsg.includes('invalid login credentials')) friendly = 'Email/username atau password salah';
      else if (lowerMsg.includes('too many requests') || lowerMsg.includes('rate limit')) friendly = 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
      else if (lowerMsg.includes('network') || lowerMsg.includes('connection closed')) friendly = 'Gangguan koneksi. Periksa jaringan/SSL lalu coba lagi.';
      else if (lowerMsg.includes('email not confirmed') || lowerMsg.includes('not confirmed')) {
        friendly = 'Email belum dikonfirmasi. Silakan cek inbox Anda untuk verifikasi.';
        // Simpan email agar tombol "Kirim Ulang Verifikasi" muncul di form login
        if (emailToUse && emailToUse.includes('@')) {
          setUnconfirmedEmail(emailToUse);
        }
      }
      toast.error("Gagal masuk", { description: friendly });
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
    // Redirect verifikasi mengikuti domain aktif (env atau origin)
    const SITE_URL = (typeof import.meta.env.VITE_SITE_URL === 'string' && import.meta.env.VITE_SITE_URL.length > 0)
      ? import.meta.env.VITE_SITE_URL
      : window.location.origin;
    const redirectUrl = `${SITE_URL}/auth`;

    if (password !== confirmPassword) {
      toast.error("Password tidak cocok");
      setIsLoading(false);
      return;
    }

    try {
      // Validasi format username dasar (opsional, hanya ketika user mengisi)
      if (username) {
        const valid = /^[a-zA-Z0-9_\.\-]{3,24}$/.test(username);
        if (!valid) {
          toast.error("Format username tidak valid", { description: "Gunakan 3–24 karakter: huruf, angka, titik, garis bawah, atau minus." });
          setIsLoading(false);
          return;
        }

        // Cek ketersediaan username via RPC (bypass RLS)
        const { data: existingEmail, error: rpcErr } = await supabase.rpc('get_auth_email_by_username', { _username: username });
        if (rpcErr) {
          const msg = typeof (rpcErr as any)?.message === 'string' ? (rpcErr as any).message : '';
          // Jika fungsi belum tersedia, beri tahu user untuk lanjut tanpa username atau aktifkan migrasi
          if (msg.includes('Could not find the function') || msg.includes('schema cache') || msg.toLowerCase().includes('not found')) {
            toast.error('Fitur username belum aktif', {
              description: 'Silakan jalankan migrasi RPC atau daftar tanpa username (opsional).',
            });
            setIsLoading(false);
            return;
          }
          // Jika error jaringan, lanjutkan proses signup (akan ada fallback saat bentrok)
          if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network')) {
            toast.warning('Tidak bisa memeriksa username', {
              description: 'Masalah koneksi ke Supabase. Melanjutkan pendaftaran tanpa cek username.',
            });
          } else {
            // Error lain tetap dilanjutkan ke catch umum
            throw rpcErr;
          }
        }
        if (existingEmail) {
          toast.error('Username sudah digunakan', { description: 'Pilih username lain yang unik.' });
          setIsLoading(false);
          return;
        }
      }

      const { data, error } = await supabase.auth.signUp({
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

      // Jika sesi langsung terbentuk (verifikasi email dimatikan), langsung login
      if (data.session) {
        toast.success("Akun berhasil dibuat & masuk otomatis!");
        navigate("/profile");
      } else {
        setSignupEmailState(email);
        setVerifyOpen(true);
        toast.success("Akun berhasil dibuat!", {
          description: "Email harus dikonfirmasi terlebih dahulu sebelum bisa login.",
        });
      }
    } catch (error) {
      console.error("Signup error:", error);
      const rawMsg = typeof (error as any)?.message === 'string' ? (error as any).message : '';
      // Fallback lebih agresif: jika ada error dan user mengisi username,
      // coba daftar ulang tanpa username KECUALI jika penyebabnya adalah email sudah terdaftar
      // atau masalah jaringan/API key yang tidak akan tertolong oleh penghapusan username.
      const lower = rawMsg.toLowerCase();
      const isNetworkLike = lower.includes('failed to fetch') || lower.includes('connection closed') || lower.includes('net::err_connection_closed');
      const isEmailTaken = lower.includes('user already registered');
      const isApiKeyIssue = lower.includes('no api key') || lower.includes('api key') || lower.includes('invalid key') || lower.includes('not allowed');

      if (signupUsername && !isNetworkLike && !isEmailTaken && !isApiKeyIssue) {
        try {
          const { error: retryErr } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                full_name: fullName,
                // Hapus username agar trigger menyimpan NULL (tidak bentrok unik)
              },
              emailRedirectTo: redirectUrl,
            },
          });
          if (!retryErr) {
            toast.success("Akun berhasil dibuat tanpa username", {
              description: "Anda bisa mengatur username unik di halaman Profil nanti.",
            });
            return;
          }
        } catch (retry) {
          console.error('Retry signup without username error:', retry);
        }
      }
      let friendly = rawMsg || 'Terjadi kesalahan saat mendaftar';
      // Berikan pesan yang lebih informatif untuk error umum Supabase
      if (lower.includes('database error saving new user')) {
        friendly = 'Gagal menyimpan user baru di database. Kemungkinan username sudah dipakai atau email sudah terdaftar.';
      } else if (lower.includes('user already registered')) {
        friendly = 'Email sudah terdaftar. Silakan login atau gunakan email lain.';
      } else if (lower.includes('invalid login credentials')) {
        friendly = 'Email/username atau password tidak valid.';
      } else if (lower.includes('too many requests') || lower.includes('rate limit')) {
        friendly = 'Terlalu banyak percobaan. Coba lagi beberapa saat.';
      } else if (lower.includes('signups not allowed') || lower.includes('new user signup disabled')) {
        friendly = 'Pendaftaran sementara dinonaktifkan. Hubungi admin atau coba nanti.';
      } else if (isApiKeyIssue) {
        friendly = 'Konfigurasi Supabase bermasalah. Periksa VITE_SUPABASE_URL dan VITE_SUPABASE_PUBLISHABLE_KEY di .env. Jika muncul pesan API key di UI, masukkan API key baru.';
      } else if (isNetworkLike) {
        friendly = 'Gangguan koneksi ke Supabase (ERR_CONNECTION_CLOSED). Coba ulangi, periksa jaringan/SSL, atau nonaktifkan ekstensi pemblokir.';
      }
      toast.error("Gagal membuat akun", { description: friendly });
    } finally {
      setIsLoading(false);
    }
  };

  // Kirim ulang email verifikasi
  const handleResendVerification = async () => {
    try {
      const SITE_URL = (typeof import.meta.env.VITE_SITE_URL === 'string' && import.meta.env.VITE_SITE_URL.length > 0)
        ? import.meta.env.VITE_SITE_URL
        : window.location.origin;
      const redirectUrl = `${SITE_URL}/auth`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: signupEmailState,
        options: { emailRedirectTo: redirectUrl },
      } as any);
      if (error) throw error;
      toast.success('Email verifikasi dikirim ulang', { description: 'Silakan cek inbox atau folder spam.' });
    } catch (err) {
      console.error('resend signup email error:', err);
      const msg = typeof (err as any)?.message === 'string' ? (err as any).message : 'Gagal mengirim ulang email';
      toast.error('Gagal kirim ulang verifikasi', { description: msg });
    }
  };

  // Kirim ulang verifikasi saat gagal login karena email belum terkonfirmasi
  const handleResendVerificationLogin = async () => {
    if (!unconfirmedEmail) return;
    try {
      const SITE_URL = (typeof import.meta.env.VITE_SITE_URL === 'string' && import.meta.env.VITE_SITE_URL.length > 0)
        ? import.meta.env.VITE_SITE_URL
        : window.location.origin;
      const redirectUrl = `${SITE_URL}/auth`;
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: unconfirmedEmail,
        options: { emailRedirectTo: redirectUrl },
      } as any);
      if (error) throw error;
      toast.success('Email verifikasi dikirim ulang', { description: 'Silakan cek inbox atau folder spam.' });
    } catch (err) {
      console.error('resend signup email (login) error:', err);
      const msg = typeof (err as any)?.message === 'string' ? (err as any).message : 'Gagal mengirim ulang email';
      toast.error('Gagal kirim ulang verifikasi', { description: msg });
    }
  };

  // Cek ketersediaan username saat user selesai mengetik (onBlur)
  const checkUsernameAvailability = async (uname: string) => {
    const val = uname.trim();
    if (!val) { setUsernameAvailable(null); setUsernameMessage(''); return; }
    const valid = /^[a-zA-Z0-9_\.\-]{3,24}$/.test(val);
    if (!valid) {
      setUsernameAvailable(false);
      setUsernameMessage('Gunakan 3–24 karakter: huruf, angka, titik, _ atau -');
      return;
    }
    try {
      setUsernameChecking(true);
      setUsernameMessage('Memeriksa ketersediaan...');
      const { data, error } = await supabase.rpc('get_auth_email_by_username', { _username: val });
      if (error) {
        const msg = typeof error?.message === 'string' ? error.message : '';
        if (msg.includes('Could not find the function') || msg.includes('schema cache') || msg.toLowerCase().includes('not found')) {
          setUsernameAvailable(null);
          setUsernameMessage('Fitur username belum aktif di database');
        } else {
          setUsernameAvailable(null);
          setUsernameMessage('Gagal cek username, coba lagi');
        }
      } else {
        if (data) {
          setUsernameAvailable(false);
          setUsernameMessage('Username sudah digunakan');
        } else {
          setUsernameAvailable(true);
          setUsernameMessage('Username tersedia');
        }
      }
    } catch {
      setUsernameAvailable(null);
      setUsernameMessage('Gagal cek username, periksa koneksi');
    } finally {
      setUsernameChecking(false);
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
    } catch (err) {
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
    } catch (err) {
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
                    {unconfirmedEmail && (
                      <div className="mt-3 p-3 rounded-md border bg-yellow-50">
                        <p className="text-sm text-yellow-800">
                          Email <b>{unconfirmedEmail}</b> belum dikonfirmasi. Kirim ulang verifikasi lalu cek inbox.
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Button type="button" onClick={handleResendVerificationLogin} className="flex-1">Kirim Ulang Verifikasi</Button>
                          <a href="https://mail.google.com/" target="_blank" rel="noreferrer" className="flex-1">
                            <Button type="button" variant="secondary" className="w-full">Buka Email</Button>
                          </a>
                        </div>
                      </div>
                    )}
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
                      <Label htmlFor="signup-username">Username (opsional)</Label>
                      <Input
                        id="signup-username"
                        name="username"
                        placeholder="moodlab_user"
                        className="mt-1.5"
                        value={signupUsername}
                        onChange={(e) => setSignupUsername(e.target.value)}
                        onBlur={() => checkUsernameAvailability(signupUsername)}
                      />
                      {usernameMessage && (
                        <p className={`mt-1 text-sm ${usernameAvailable === false ? 'text-red-600' : usernameAvailable === true ? 'text-green-600' : 'text-gray-500'}`}>
                          {usernameChecking ? 'Memeriksa ketersediaan...' : usernameMessage}
                        </p>
                      )}
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

          {/* Dialog Verifikasi Email setelah signup */}
          <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Verifikasi Email Diperlukan</DialogTitle>
                <DialogDescription>
                  Kami telah mengirim link verifikasi ke <b>{signupEmailState}</b>.
                  Silakan buka email Anda dan klik link verifikasi.
                  Jika tidak menerima email, kirim ulang menggunakan tombol di bawah.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <Button onClick={handleResendVerification} className="w-full">Kirim Ulang Email Verifikasi</Button>
                <a href="https://mail.google.com/" target="_blank" rel="noreferrer">
                  <Button variant="secondary" className="w-full">Buka Email Saya</Button>
                </a>
              </div>
            </DialogContent>
          </Dialog>

        </div>
      </section>
    </div>
  );
};

export default Auth;
