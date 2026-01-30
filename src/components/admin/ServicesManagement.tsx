import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { uploadImage } from "@/integrations/supabase/storage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Trash2, Edit2, Plus, Image as ImageIcon } from "lucide-react";

interface ServiceRow {
  id?: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  category: string;
  color_class: string;
  is_active: boolean;
  image_url?: string;
}

const emptyService: ServiceRow = {
  title: "",
  description: "",
  icon: "MessageSquare",
  features: [],
  category: "consultation",
  color_class: "bg-indigo-50 text-indigo-600",
  is_active: true,
  image_url: "",
};

const iconOptions = ["MessageSquare", "Globe", "Palette", "Code", "Briefcase", "Zap", "Megaphone", "FileText", "Share2", "Package"];

const ServicesManagement = () => {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceRow>(emptyService);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.from("services").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      setServices(data || []);
    } catch (err) {
      console.error("loadServices error:", err);
      toast.error("Gagal memuat layanan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  const openCreate = () => {
    setForm(emptyService);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEdit = (s: ServiceRow) => {
    setForm({ ...s });
    setEditingId(s.id || null);
    setIsDialogOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    try {
      setUploadingImage(true);
      const fileName = `${Date.now()}-${file.name.replace(/\s/g, '-')}`;
      // Assuming 'service-images' bucket exists from our migration plan
      const result = await uploadImage(file, 'service-images', '', fileName);

      if (result?.url) {
        setForm(prev => ({ ...prev, image_url: result.url }));
        toast.success("Gambar berhasil diupload");
      }
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Gagal upload gambar");
    } finally {
      setUploadingImage(false);
    }
  };

  const addFeature = () => {
    setForm(prev => ({ ...prev, features: [...prev.features, ""] }));
  };

  const updateFeature = (index: number, value: string) => {
    setForm(prev => ({ ...prev, features: prev.features.map((f, i) => i === index ? value : f) }));
  };

  const removeFeature = (index: number) => {
    setForm(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  };

  const saveService = async () => {
    try {
      if (!form.title.trim() || !form.description.trim()) {
        toast.error("Judul dan deskripsi wajib diisi");
        return;
      }
      const payload: any = {
        title: form.title.trim(),
        description: form.description.trim(),
        icon: form.icon.trim(),
        features: form.features.filter(f => f && f.trim().length > 0),
        category: form.category,
        color_class: form.color_class,
        is_active: form.is_active,
        image_url: form.image_url,
      };

      if (editingId) {
        const { error } = await supabase.from("services").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Layanan diperbarui");
      } else {
        const { error } = await supabase.from("services").insert(payload);
        if (error) throw error;
        toast.success("Layanan ditambahkan");
      }
      setIsDialogOpen(false);
      await loadServices();
    } catch (err) {
      console.error("saveService error:", err);
      toast.error("Gagal menyimpan layanan");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Hapus layanan ini?")) return;
    try {
      const { error } = await supabase.from("services").delete().eq("id", id);
      if (error) throw error;
      toast.success("Layanan dihapus");
      await loadServices();
    } catch (err) {
      console.error("deleteService error:", err);
      toast.error("Gagal menghapus layanan");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold">Kelola Layanan</h2>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" /> Tambah Layanan</Button>
      </div>

      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Gambar</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {loading ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-400" /></td></tr>
              ) : services.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">Belum ada layanan</td></tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {s.image_url ? (
                        <img src={s.image_url} alt={s.title} className="w-10 h-10 object-cover rounded-md border" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-100 rounded-md flex items-center justify-center text-gray-400">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">{s.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${s.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                      <Button variant="ghost" size="icon" onClick={() => openEdit(s)}><Edit2 className="w-4 h-4 text-blue-600" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => s.id && deleteService(s.id)}><Trash2 className="w-4 h-4 text-red-600" /></Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
            <DialogDescription>Lengkapi informasi layanan.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">

            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Judul Layanan</label>
                <Input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Kategori</label>
                <Select value={form.category} onValueChange={(val) => setForm(prev => ({ ...prev, category: val }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consultation">Consultation</SelectItem>
                    <SelectItem value="agency">Agency</SelectItem>
                    <SelectItem value="creative">Creative</SelectItem>
                    <SelectItem value="digital">Digital</SelectItem>
                    <SelectItem value="strategy">Strategy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Gambar Cover</label>
                <div className="flex gap-4 items-start">
                  {form.image_url && (
                    <img src={form.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-lg border bg-gray-50" />
                  )}
                  <div className="flex-1">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      disabled={uploadingImage}
                      className="cursor-pointer file:text-indigo-600 file:font-semibold"
                    />
                    {uploadingImage && <p className="text-xs text-blue-500 mt-1">Mengupload...</p>}
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Ikon</label>
                <Select value={form.icon} onValueChange={(val) => setForm(prev => ({ ...prev, icon: val }))}>
                  <SelectTrigger><SelectValue placeholder="Pilih ikon" /></SelectTrigger>
                  <SelectContent>
                    {iconOptions.map((ic) => <SelectItem key={ic} value={ic}>{ic}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Warna CSS Class</label>
                <Input value={form.color_class} onChange={(e) => setForm(prev => ({ ...prev, color_class: e.target.value }))} placeholder="e.g. bg-blue-50 text-blue-600" />
              </div>
            </div>

            {/* Full Width */}
            <div className="md:col-span-2 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Deskripsi Lengkap</label>
                <Textarea rows={4} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Fitur Unggulan</label>
                <div className="space-y-2">
                  {form.features.map((f, i) => (
                    <div key={i} className="flex gap-2">
                      <Input value={f} onChange={(e) => updateFeature(i, e.target.value)} placeholder={`Fitur ${i + 1}`} />
                      <Button variant="ghost" size="icon" onClick={() => removeFeature(i)} className="text-red-500 hover:text-red-700 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  ))}
                  <Button type="button" variant="outline" size="sm" onClick={addFeature} className="mt-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50">
                    <Plus className="w-3 h-3 mr-1" /> Tambah Fitur
                  </Button>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pb-2 sticky bottom-0 bg-white pt-4 border-t">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={saveService} disabled={uploadingImage} className="bg-indigo-600 hover:bg-indigo-700 text-white">
              {editingId ? "Simpan Perubahan" : "Buat Layanan"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
