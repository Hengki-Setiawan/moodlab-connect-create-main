import React, { useState, useEffect } from 'react';
import { Star, Send, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { db } from '@/lib/turso';
import { reviews } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { toast } from 'sonner';

interface ReviewSectionProps {
    productId: number;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
    const [reviewList, setReviewList] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);

    // Form State
    const [userName, setUserName] = useState("");
    const [rating, setRating] = useState(5);
    const [comment, setComment] = useState("");

    const fetchReviews = async () => {
        try {
            const data = await db.select().from(reviews)
                .where(eq(reviews.product_id, productId))
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
    }, [productId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userName || !comment) {
            toast.error("Mohon lengkapi nama dan ulasan");
            return;
        }

        setSubmitting(true);
        try {
            await db.insert(reviews).values({
                product_id: productId,
                user_name: userName,
                rating: rating,
                comment: comment,
            });
            toast.success("Ulasan berhasil dikirim!");
            setUserName("");
            setComment("");
            setRating(5);
            fetchReviews();
        } catch (error) {
            console.error("Failed to submit review:", error);
            toast.error("Gagal mengirim ulasan");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="mt-12 border-t pt-8">
            <h2 className="text-2xl font-bold mb-6">Ulasan Pelanggan</h2>

            {/* Review Form */}
            <div className="bg-slate-50 p-6 rounded-xl mb-8 border border-slate-100">
                <h3 className="font-semibold mb-4">Tulis Ulasan</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium mb-1">Rating</label>
                        <div className="flex gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`focus:outline-none transition-colors ${rating >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    <Star className="w-6 h-6 fill-current" />
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Nama</label>
                        <Input
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Nama kamu"
                            className="bg-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Ulasan</label>
                        <Textarea
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Ceritakan pengalamanmu..."
                            className="bg-white"
                            rows={3}
                        />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                        {submitting ? "Mengirim..." : (
                            <>
                                <Send className="w-4 h-4 mr-2" /> Kirim Ulasan
                            </>
                        )}
                    </Button>
                </form>
            </div>

            {/* Reviews List */}
            {loading ? (
                <p className="text-center text-gray-500">Memuat ulasan...</p>
            ) : reviewList.length === 0 ? (
                <p className="text-center text-gray-500 italic">Belum ada ulasan. Jadilah yang pertama!</p>
            ) : (
                <div className="space-y-6">
                    {reviewList.map((review) => (
                        <div key={review.id} className="border-b pb-6 last:border-0">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center">
                                        <User className="w-4 h-4 text-slate-500" />
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm">{review.user_name}</p>
                                        <div className="flex text-yellow-400">
                                            {[...Array(review.rating)].map((_, i) => (
                                                <Star key={i} className="w-3 h-3 fill-current" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400">
                                    {new Date(review.created_at).toLocaleDateString('id-ID')}
                                </span>
                            </div>
                            <p className="text-gray-700 text-sm leading-relaxed ml-10">
                                {review.comment}
                            </p>
                            {review.reply && (
                                <div className="mt-3 ml-10 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                    <p className="text-xs font-bold text-purple-700 mb-1">Respon Moodlab:</p>
                                    <p className="text-xs text-purple-800">{review.reply}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
