import { groq } from '@ai-sdk/groq';
import { streamText } from 'ai';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase Client (Server-Side)
const supabaseUrl = process.env.VITE_SUPABASE_PROJECT_ID
    ? `https://${process.env.VITE_SUPABASE_PROJECT_ID}.supabase.co`
    : process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export default async function handler(req: Request) {
    try {
        const apiKey = process.env.GROQ_API_KEY;
        if (!apiKey) {
            console.error('GROQ_API_KEY is not set');
            return new Response(JSON.stringify({ error: 'Konfigurasi API Key belum diatur.' }), {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
            });
        }

        const { messages } = await req.json();

        // --- RAG: Fetch Product Data from Turso ---
        let productContext = "Data produk sedang tidak tersedia (gunakan pengetahuan umum).";

        try {
            // Dynamic import to avoid build issues if any
            const { db } = await import('./db.js');
            const { products } = await import('../src/db/schema.js');

            const productList = await db.select().from(products).limit(20);

            if (productList && productList.length > 0) {
                const formattedProducts = productList.map((p) => {
                    const price = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(p.price);
                    return `- ${p.name} (${p.category}): ${price}. Info: ${p.description || '-'}`;
                }).join('\n');
                productContext = `DAFTAR PRODUK & LAYANAN MOODLAB (Real-time):\n${formattedProducts}`;
            }
        } catch (err) {
            console.error("Turso Connection Error:", err);
            // Fallback: Continue without product data
        }
        // ---------------------------------------------

        const result = streamText({
            model: groq('llama-3.3-70b-versatile'),
            messages,
            system: `Anda adalah "Moodlab Assistant", AI support cerdas untuk Moodlab (Agensi Digital Marketing Gen Z).

            Tugas Utama:
            1. Mengonversi pengunjung menjadi klien dengan konsultasi ramah & solutif.
            2. Menjelaskan layanan Moodlab dengan bahasa yang "fun", profesional, tapi tetap "daging" (berisi).
            3. Mengarahkan user untuk menghubungi WhatsApp Admin jika butuh penawaran khusus.

            KONTEKS PRODUK/LAYANAN SAAT INI:
            ${productContext}

            Layanan Umum (Jika tidak ada di database):
            - Social Media Management: Konten kalender, copywriting, admin posting.
            - Content Creation: Video TikTok/Reels viral, desain feed estetik.
            - Digital Ads: Iklan tertarget (FB/IG/TikTok Ads) untuk ROI tinggi.
            - Branding: Logo, visual identity, brand voice.

            Gaya Bicara:
            - Gunakan bahasa Indonesia yang luwes, sopan, dan kekinian (style Gen Z profesional).
            - Boleh pakai emoji secukupnya agar tidak kaku 😊.
            - Jangan terlalu panjang lebar, langsung to the point ke solusi.

            Aturan Penting:
            - Jika user tanya harga spesifik dan ada di "KONTEKS PRODUK", sebutkan harganya. Jika tidak ada, jawab kisaran atau arahkan ke WA.
            - Jika user curhat bisnis sepi, berikan tips singkat lalu tawarkan jasa Moodlab sebagai solusi.
            - Jika ditanya hal di luar marketing/bisnis, tolak halus: "Waduh, kalau itu di luar keahlianku kak. Tapi kalau soal bikin brand kakak viral, aku jagonya! 🚀"`,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error('Error in chat API:', error);
        return new Response(JSON.stringify({ error: 'Maaf, sistem sedang sibuk. Silakan coba sesaat lagi.' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
        });
    }
}
