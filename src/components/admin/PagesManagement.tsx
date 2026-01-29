import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { db } from "@/lib/turso";
import { pages } from "@/db/schema";
import { eq } from "drizzle-orm";

interface Page {
    id: number;
    path: string;
    title: string;
    description: string | null;
}

const PagesManagement = () => {
    const [pagesList, setPagesList] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Page>>({});

    const fetchPages = async () => {
        try {
            setLoading(true);
            const data = await db.select().from(pages);
            setPagesList(data);
        } catch (error) {
            console.error("Error fetching pages:", error);
            toast.error("Gagal memuat data halaman");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPages();
    }, []);

    const handleEdit = (page: Page) => {
        setEditingId(page.id);
        setEditForm(page);
    };

    const handleSave = async () => {
        if (!editingId) return;

        try {
            await db.update(pages)
                .set({
                    title: editForm.title,
                    description: editForm.description,
                    updated_at: new Date()
                })
                .where(eq(pages.id, editingId));

            toast.success("Perubahan halaman disimpan");
            setEditingId(null);
            fetchPages();
        } catch (error) {
            console.error("Error updating page:", error);
            toast.error("Gagal menyimpan perubahan");
        }
    };

    const handleSeed = async () => {
        try {
            setLoading(true);
            const initialPages = [
                { path: '/', title: 'Beranda - Moodlab', description: 'Solusi Kesehatan Mental Terpercaya' },
                { path: '/produk', title: 'Produk Digital', description: 'Koleksi E-book dan Panduan Kesehatan Mental' },
                { path: '/profile', title: 'Profil Pengguna', description: 'Kelola akun dan pesanan Anda' },
            ];

            for (const page of initialPages) {
                await db.insert(pages).values(page);
            }

            toast.success("Data halaman default berhasil dibuat");
            fetchPages();
        } catch (error) {
            console.error("Error seeding pages:", error);
            toast.error("Gagal membuat data default");
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">Manajemen Halaman</h2>
            </div>

            {loading ? (
                <div className="text-center py-8 text-muted-foreground">Memuat data...</div>
            ) : (
                <div className="grid gap-6">
                    {pagesList.length === 0 ? (
                        <div className="text-center py-12 space-y-4">
                            <p className="text-muted-foreground">Belum ada data halaman.</p>
                            <Button onClick={handleSeed}>Generate Default Pages</Button>
                        </div>
                    ) : (
                        pagesList.map((page) => (
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
                                                    value={editForm.title || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Deskripsi (Meta Description)</Label>
                                                <Input
                                                    value={editForm.description || ""}
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
                                                <p className="font-medium text-sm text-foreground">Description: <span className="font-normal text-muted-foreground">{page.description || "-"}</span></p>
                                            </div>
                                            <Button variant="ghost" size="sm" onClick={() => handleEdit(page)}>Edit</Button>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>
            )}
        </div>
    );
};

export default PagesManagement;
