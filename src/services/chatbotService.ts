/**
 * Chatbot Service
 * Fetches data from Supabase to provide context for the AI chatbot.
 */

import { db } from '@/lib/turso';
import { products as productsSchema } from '@/db/schema';
import { desc } from 'drizzle-orm';

export interface ProductData {
    name: string;
    price: number;
    category: string;
    description: string | null;
    type: string | null;
}

/**
 * Fetches all products from Turso and formats them for the chatbot context.
 */
export async function fetchChatbotContext(): Promise<string> {
    try {
        // Fetch products from Turso
        const products = await db.select().from(productsSchema).orderBy(desc(productsSchema.created_at));

        if (!products || products.length === 0) {
            return 'Belum ada produk yang tersedia.';
        }

        // Format products into readable text
        const formattedProducts = products.map((p) => {
            const priceFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(p.price);

            return `- ${p.name} (${p.category}): ${priceFormatted} - ${p.description || ''}`;
        }).join('\n');

        return `
KATALOG PRODUK MOODLAB (Data Real-Time dari Database):
${formattedProducts}

Catatan: Semua produk di atas adalah produk digital yang langsung bisa diakses setelah pembayaran.
`;
    } catch (error) {
        console.error('Error in fetchChatbotContext:', error);
        return 'Gagal memuat data produk.';
    }
}
