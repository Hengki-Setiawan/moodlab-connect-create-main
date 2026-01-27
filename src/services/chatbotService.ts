/**
 * Chatbot Service
 * Fetches data from Supabase to provide context for the AI chatbot.
 */

import { supabase } from '@/integrations/supabase/client';

export interface ProductData {
    name: string;
    price: number;
    category: string;
    description: string;
    type: string;
}

/**
 * Fetches all products from Supabase and formats them for the chatbot context.
 */
export async function fetchChatbotContext(): Promise<string> {
    try {
        // Fetch products
        const { data: products, error: productsError } = await supabase
            .from('products')
            .select('name, price, category, description, type')
            .order('name');

        if (productsError) {
            console.error('Error fetching products for chatbot:', productsError);
            return 'Data produk tidak tersedia saat ini.';
        }

        if (!products || products.length === 0) {
            return 'Belum ada produk yang tersedia.';
        }

        // Format products into readable text
        const formattedProducts = (products as ProductData[]).map((p) => {
            const priceFormatted = new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
            }).format(p.price);

            return `- ${p.name} (${p.category}): ${priceFormatted} - ${p.description}`;
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
