import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { supabaseAdmin } from "@/integrations/supabase/admin";

interface Page {
    id: string;
    path: string;
    title: string;
    description: string;
}

// Mock data for now since we don't have a pages table yet
// In a real app, this would fetch from a 'pages' or 'site_settings' table
const initialPages: Page[] = [
    { id: '1', path: '/', title: 'Beranda - Moodlab', description: 'Solusi Kesehatan Mental Terpercaya' },
    { id: '2', path: '/produk', title: 'Produk Digital', description: 'Koleksi E-book dan Panduan Kesehatan Mental' },
    { id: '3', path: '/profile', title: 'Profil Pengguna', description: 'Kelola akun dan pesanan Anda' },
];

const PagesManagement = () => {
    const [pages, setPages] = useState<Page[]>(initialPages);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editForm, setEditForm] = useState<Partial<Page>>({});

    const handleEdit = (page: Page) => {
        setEditingId(page.id);
        setEditForm(page);
    };

    const handleSave = async () => {
        // In a real implementation, this would save to DB
        // For now, we update local state and show success
        setPages(pages.map(p => p.id === editingId ? { ...p, ...editForm } as Page : p));
        setEditingId(null);
        toast.success("Perubahan halaman disimpan (Simulasi)");

        // Example of how it would look with Supabase:
        /*
        try {
          const { error } = await supabaseAdmin
            .from('pages')
            .update({ title: editForm.title, description: editForm.description })
            .eq('id', editingId);
          if (error) throw error;
          toast.success("Perubahan disimpan");
        } catch (e) {
          toast.error("Gagal menyimpan");
        }
        */
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Manajemen Halaman</h2>
                <Button variant="outline" onClick={() => toast.info("Fitur tambah halaman akan segera hadir")}>
                    Tambah Halaman
                </Button>
            </div>

            <div className="grid gap-6">
                {pages.map((page) => (
                    <Card key={page.id}>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-lg font-medium">{page.path}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {editingId === page.id ? (
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Judul Halaman (SEO Title)</Label>
                                        <Input
                                            value={editForm.title}
                                            onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Deskripsi (Meta Description)</Label>
                                        <Input
                                            value={editForm.description}
                                            onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2 mt-4">
                                        <Button variant="outline" size="sm" onClick={() => setEditingId(null)}>Batal</Button>
                                        <Button size="sm" onClick={handleSave}>Simpan</Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex justify-between items-start">
                                    <div className="space-y-1">
                                        <p className="font-medium text-sm text-foreground">Title: <span className="font-normal text-muted-foreground">{page.title}</span></p>
                                        <p className="font-medium text-sm text-foreground">Description: <span className="font-normal text-muted-foreground">{page.description}</span></p>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>Edit</Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
};

export default PagesManagement;
