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
    content: string | null;
}

const PagesManagement = () => {
    const [pagesList, setPagesList] = useState<Page[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<Page>>({});
    const [jsonError, setJsonError] = useState<string | null>(null);
    const [parsedContent, setParsedContent] = useState<any>({});

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
        setJsonError(null);
        try {
            setParsedContent(page.content ? JSON.parse(page.content) : {});
        } catch (e) {
            setParsedContent({});
            setJsonError("Format JSON invalid - falling back to raw mode");
        }
    };

    const handleContentChange = (value: string) => {
        setEditForm({ ...editForm, content: value });
        try {
            if (value) {
                const parsed = JSON.parse(value);
                setParsedContent(parsed);
                setJsonError(null);
            }
        } catch (e) {
            setJsonError("Format JSON tidak valid");
        }
    };

    // Helper to update parsed content and sync string version
    const updateField = (key: string, value: any) => {
        const newContent = { ...parsedContent, [key]: value };
        setParsedContent(newContent);
        setEditForm(prev => ({ ...prev, content: JSON.stringify(newContent, null, 2) }));
    };

    const updateFeature = (index: number, field: 'title' | 'description', value: string) => {
        const newFeatures = [...(parsedContent.features || [])];
        if (!newFeatures[index]) newFeatures[index] = {};
        newFeatures[index][field] = value;
        updateField('features', newFeatures);
    };

    const addFeature = () => {
        const newFeatures = [...(parsedContent.features || []), { title: "", description: "" }];
        updateField('features', newFeatures);
    };

    const removeFeature = (index: number) => {
        const newFeatures = [...(parsedContent.features || [])];
        newFeatures.splice(index, 1);
        updateField('features', newFeatures);
    };

    const handleSave = async () => {
        if (!editingId) return;
        if (jsonError) {
            toast.error("Perbaiki format JSON sebelum menyimpan");
            return;
        }

        try {
            await db.update(pages)
                .set({
                    title: editForm.title,
                    description: editForm.description,
                    content: editForm.content,
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
                {
                    path: '/',
                    title: 'Beranda - Moodlab',
                    description: 'Solusi Kesehatan Mental Terpercaya',
                    content: JSON.stringify({
                        hero_title: "Ubah Popularitas Menjadi Loyalitas",
                        hero_subtitle: "Kami memahami \"mood\" audiens Gen Z Anda. Moodlab hadir untuk membangun konten yang relevan.",
                        features: [
                            { title: "Analisis Data Mendalam", description: "Strategi berbasis data." },
                            { title: "Adaptasi Tren Cepat", description: "Kampanye personal." }
                        ]
                    }, null, 2)
                },
                { path: '/produk', title: 'Produk Digital', description: 'Koleksi E-book dan Panduan Kesehatan Mental' },
                { path: '/profile', title: 'Profil Pengguna', description: 'Kelola akun dan pesanan Anda' },
                {
                    path: '/about',
                    title: 'Tentang Kami',
                    description: 'Cerita di balik Moodlab',
                    content: JSON.stringify({
                        hero_title: "Tentang Moodlab",
                        hero_subtitle: "Membangun merek yang relevan dan autentik.",
                        vision_title: "Visi Kami",
                        vision_text: "Menjadi mitra pertumbuhan UMKM digital terdepan di Indonesia.",
                        faq: [
                            { question: "Berapa lama pengerjaan?", answer: "Tergantung kompleksitas, rata-rata 2-4 minggu." },
                            { question: "Apakah ada garansi?", answer: "Ya, kami memberikan garansi revisi minor selama 1 bulan." }
                        ]
                    }, null, 2)
                },
                {
                    path: '/layanan',
                    title: 'Layanan Kami',
                    description: 'Solusi Digital Komprehensif',
                    content: JSON.stringify({
                        hero_title: "Temukan Solusi Digital Anda",
                        hero_subtitle: "Jelajahi berbagai layanan profesional kami untuk membantu bisnis Anda bertumbuh."
                    }, null, 2)
                },
                {
                    path: '/kontak',
                    title: 'Hubungi Kami',
                    description: 'Kami siap membantu Anda',
                    content: JSON.stringify({
                        hero_title: "Hubungi Kami",
                        hero_subtitle: "Ada pertanyaan? Kami siap membantu Anda membangun merek yang kuat",
                        email: "moodlab.idn@gmail.com",
                        phone: "081341277339",
                        instagram: "@moodlab.id1",
                        address: "Jl. AP. Pettarani Makassar, Sulawesi Selatan, 90222",
                        hours: "Senin - Jumat: 09:00 - 18:00 WIB"
                    }, null, 2)
                },
            ];

            for (const page of initialPages) {
                const existing = await db.select().from(pages).where(eq(pages.path, page.path));
                if (existing.length === 0) {
                    await db.insert(pages).values(page);
                }
            }

            toast.success("Data halaman default berhasil dibuat");
            fetchPages();
        } catch (error) {
            console.error("Error seeding pages:", error);
            toast.error("Gagal membuat data default");
            setLoading(false);
        }
    };

    const renderEditor = () => {
        // Special Editor for Homepage
        if (editForm.path === '/') {
            return (
                <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-lg border-b pb-2">Edit Konten Beranda</h3>

                    <div className="space-y-2">
                        <Label>Hero Title (Judul Utama)</Label>
                        <Input
                            value={parsedContent.hero_title || ""}
                            onChange={(e) => updateField('hero_title', e.target.value)}
                            placeholder="Contoh: Ubah Popularitas Menjadi Loyalitas"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Hero Subtitle (Sub Judul)</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={parsedContent.hero_subtitle || ""}
                            onChange={(e) => updateField('hero_subtitle', e.target.value)}
                            placeholder="Deskripsi singkat..."
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Features (Fitur Unggulan)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addFeature}>+ Tambah Fitur</Button>
                        </div>

                        <div className="space-y-3">
                            {parsedContent.features?.map((feature: any, idx: number) => (
                                <div key={idx} className="flex gap-2 items-start p-3 bg-white dark:bg-black border rounded-md">
                                    <div className="space-y-2 flex-grow">
                                        <Input
                                            value={feature.title}
                                            onChange={(e) => updateFeature(idx, 'title', e.target.value)}
                                            placeholder="Judul Fitur"
                                            className="font-semibold"
                                        />
                                        <Input
                                            value={feature.description}
                                            onChange={(e) => updateFeature(idx, 'description', e.target.value)}
                                            placeholder="Deskripsi Fitur"
                                            className="text-sm"
                                        />
                                    </div>
                                    <Button type="button" variant="destructive" size="icon" onClick={() => removeFeature(idx)}>
                                        <span className="sr-only">Hapus</span>
                                        &times;
                                    </Button>
                                </div>
                            ))}
                            {(!parsedContent.features || parsedContent.features.length === 0) && (
                                <p className="text-sm text-muted-foreground italic text-center py-2">Belum ada fitur listing.</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center">
                            <Label>Testimonials (Apa Kata Mereka)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => {
                                const newTestimonials = [...(parsedContent.testimonials || []), { quote: "", name: "", title: "" }];
                                updateField('testimonials', newTestimonials);
                            }}>+ Tambah Testimoni</Button>
                        </div>

                        <div className="mb-4">
                            <Label className="text-xs text-muted-foreground">Judul Seksi Testimoni</Label>
                            <Input
                                value={parsedContent.testimonials_title || ""}
                                onChange={(e) => updateField('testimonials_title', e.target.value)}
                                placeholder="Default: Dipercaya oleh Pemimpin Industri"
                            />
                        </div>

                        <div className="space-y-3">
                            {parsedContent.testimonials?.map((t: any, idx: number) => (
                                <div key={idx} className="space-y-2 p-3 bg-white dark:bg-black border rounded-md relative group">
                                    <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => {
                                            const newTestimonials = [...(parsedContent.testimonials || [])];
                                            newTestimonials.splice(idx, 1);
                                            updateField('testimonials', newTestimonials);
                                        }}
                                    >
                                        &times;
                                    </Button>
                                    <textarea
                                        className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                        value={t.quote}
                                        onChange={(e) => {
                                            const newTestimonials = [...(parsedContent.testimonials || [])];
                                            newTestimonials[idx].quote = e.target.value;
                                            updateField('testimonials', newTestimonials);
                                        }}
                                        placeholder="Kutipan Testimoni..."
                                        rows={2}
                                    />
                                    <div className="flex gap-2">
                                        <Input
                                            value={t.name}
                                            onChange={(e) => {
                                                const newTestimonials = [...(parsedContent.testimonials || [])];
                                                newTestimonials[idx].name = e.target.value;
                                                updateField('testimonials', newTestimonials);
                                            }}
                                            placeholder="Nama Klien"
                                            className="flex-1"
                                        />
                                        <Input
                                            value={t.title}
                                            onChange={(e) => {
                                                const newTestimonials = [...(parsedContent.testimonials || [])];
                                                newTestimonials[idx].title = e.target.value;
                                                updateField('testimonials', newTestimonials);
                                            }}
                                            placeholder="Jabatan / Perusahaan"
                                            className="flex-1"
                                        />
                                    </div>
                                </div>
                            ))}
                            {(!parsedContent.testimonials || parsedContent.testimonials.length === 0) && (
                                <p className="text-sm text-muted-foreground italic text-center py-2">Belum ada testimoni. (Akan menggunakan default jika kosong)</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <Label className="text-lg font-semibold">Seksi Layanan (Services)</Label>
                        <div className="space-y-2">
                            <Label>Judul (Title)</Label>
                            <Input
                                value={parsedContent.services_title || ""}
                                onChange={(e) => updateField('services_title', e.target.value)}
                                placeholder="Default: Layanan Unggulan"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi (Subtitle)</Label>
                            <Input
                                value={parsedContent.services_subtitle || ""}
                                onChange={(e) => updateField('services_subtitle', e.target.value)}
                                placeholder="Default: Solusi komprehensif..."
                            />
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <Label className="text-lg font-semibold">Seksi Call to Action (Bawah)</Label>
                        <div className="space-y-2">
                            <Label>Judul (CTA Title)</Label>
                            <Input
                                value={parsedContent.cta_title || ""}
                                onChange={(e) => updateField('cta_title', e.target.value)}
                                placeholder="Default: Siap Mengubah Brand Anda?"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Deskripsi (CTA Description)</Label>
                            <textarea
                                className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                                value={parsedContent.cta_description || ""}
                                onChange={(e) => updateField('cta_description', e.target.value)}
                                placeholder="Default: Mulai perjalanan Anda..."
                            />
                        </div>
                    </div>

                </div>
            );
        }


        // Editor for About Page
        if (editForm.path === '/about') {
            return (
                <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-lg border-b pb-2">Edit Halaman Tentang Kami</h3>
                    <div className="space-y-2">
                        <Label>Hero Title</Label>
                        <Input value={parsedContent.hero_title || ""} onChange={(e) => updateField('hero_title', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Hero Subtitle</Label>
                        <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={parsedContent.hero_subtitle || ""} onChange={(e) => updateField('hero_subtitle', e.target.value)} />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <Label className="font-semibold">Visi & Misi</Label>
                        <div className="space-y-2">
                            <Label>Vision Title</Label>
                            <Input value={parsedContent.vision_title || ""} onChange={(e) => updateField('vision_title', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label>Vision Text</Label>
                            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={parsedContent.vision_text || ""} onChange={(e) => updateField('vision_text', e.target.value)} />
                        </div>
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold">FAQ (Pertanyaan Umum)</Label>
                            <Button type="button" variant="outline" size="sm" onClick={() => {
                                const newFaq = [...(parsedContent.faq || []), { question: "", answer: "" }];
                                updateField('faq', newFaq);
                            }}>+ Tambah FAQ</Button>
                        </div>
                        <div className="space-y-3">
                            {parsedContent.faq?.map((item: any, idx: number) => (
                                <div key={idx} className="space-y-2 p-3 bg-white dark:bg-black border rounded-md relative group">
                                    <Button type="button" variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                        const newFaq = [...(parsedContent.faq || [])];
                                        newFaq.splice(idx, 1);
                                        updateField('faq', newFaq);
                                    }}>&times;</Button>
                                    <Input value={item.question} onChange={(e) => {
                                        const newFaq = [...(parsedContent.faq || [])];
                                        newFaq[idx].question = e.target.value;
                                        updateField('faq', newFaq);
                                    }} placeholder="Pertanyaan" />
                                    <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={item.answer} onChange={(e) => {
                                        const newFaq = [...(parsedContent.faq || [])];
                                        newFaq[idx].answer = e.target.value;
                                        updateField('faq', newFaq);
                                    }} placeholder="Jawaban" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );
        }

        // Editor for Contact Page (Kontak)
        if (editForm.path === '/kontak') {
            return (
                <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-lg border-b pb-2">Edit Halaman Kontak</h3>
                    <div className="space-y-2">
                        <Label>Hero Title</Label>
                        <Input value={parsedContent.hero_title || ""} onChange={(e) => updateField('hero_title', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Hero Subtitle</Label>
                        <Input value={parsedContent.hero_subtitle || ""} onChange={(e) => updateField('hero_subtitle', e.target.value)} />
                    </div>

                    <div className="space-y-4 border-t pt-4">
                        <Label className="font-semibold">Informasi Kontak</Label>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2"><Label>Email</Label><Input value={parsedContent.email || ""} onChange={(e) => updateField('email', e.target.value)} /></div>
                            <div className="space-y-2"><Label>WhatsApp</Label><Input value={parsedContent.phone || ""} onChange={(e) => updateField('phone', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Instagram</Label><Input value={parsedContent.instagram || ""} onChange={(e) => updateField('instagram', e.target.value)} /></div>
                            <div className="space-y-2"><Label>Jam Operasional</Label><Input value={parsedContent.hours || ""} onChange={(e) => updateField('hours', e.target.value)} /></div>
                        </div>
                        <div className="space-y-2">
                            <Label>Alamat</Label>
                            <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={parsedContent.address || ""} onChange={(e) => updateField('address', e.target.value)} />
                        </div>
                    </div>
                </div>
            )
        }

        // Editor for Services Page (Layanan)
        if (editForm.path === '/layanan') {
            return (
                <div className="space-y-6 border rounded-lg p-4 bg-muted/20">
                    <h3 className="font-semibold text-lg border-b pb-2">Edit Halaman Layanan</h3>
                    <div className="space-y-2">
                        <Label>Hero Title</Label>
                        <Input value={parsedContent.hero_title || ""} onChange={(e) => updateField('hero_title', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label>Hero Subtitle</Label>
                        <textarea className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={parsedContent.hero_subtitle || ""} onChange={(e) => updateField('hero_subtitle', e.target.value)} />
                    </div>
                </div>
            )
        }

        // Generic / Fallback Editor (JSON)
        return (
            <div className="space-y-2">
                <Label>Konten JSON (Advanced)</Label>
                <textarea
                    className={`flex min-h-[200px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background font-mono ${jsonError ? "border-red-500" : ""}`}
                    value={editForm.content || ""}
                    onChange={(e) => handleContentChange(e.target.value)}
                    placeholder='{"key": "value"}'
                />
                {jsonError && <p className="text-xs text-red-500">{jsonError}</p>}
                <p className="text-xs text-muted-foreground">
                    Edit langsung data JSON untuk halaman ini.
                </p>
            </div>
        );
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
                                        <div className="space-y-6">
                                            <div className="grid md:grid-cols-2 gap-4">
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
                                            </div>

                                            {renderEditor()}

                                            <div className="flex justify-end gap-2 pt-4 border-t">
                                                <Button variant="outline" onClick={() => setEditingId(null)}>Batal</Button>
                                                <Button onClick={handleSave}>Simpan Perubahan</Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-start">
                                            <div className="space-y-1 w-full mr-4">
                                                <p className="font-bold text-lg text-foreground mb-2">{page.title}</p>
                                                <p className="text-sm text-muted-foreground">{page.description || "Tanpa deskripsi"}</p>

                                                {/* Smart Preview */}
                                                <div className="mt-3 text-xs bg-muted/50 p-3 rounded-md max-w-2xl">
                                                    {page.path === '/' ? (
                                                        <div className="space-y-1">
                                                            <p><span className="font-semibold">Hero:</span> {JSON.parse(page.content || "{}").hero_title || "-"}</p>
                                                            <p><span className="font-semibold">Features:</span> {JSON.parse(page.content || "{}").features?.length || 0} items</p>
                                                        </div>
                                                    ) : (
                                                        <span className="font-mono text-muted-foreground">
                                                            {page.content ? "Dynamic Content Configured" : "No dynamic content"}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <Button variant="outline" onClick={() => handleEdit(page)}>Edit Content</Button>
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
