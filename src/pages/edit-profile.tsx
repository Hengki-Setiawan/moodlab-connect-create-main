import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";

interface Profile {
  full_name: string;
  phone: string;
}

const EditProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile>({ full_name: "", phone: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        navigate("/auth");
        return;
      }

      await fetchProfile(user.id);
    } catch (error) {
      console.error("Error:", error);
      navigate("/auth");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile:", error);
      return;
    }

    setProfile(data || { full_name: "", phone: "" });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: profile.full_name,
          phone: profile.phone,
        })
        .eq("id", user.id);

      if (error) throw error;
      toast.success("Profil berhasil diperbarui");
      navigate("/profile");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Gagal memperbarui profil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="pt-32 pb-20 px-4 container mx-auto">
          <p className="text-center">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="pt-32 pb-20 px-4">
        <div className="container mx-auto max-w-2xl">
          <div className="flex items-center mb-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate("/profile")}
              className="mr-4"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Kembali
            </Button>
            <h1 className="text-2xl font-bold">Edit Profil</h1>
          </div>

          <Card className="border-0 shadow-md overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-indigo-100">
              <CardTitle>Informasi Profil</CardTitle>
              <CardDescription>
                Perbarui informasi personal Anda
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleUpdateProfile}>
              <CardContent className="space-y-6 pt-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-base">Nama Lengkap</Label>
                  <Input
                    id="full_name"
                    value={profile.full_name}
                    onChange={(e) =>
                      setProfile({ ...profile, full_name: e.target.value })
                    }
                    className="h-12"
                    placeholder="Masukkan nama lengkap Anda"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-base">Nomor Telepon</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                    className="h-12"
                    placeholder="Masukkan nomor telepon Anda"
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => navigate("/profile")}
                  >
                    Batal
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                    disabled={isSaving}
                  >
                    {isSaving ? "Menyimpan..." : "Simpan Perubahan"}
                  </Button>
                </div>
              </CardContent>
            </form>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default EditProfile;