
import { useState, useEffect } from "react";
import { Star, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { db } from "@/lib/turso";
import { reviews } from "@/db/schema";
import { toast } from "sonner";
import { eq, desc } from "drizzle-orm";

interface ReviewSectionProps {
    productId: number;
}

export function ReviewSection({ productId }: ReviewSectionProps) {
    const [reviewList, setReviewList] = useState<any[]>([]);
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState("");
    const [name, setName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (productId) fetchReviews();
    }, [productId]);

    const fetchReviews = async () => {
        try {
            const data = await db.select()
                .from(reviews)
                .where(eq(reviews.product_id, productId))
                .orderBy(desc(reviews.created_at));
            setReviewList(data);
        } catch (error) {
            console.error("Failed to fetch reviews", error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rating === 0) {
            toast.error("Silakan berikan rating bintang!");
            return;
        }

        setIsSubmitting(true);
        try {
            await db.insert(reviews).values({
                product_id: productId,
                user_name: name || "Anonymous",
                rating,
                comment,
                created_at: new Date()
            });
            toast.success("Terima kasih atas ulasan Anda!");
            setRating(0);
            setComment("");
            setName("");
            fetchReviews();
        } catch (error) {
            toast.error("Gagal mengirim ulasan");
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderStars = (count: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                        key={s}
                        className={`w-4 h-4 ${s <= count ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <div className="space-y-8 py-8 border-t">
            <h3 className="text-2xl font-bold">Ulasan Pembeli ({reviewList.length})</h3>

            <div className="grid md:grid-cols-2 gap-12">
                {/* Review List */}
                <div className="space-y-6">
                    {reviewList.length === 0 && (
                        <p className="text-muted-foreground text-sm">Belum ada ulasan. Jadilah yang pertama mereview!</p>
                    )}
                    {reviewList.map((review) => (
                        <div key={review.id} className="bg-neutral-50 dark:bg-neutral-900 p-4 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                                        <User className="w-4 h-4" />
                                    </div>
                                    <span className="font-semibold text-sm">{review.user_name}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                    {review.created_at ? new Date(review.created_at).toLocaleDateString("id-ID") : "-"}
                                </span>
                            </div>
                            {renderStars(review.rating)}
                            <p className="text-sm text-neutral-600 dark:text-neutral-300">{review.comment}</p>
                            {review.reply && (
                                <div className="bg-indigo-50 dark:bg-indigo-950/30 p-3 rounded-lg text-xs leading-relaxed ml-4 border-l-2 border-indigo-400">
                                    <span className="font-bold text-indigo-600 dark:text-indigo-400">Admin:</span> {review.reply}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Review Form */}
                <div className="bg-white dark:bg-neutral-950 p-6 rounded-2xl border shadow-sm h-fit">
                    <h4 className="font-bold mb-4">Tulis Ulasan Anda</h4>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Rating</label>
                            <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setRating(s)}
                                        className="focus:outline-none transition-transform hover:scale-110"
                                    >
                                        <Star
                                            className={`w-6 h-6 ${s <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Nama</label>
                            <Input
                                placeholder="Nama Anda (Opsional)"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium">Ulasan</label>
                            <Textarea
                                placeholder="Bagaimana pengalaman Anda menggunakan produk ini?"
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? "Mengirim..." : "Kirim Ulasan"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}
