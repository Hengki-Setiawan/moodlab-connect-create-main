import { useEffect, useState } from "react";
import { supabaseAdmin } from "@/integrations/supabase/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from "sonner";

interface ServiceRow {
  id?: string;
  title: string;
  description: string;
  icon: string;
  features: string[];
  category: "consultation" | "agency";
  color_class: "primary" | "secondary" | "accent";
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

const emptyService: ServiceRow = {
  title: "",
  description: "",
  icon: "MessageSquare",
  features: [],
  category: "consultation",
  color_class: "primary",
  is_active: true,
};

const iconOptions = ["MessageSquare", "Globe", "Palette", "Code", "Briefcase", "Zap", "Megaphone"];

const ServicesManagement = () => {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<ServiceRow>(emptyService);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabaseAdmin.from("services").select("*").order("created_at", { ascending: true });
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
      };

      if (editingId) {
        const { error } = await supabaseAdmin.from("services").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Layanan diperbarui");
      } else {
        const { error } = await supabaseAdmin.from("services").insert(payload);
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

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const { error } = await supabaseAdmin.from("services").update({ is_active: !current }).eq("id", id);
      if (error) throw error;
      toast.success("Status layanan diperbarui");
      await loadServices();
    } catch (err) {
      console.error("toggleActive error:", err);
      toast.error("Gagal memperbarui status");
    }
  };

  const deleteService = async (id: string) => {
    if (!confirm("Hapus layanan ini?")) return;
    try {
      const { error } = await supabaseAdmin.from("services").delete().eq("id", id);
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
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadServices} disabled={loading}>Refresh</Button>
          <Button onClick={openCreate}>Tambah Layanan</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Judul</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kategori</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ikon</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Aktif</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">Belum ada layanan</td>
                </tr>
              ) : (
                services.map((s) => (
                  <tr key={s.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{s.title}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm capitalize">{s.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{s.icon}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <Button variant={s.is_active ? "default" : "secondary"} size="sm" onClick={() => s.id && toggleActive(s.id, s.is_active)}>
                        {s.is_active ? "Aktif" : "Nonaktif"}
                      </Button>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(s)}>Edit</Button>
                      <Button variant="destructive" size="sm" onClick={() => s.id && deleteService(s.id)}>Hapus</Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Layanan" : "Tambah Layanan"}</DialogTitle>
            <DialogDescription>Lengkapi informasi layanan dan simpan perubahan.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
            <div>
              <label className="block text-sm font-medium mb-2">Judul</label>
              <Input value={form.title} onChange={(e) => setForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Kategori</label>
              <Select value={form.category} onValueChange={(val) => setForm(prev => ({ ...prev, category: val as ServiceRow["category"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="agency">Agency</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ikon</label>
              <Select value={form.icon} onValueChange={(val) => setForm(prev => ({ ...prev, icon: val }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih ikon" />
                </SelectTrigger>
                <SelectContent>
                  {iconOptions.map((ic) => (
                    <SelectItem key={ic} value={ic}>{ic}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Warna</label>
              <Select value={form.color_class} onValueChange={(val) => setForm(prev => ({ ...prev, color_class: val as ServiceRow["color_class"] }))}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih warna" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="primary">Primary</SelectItem>
                  <SelectItem value="secondary">Secondary</SelectItem>
                  <SelectItem value="accent">Accent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium mb-2">Deskripsi</label>
              <Textarea rows={4} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} />
            </div>
            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Fitur</label>
                <Button variant="outline" size="sm" onClick={addFeature}>Tambah Fitur</Button>
              </div>
              <div className="space-y-2">
                {form.features.map((f, i) => (
                  <div key={i} className="flex gap-2">
                    <Input value={f} onChange={(e) => updateFeature(i, e.target.value)} />
                    <Button variant="destructive" size="sm" onClick={() => removeFeature(i)}>Hapus</Button>
                  </div>
                ))}
                {form.features.length === 0 && (
                  <p className="text-sm text-gray-500">Belum ada fitur. Klik "Tambah Fitur" untuk menambahkan.</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>Batal</Button>
            <Button onClick={saveService}>{editingId ? "Simpan Perubahan" : "Tambah"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ServicesManagement;
