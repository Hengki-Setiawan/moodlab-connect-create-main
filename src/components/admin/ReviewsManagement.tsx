import React, { useState, useEffect } from 'react';
import { db } from '@/lib/turso';
import { reviews, products } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { generateReviewReply } from '@/lib/groq';
import { Loader2, MessageSquare, Sparkles, Save } from 'lucide-react';
import { toast } from 'sonner';

export function ReviewsManagement() {
    const [reviewList, setReviewList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyingId, setReplyingId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState("");
    const [aiLoading, setAiLoading] = useState(false);

    const fetchReviews = async () => {
        try {
            // Join with products to get product name
            const data = await db.select({
                id: reviews.id,
                user_name: reviews.user_name,
                rating: reviews.rating,
                comment: reviews.comment,
                reply: reviews.reply,
                created_at: reviews.created_at,
                product_name: products.name
            })
                .from(reviews)
                .leftJoin(products, eq(reviews.product_id, products.id))
                .orderBy(desc(reviews.created_at));

            setReviewList(data);
        } catch (error) {
            console.error("Failed to fetch reviews:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReviews();
    }, []);

    const handleGenerateReply = async (review: any) => {
        setAiLoading(true);
        try {
            const sentiment = review.rating >= 4 ? "Positif" : review.rating === 3 ? "Netral" : "Negatif";
            const generated = await generateReviewReply(review.comment, sentiment);
            setReplyText(generated);
        } catch (error) {
            toast.error("Gagal generate balasan AI");
        } finally {
            setAiLoading(false);
        }
    };

    const handleSaveReply = async (id: number) => {
        try {
            await db.update(reviews)
                .set({ reply: replyText })
                .where(eq(reviews.id, id));

            toast.success("Balasan disimpan");
            setReplyingId(null);
            fetchReviews();
        } catch (error) {
            toast.error("Gagal menyimpan balasan");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Manajemen Ulasan</h2>
                <Button onClick={fetchReviews} variant="outline" size="sm">Refresh</Button>
            </div>

            <div className="bg-white rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Tanggal</TableHead>
                            <TableHead>Produk</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Rating</TableHead>
                            <TableHead className="w-[300px]">Ulasan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Memuat data...</TableCell>
                            </TableRow>
                        ) : reviewList.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8">Belum ada ulasan masuk.</TableCell>
                            </TableRow>
                        ) : (
                            reviewList.map((review) => (
                                <TableRow key={review.id}>
                                    <TableCell>{new Date(review.created_at).toLocaleDateString('id-ID')}</TableCell>
                                    <TableCell className="font-medium">{review.product_name || "Unknown Product"}</TableCell>
                                    <TableCell>{review.user_name}</TableCell>
                                    <TableCell>
                                        <span className={`font-bold ${review.rating >= 4 ? 'text-green-600' : 'text-orange-500'}`}>
                                            {review.rating} ★
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-sm text-gray-600">{review.comment}</TableCell>
                                    <TableCell>
                                        {review.reply ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">Dibalas</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">Pending</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Dialog open={replyingId === review.id} onOpenChange={(open) => {
                                            if (open) {
                                                setReplyingId(review.id);
                                                setReplyText(review.reply || "");
                                            } else {
                                                setReplyingId(null);
                                            }
                                        }}>
                                            <DialogTrigger asChild>
                                                <Button variant="ghost" size="sm">
                                                    <MessageSquare className="w-4 h-4 mr-1" /> Balas
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Balas Ulasan {review.user_name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="bg-slate-50 p-3 rounded text-sm italic text-gray-600">
                                                        "{review.comment}"
                                                    </div>

                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-sm font-medium">Balasan Kamu</label>
                                                            <Button
                                                                variant="outline"
                                                                size="xs"
                                                                onClick={() => handleGenerateReply(review)}
                                                                disabled={aiLoading}
                                                                className="h-7 text-purple-600 border-purple-200 hover:bg-purple-50"
                                                            >
                                                                {aiLoading ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Sparkles className="w-3 h-3 mr-1" />}
                                                                Auto-Reply AI
                                                            </Button>
                                                        </div>
                                                        <Textarea
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            rows={5}
                                                            placeholder="Tulis balasan..."
                                                        />
                                                    </div>

                                                    <Button onClick={() => handleSaveReply(review.id)} className="w-full">
                                                        <Save className="w-4 h-4 mr-2" /> Simpan Balasan
                                                    </Button>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
